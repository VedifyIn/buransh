---
id: review-designing-data-intensive-applications
title: 'Review: Designing Data-Intensive Applications'
description: >-
  A critical review of Kleppmann's modern classic — what it gets right, what it
  misses, and who should read it.
type: BookReview
datePublished: '2026-07-05'
dateModified: '2026-07-22'
author: priya-patel
status: published
tags:
  - book-review
  - databases
  - distributed-systems
topic: technology
book:
  title: Designing Data-Intensive Applications
  author: Martin Kleppmann
  publisher: O'Reilly Media
  publicationDate: '2017'
rating:
  value: 4.8
  bestRating: 5
  worstRating: 1
---

## The case for the book

Most engineering books either go deep on one topic or skim many. DDIA threads an unusual needle: it covers an enormous surface area without sacrificing depth. The chapters on replication and consensus are worth the cover price alone. Kleppmann explains Raft, Paxos, and two-phase commit with a clarity I have not seen anywhere else.

## Where it shows its age

Published in 2017, the book predates the explosion of cloud-native data infrastructure. There is no meaningful coverage of CRDTs, no serious treatment of lakehouse architectures, and the stream-processing chapter feels quaint next to modern systems like Materialize or RisingWave. None of this is the author's fault, but a reader should pair the book with more recent material for the last mile.

## Who should read it

Any engineer who designs or operates systems that touch more than one machine. That is most of us. Even if you have been in the industry for a decade, the book will sharpen vocabulary you have been using sloppily — eventual consistency, linearizability, isolation levels — and that sharpening is worth the time.
