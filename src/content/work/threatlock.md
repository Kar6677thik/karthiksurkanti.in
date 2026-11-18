---
title: ThreatLock
order: 1
year: '2026'
kind: Stolen-session response
pitch: Detects account takeover from the activity stream, decides with each organisation's own policy, and revokes the attacker's sessions within about 200 ms.
inspiredBy: Slack's Anomaly Event Response
github: https://github.com/Kar6677thik/ThreatLock
stack: ['.NET 10', 'ASP.NET Core', 'PostgreSQL 17', 'Redis 8', 'React 19', 'OpenTelemetry']
naive:
  value: '149.5 s'
  label: a revoked token keeps working (2-minute tokens)
fixed:
  value: '14 ms'
  label: the next request is rejected
conditions: Local runs on an Intel Core Ultra 5 225H laptop with Docker Desktop.
media:
  src: /media/threatlock/demo.gif
  poster: /media/threatlock/poster.webp
  alt: Two browser windows side by side. On the right, an attacker using a stolen session is signed out on their first click, while the anomaly timeline and a verified audit chain appear.
  caption: The same attack against an observe-only policy (left) and the default policy (right). The attacker is signed out on their first click.
  width: 1328
  height: 676
---

## The problem

An attacker with a stolen password or token keeps working inside an organisation's app. A response system fails in two ways: it's too slow or gets lost, so a stolen token keeps working for an hour, or it fires on the wrong people, signing out a whole office because it shares a VPN.

ThreatLock is a learning-scale rebuild of Slack's Anomaly Event Response, built around a multi-tenant notes app with real logins.

## The design

- **Revocable sessions.** A 5-minute JWT carries a session id that every request checks against Redis, falling back to PostgreSQL. If neither answers, the request is refused: the system fails closed. Refresh tokens rotate, and reusing one kills the session.
- **Two queues, on purpose.** Activity events go through a Redis Stream fed by a PostgreSQL outbox, because they're high-volume and losing one is tolerable. Response jobs are written to PostgreSQL in the same transaction as their anomaly, because they must never be lost.
- **Five detectors:** Tor exit nodes, impossible travel, scraping against an EWMA baseline, a new device followed by an export, and session hijack. They run on event time, never the wall clock, so a day of traffic replays in seconds.
- **Policy is data.** Each organisation has a versioned policy with a mode per detector (off, observe, notify, respond), plus trusted networks and exclusions.
- **An idempotent responder.** Jobs are claimed with `FOR UPDATE SKIP LOCKED` and a 60-second lease, and each step's marker commits together with its effect, so a crash never repeats a notification.
- **A tamper-evident audit log:** a per-organisation SHA-256 hash chain behind an append-only trigger.

## What I measured

Each failure was reproduced with a naive version first, then fixed and measured again.

| Experiment | Naive | Fixed |
| --- | --- | --- |
| A revoked token keeps working | 149.5 s with 2-minute tokens; about an hour with 60-minute tokens | rejected on the next request (14 ms round trip) |
| A replayed session cookie, 10 trials | still working after 15 s in 10 of 10 | revoked in 10 of 10 |
| VPN users on a shared exit | 499 of 500 signed out | 0 of 500 signed out; attacks still caught 100 of 100 |
| Responder crashes, 100 injected | 532 notifications where 300 were expected, 34 stale cache entries | 300 of 300, 0 stale |
| An audit row edited by a database superuser | not detected | named as "seq 3, hash_mismatch"; 1,003 entries verified in 23 ms |

Time to revoke under a live attack, measured at the client:

| Attack | Revoked | p50 | p95 | p99 |
| --- | --- | --- | --- | --- |
| Login from a Tor exit | 200 of 200 | 176 ms | 199 ms | 202 ms |
| Replayed token (hijack) | 200 of 200 | 132 ms | 142 ms | 193 ms |

Detection accuracy on a seeded dataset of 1,000 benign and 200 malicious users (2,908,713 events, replayed in 17.0 s): recall 100% (200 of 200), and a false-positive rate of 14.3%. Excluding one expected migration export, that's 0.1% (1 of 858). Checking a session costs about 0.6 ms per request at p50. Throughput hasn't been measured.

## Try it

```sh
git clone https://github.com/Kar6677thik/ThreatLock.git && cd ThreatLock
docker compose -f deploy/compose/docker-compose.yml up -d --wait
scripts/download-geoip.sh
dotnet run --project src/ThreatLock.Api
dotnet run --project src/ThreatLock.Worker
cd web && npm install && npm run dev
```
