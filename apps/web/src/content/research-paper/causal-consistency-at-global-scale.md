---
id: causal-consistency-at-global-scale
title: 'Causal Consistency at Global Scale: A Practical Re-evaluation'
description: >-
  A 2026 reassessment of causal consistency in geo-replicated systems, with
  new empirical results from production workloads.
type: ResearchPaper
datePublished: '2026-07-01'
dateModified: '2026-07-22'
author: L. Hoffmann, M. Chen, R. Patel
status: published
tags:
  - distributed-systems
  - causal-consistency
  - geo-replication
  - evaluation
topic: technology
journal: Journal of Distributed Systems
doi: 10.1145/3649901
citation: 'Hoffmann, L., Chen, M., & Patel, R. (2026). Causal Consistency at Global Scale: A Practical Re-evaluation. Journal of Distributed Systems, 42(7), 1-28.'
---

## Abstract

Causal consistency has long been proposed as a sweet spot between availability and consistency for geo-replicated systems, yet adoption remains limited. We present the first large-scale empirical study of causal consistency in production, analyzing 18 months of operation across three deployments spanning four continents. We identify the specific workload patterns under which causal protocols degrade, and propose two protocol refinements — _lazy metadata compaction_ and _speculative dependency resolution_ — that reduce tail latency by 3.1x without sacrificing safety guarantees. Our refinements have been implemented in two open-source systems and are in production use.

## 1. Introduction

The CAP theorem establishes that no distributed system can simultaneously provide consistency, availability, and partition tolerance. Causal consistency has been positioned as a practical compromise: it preserves causality (a stronger property than eventual consistency) while remaining available under partitions. Despite a decade of academic interest, production adoption has been sparse.

This paper investigates why. We instrument three production deployments — a social network, a collaborative document editor, and a financial ledger — and collect detailed traces over 18 months.

## 2. Background

Causal consistency requires that operations related by causality appear in the same order at all replicas, while concurrent operations may appear in different orders. The classical implementation uses vector clocks, which grow linearly with the number of clients and become impractical at scale.
