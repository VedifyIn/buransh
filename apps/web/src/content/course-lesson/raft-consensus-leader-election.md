---
id: raft-consensus-leader-election
title: 'Raft Consensus: Leader Election Deep Dive'
description: >-
  A deep dive into Raft's leader election mechanism, including terms,
  randomized timers, and failure scenarios.
type: CourseLesson
datePublished: '2026-07-10'
dateModified: '2026-07-22'
author: aisha-karim
status: published
tags:
  - raft
  - consensus
  - distributed-systems
topic: technology
difficulty: Intermediate
---

## Lesson summary

Raft uses randomized election timeouts to split votes between candidates and avoid livelock. In this lesson we walk through the term-based protocol, the RequestVote RPC, and what happens when a leader fails mid-election.

### Key takeaways

- Terms are monotonic and act as a logical clock.
- Election timeouts are randomized in a 150-300ms window.
- A candidate wins with a majority; otherwise a new term starts.
