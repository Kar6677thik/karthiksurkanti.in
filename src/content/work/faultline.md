---
title: faultline
order: 5
year: '2026'
kind: Testing business rules under failure
pitch: Tests whether backend business rules survive retries, faults and restarts, judged by the database's real state rather than HTTP status codes.
github: https://github.com/Kar6677thik/faultline
stack: ['Python 3.12', 'FastAPI', 'PostgreSQL 17', 'Toxiproxy', 'Docker', 'React 19']
naive:
  value: '2'
  label: ₹2,000 debits for one purchase in the unsafe app
fixed:
  value: '1'
  label: debit in the correct app; faultline tells them apart 20 of 20 times
conditions: Windows 11 with Debian on WSL2 and Docker Engine, 14 CPUs and about 7.2 GiB in the Docker VM.
---

## The problem

A retried or interrupted request can debit a wallet twice, leave a transfer half done or lose an update, while every HTTP status code still looks fine. faultline answers one question: under this declared failure, did my application keep its business rules, and what evidence lets me investigate?

It's for a backend engineer running a trusted app locally or in disposable CI, and for a reviewer who wants to examine a saved failure without rerunning it.

## The design

- **Scenarios are data.** Strict YAML files are expanded into a saved plan before anything runs, with concurrency from 1 to 32, explicit retry policies, barriers and dependency gates.
- **Rules come from the app's owner.** A small Python adapter supplies fixtures and invariants; faultline doesn't guess the business rules.
- **Real faults.** A response that arrives but is hidden from the client, so it times out and retries. Database latency and disconnects through Toxiproxy. A SIGKILL and restart of the app. For transfers, a crash exactly between the debit and the credit. A fault only counts once it's confirmed as applied.
- **Judged against the database.** Every run gets its own containers on isolated networks. A read-only observer takes full snapshots, and the verifier is never told which version of the app ran.
- **Four honest verdicts:** pass, fail, inconclusive and error, each with its own exit code. An error never counts as a reproduction.
- **Smaller reproductions.** A failing run can be replayed exactly or reduced with delta debugging. A step is removed only after three matching fresh trials, and the result is called a "smaller reproduction", never "minimal".

## What I measured

| Run | Result |
| --- | --- |
| Hidden response, unsafe app, 20 trials | 20 of 20 judged a business failure (two ₹2,000 debits) |
| Hidden response, correct app, 20 trials | 20 of 20 pass |
| Six apps, each with one planted defect | all six caught in single-trial probes |
| Crash between debit and credit | found in 6 of 20 trials |
| Reducing a failing scenario | 20, 1, 21 operations down to 1, 1, 2 (95% fewer), in 41 trials and 747.6 s |
| Final regression suite | 42 passed in 1,292.55 s; 349 unit and 19 viewer tests passed |

A warm reference run takes about 20–25 s. The calibrated release (milestone 4) is still in progress.

## Try it

On Linux or WSL2 with Docker:

```sh
git clone https://github.com/Kar6677thik/faultline.git && cd faultline
uv sync --frozen
scripts/build-images.sh
.venv/bin/faultline run examples/orders/lost-response.yaml --variant unsafe   # fails: two debits
.venv/bin/faultline run examples/orders/lost-response.yaml --variant correct  # passes: one debit
```
