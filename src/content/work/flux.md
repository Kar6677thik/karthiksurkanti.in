---
title: Flux
order: 3
year: '2026'
kind: Multi-tenant API gateway
pitch: A multi-tenant API gateway whose rate limits hold across every instance, and which keeps taking payments when Redis goes down.
inspiredBy: Razorpay's Edge gateway
github: https://github.com/Kar6677thik/Flux
stack: ['.NET 10', 'YARP', 'Redis 7.4', 'Lua', 'PostgreSQL 17', 'Polly', 'k6']
naive:
  value: '1,825'
  label: requests let through a 610 limit by 3 gateways
fixed:
  value: '609'
  label: requests let through the same limit
conditions: Intel Core Ultra 5 225H, Docker Desktop on WSL2, with k6 limited to 2 CPUs.
media:
  src: /media/flux/demo.svg
  alt: A terminal recording. An authenticated request returns rate-limit headers, a burst of 25 refunds gets 2 allowed and 23 rejected, Redis is stopped and payments continue in degraded mode while refunds return 503, then Redis recovers.
  caption: About 30 seconds of Flux. Note what happens to payments and refunds when Redis stops.
  width: 1000
  height: 738
charts:
  - src: /media/flux/limits.svg
    alt: Bar chart of requests allowed against a limit of 610. Per-instance buckets let through about three times the limit; the shared Redis bucket stays at the limit.
    caption: Requests allowed against a 610 limit, per-instance buckets vs. one shared Redis bucket.
    width: 657
    height: 245
  - src: /media/flux/outage-latency.svg
    alt: Line chart of payments p99 latency per second during a Redis outage on a log scale. With client defaults latency climbs to about six seconds; with the resilient settings it stays near normal.
    caption: Payments p99 during a Redis outage, with client defaults vs. the resilient settings (log scale).
    width: 542
    height: 293
---

## The problem

Payment platforms serve many merchants through one gateway, each with its own limits per route. Two easy mistakes break that. A fixed window lets a merchant burst through at the window boundary, and a single global limit lets one noisy client starve the rest. Run several gateway instances and two more appear: every instance enforces the limit separately, so the real limit multiplies, and the rate limiter becomes the thing that takes payments down when it fails.

Flux is a learning-scale rebuild of the multi-tenant rate limiter in Razorpay's Edge gateway.

## The design

- **One request path:** nginx, then three gateways, then YARP forwarding to payment and refund backends. Every request is authenticated by API key and mapped to a merchant whose plan sets a limit per route group.
- **A token bucket, not a window.** It refills lazily and is kept per merchant and route group, so there's no boundary burst.
- **One atomic Lua script.** Refill, check, spend, write and expire all run in a single Redis script, so there's no read-modify-write race between gateways. The script reads Redis's own clock, so clock skew between gateways can't mint tokens.
- **Degraded mode decided by money.** Every Redis call has a 50 ms timeout behind a circuit breaker. When Redis is unavailable, payments fall back to a local bucket sized at a share of the limit and are marked degraded, while refunds fail closed with a 503. Money coming in keeps flowing; money going out waits.
- **Swappable algorithms.** In-memory token bucket, fixed window and Redis token bucket sit behind one interface, so each failure can be reproduced on demand.

## What I measured

| Experiment | Before | After |
| --- | --- | --- |
| Three gateways, limit 610, 100 req/s for 60 s | 1,822–1,825 allowed (2.99× the limit) | 608–609 allowed (within 0.3%) |
| Fixed window at the boundary, 10 req/s plan | 200 of 200 admitted within ~235 ms | the token bucket admits 10–12 |
| Redis outage, client defaults vs. resilient | requests block ~5.5 s, then fail with 500 | payments 100% served in degraded mode; refunds refused in ~1.1 ms (p50) |
| Recovery after the outage | 168 spurious 429s, 240 dropped iterations | 4.1–4.6 s, no replay burst, 0 dropped |

Gateway overhead at 500 req/s: p50 0.30–0.71 ms and p99 1.08–1.57 ms over 30,001 requests, all 200. The Redis check is about 86% of it. A noisy neighbour flooding at 100× its limit didn't raise the quiet merchant's p95. One known limit: when Redis is paused rather than stopped, the first ~2 s run 60–75 ms slower than normal, above the 50 ms target.

## Try it

```sh
git clone https://github.com/Kar6677thik/Flux.git && cd Flux
docker compose -f deploy/compose/docker-compose.yml -f deploy/compose/docker-compose.ghcr.yml --profile single up -d
curl -i localhost:8080/v1/payments/pay_1 -H "Authorization: Bearer flux_devQuietShopimg7Ccuzt5fONTt77X0UcK82ZspFVHT"
```

The key is a development key seeded into the local database.
