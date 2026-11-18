---
title: CounterShift
order: 4
year: '2026'
kind: Fraud counters and a live migration
pitch: A fraud-counter service that answers time-windowed questions, and migrates its own storage from PostgreSQL to Redis with zero downtime.
inspiredBy: Grab's Counter Service migration
github: https://github.com/Kar6677thik/CounterShift
stack: ['.NET 10', 'PostgreSQL 17', 'Redis 8', 'Lua', 'FsCheck', 'k6', 'OpenTelemetry']
naive:
  value: '1,050'
  label: of 50,000 increments kept by read-modify-write
fixed:
  value: '50,000'
  label: of 50,000 kept by an atomic upsert
conditions: Intel Core Ultra 5 225H, Docker Desktop on WSL2, with the API, both databases, Prometheus and k6 on one machine.
charts:
  - src: /media/countershift/rehearsal.svg
    alt: Chart of p99 latency for every step of the migration on a log scale, from PostgreSQL only through dual writes, shadow reads and split reads to Redis only, with the rollback marked.
    caption: p99 latency at every step of the live migration, with the config-only rollback marked.
    width: 632
    height: 308
  - src: /media/countershift/lost-updates.svg
    alt: Bar chart of increments kept and throughput for four write strategies. Read-modify-write keeps almost none; the atomic upsert keeps all of them at the highest throughput.
    caption: Increments kept and throughput for each write strategy, 50 writers × 1,000 increments.
    width: 776
    height: 230
---

## The problem

Fraud rules ask questions about time: more than 5 failed payments on this card in the last 10 minutes? A service can't scan raw events on every request at high traffic, so counts are added into time buckets as events arrive and summed when a rule asks. Then the storage that worked at first becomes the bottleneck, and it has to be replaced while traffic keeps flowing, with every step reversible.

CounterShift is a learning-scale rebuild of Grab's Counter Service and its zero-downtime storage migration.

## The design

- **Time buckets.** UTC-aligned buckets of a minute, 15 minutes, an hour and a day. Each query's window is split into the fewest buckets that cover it, which property tests check against a brute-force answer.
- **Writes that don't lose updates.** In PostgreSQL, one multi-row upsert per event, with rows sorted so locks are always taken in the same order. In Redis, one hash per counter, written by a Lua script with per-field expiry.
- **A storage seam.** One interface sits behind a facade, and architecture tests prove the API never touches a database driver directly.
- **A migration in phases:** PostgreSQL only, then dual writes, a backfill of buckets that can no longer change, shadow reads compared bucket by bucket, split reads, Redis as primary, and finally Redis only.
- **A stable split.** Traffic is split by a hash of the counter key, so a given card always reads from the same store. `GetHashCode` sent the same key to 3 different buckets in 3 processes; XxHash64 gives the same answer every time.
- **Config, not deploys.** The current phase lives in a watched file and reloads live. Unsafe combinations are refused and the last good mode stays in force, so cutover and rollback are edits, not releases.

## What I measured

| Experiment | Naive | Fixed |
| --- | --- | --- |
| 50 writers × 1,000 increments on one bucket | 1,050 of 50,000 kept (97.9% lost) at 1,479/s | 50,000 of 50,000 at 7,840/s |
| 10 writers updating rows in shuffled order | 297 of 300 deadlocked, 2,970 increments lost, 282.32 s | 0 deadlocks in 0.09 s (sorted order) |
| Switching stores by config, without migrating data | a card with 6 failed payments goes from block to allow | the phased migration keeps the decision |

The full migration rehearsal at 600 requests a second:

- 371,832 requests, 0 failed.
- 0 parity mismatches in 36,491 shadow comparisons.
- A config-only rollback applied in 333 ms.
- Moving from PostgreSQL only to Redis only: event p99 from 5.0 ms to 2.8 ms, and decision p50 from 1.5 ms to 0.7 ms.
- The backfill scanned 401,218 buckets and copied 188,899 in 18.8 s.

For 1M events, Redis held the same 3,356,445 buckets in 196.5 MiB of RAM, against 552.1 MiB on disk for PostgreSQL, and wrote 15,045 events/s against 4,792. One latency spike during the 70% split step (PostgreSQL write p99 192.8 ms) is still unexplained.

## Try it

```sh
git clone https://github.com/Kar6677thik/CounterShift.git && cd CounterShift
docker compose -f deploy/compose/docker-compose.yml -f deploy/compose/docker-compose.ghcr.yml up -d
load/demo.sh
```
