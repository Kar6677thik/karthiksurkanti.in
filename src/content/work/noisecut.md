---
title: noisecut
order: 2
year: '2026'
kind: Real-time alerting on a stream
pitch: Real-time business alerting on a Kafka-compatible stream that catches real incidents within seconds and keeps one incident to one message.
github: https://github.com/Kar6677thik/noisecut
stack: ['.NET 10', 'Redpanda', 'PostgreSQL 17', 'k3s', 'OpenTelemetry', 'Grafana']
naive:
  value: '1,110'
  label: notifications for 8 incidents in an alert storm
fixed:
  value: '2'
  label: notifications for the same 8 incidents
conditions: Laptop runs on Docker Desktop (14 vCPUs, 7.7 GB). The repo calls them laptop numbers, not benchmarks.
media:
  src: /media/noisecut/demo.webp
  poster: /media/noisecut/poster.webp
  alt: Two alerting dashboards side by side during the same storm. The naive one on the left fills with hundreds of notifications; the noisecut one on the right shows a couple of grouped incidents.
  caption: The same 8-restaurant storm through the naive pipeline (left) and noisecut (right), at 5× speed.
  width: 1200
  height: 1432
---

## The problem

A food-delivery platform streams order events, and declarative rules have to catch late kitchens, cancellation spikes and orders nobody picks up. Two problems wreck production alerting: alerts that go missing or arrive twice when consumers crash, rebalance or fall behind, and alert storms that train people to ignore the channel.

## The design

- **One pipeline:** a simulator produces order events keyed by restaurant across 6 partitions. Three rule engines share one consumer group, and a notifier delivers to a live dashboard, a signed webhook and email.
- **Checkpoints that can't lose data.** Each partition has its own rule engine. A checkpoint flushes the producer, then writes the window state and the next offset in one PostgreSQL transaction, so a crash can only replay records, never drop them.
- **Fencing.** Epoch tokens and static group membership stop a "zombie" engine from overwriting its successor, and a restart doesn't rebalance the rest of the group.
- **Event time.** Per-partition watermarks with 2 minutes of allowed lateness. Anything later goes to its own topic instead of firing false alerts.
- **Cross-partition rules.** Zone-level rules get a repartition topic of partial counts, merged at the lowest watermark: a shuffle, done by hand.
- **The noise pipeline.** Engines emit only state changes. The notifier then deduplicates, applies cooldowns, groups by zone and escalates, and delivers through a transactional outbox with an idempotency key on every webhook.
- **Naive mode kept on purpose.** Every safeguard has a naive twin behind one switch, so each failure can be replayed side by side.

## What I measured

The alert storm from the demo, after 125 s:

| | Naive | noisecut |
| --- | ---: | ---: |
| Incidents detected | 8 of 8 | 8 of 8 |
| Candidates reaching the notifier | 555 | 8 |
| Notifications | 1,110 | 2 |
| Duplicate webhooks | 547 | 0 |

Engines killed mid-stream, 20 kills at twice the normal load: 21 of 21 incidents detected in 19.3–29.2 s, with 0 extra alerts and 0 duplicate webhooks out of 41 receipts.

Out-of-order events, with 1% of events held back: the naive version raised 61 false "stuck pickup" alerts; noisecut raised 0. After a 120 s consumer pause and a 27,207-record backlog, the naive version fired 6 delay bursts and 1,428 false alerts; noisecut fired 0.

End-to-end latency with one engine:

| Load | Events/s | p50 | p95 | p99 |
| --- | ---: | ---: | ---: | ---: |
| 1× | 172 | 8 ms | 10 ms | 41 ms |
| 2× | 389 | 8 ms | 10 ms | 27 ms |
| 4× | 782 | 8 ms | 10 ms | 166 ms |

On a k3s rehearsal, a killed engine pod was back and ready in 3 s.

## Try it

```sh
git clone https://github.com/Kar6677thik/noisecut.git && cd noisecut
docker compose -f deploy/compose/docker-compose.yml up -d --build
NO_START=1 ./scripts/demo.sh
```
