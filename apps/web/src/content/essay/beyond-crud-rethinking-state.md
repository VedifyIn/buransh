---
id: beyond-crud-rethinking-state
title: 'Beyond CRUD: Rethinking State in Modern Applications'
description: >-
  An essay on why traditional CRUD architectures break down at scale, and how
  event sourcing offers a path forward.
type: Essay
datePublished: '2026-06-15'
dateModified: '2026-07-22'
author: marcus-chen
status: published
tags:
  - architecture
  - event-sourcing
  - databases
  - distributed-systems
topic: technology
readingTime: 12
---

## Introduction

If you've built a web application in the last decade, you've almost certainly modeled your data using CRUD. A row in a database table represents an entity, and updates overwrite the previous values. The database is a single source of _current_ truth.

This model is simple, fast, and well-supported by every ORM ever written. But it has a quiet cost: **history is destroyed with every update**. When a customer's address changes, the old address vanishes. When a price is adjusted, the prior price is gone. The system can answer "what is the price now?" but never "what was the price on the day the order was placed?"

## The Problem with Conventional Wisdom

Most teams discover this limitation only when it bites them. An auditor asks for a change log. A bug report references a state that no longer exists. A new feature needs to "see" the system as it was last Tuesday. The reflex is to bolt on a side table — `audit_logs` — and write to it alongside every update. But this is a patch, not a model.

This works for a while. Then the audit log grows unbounded. Queries that join the current table with the audit log become slow. Restoring a prior state requires reading every log entry and replaying them in order — which nobody actually does because it's too expensive at runtime. You've reinvented event sourcing, badly.

## A Better Approach: Event Sourcing

Event sourcing inverts the model. Instead of storing current state and patching a side log, **the log is the source of truth**. State is derived by replaying events.

Every query becomes a fold. Every audit is free — the log _is_ the audit. Time travel is trivial: replay events up to a given timestamp. You get undo, redo, and branching for the same price.

### But there's a catch

You now have to solve problems CRUD never posed. How do you snapshot the state to avoid replaying millions of events on every read? How do you handle schema evolution when an event's shape changes after a year of production data? How do you debug a system whose state is implicit?

## Tradeoffs and When to Use It

Event sourcing is not a free upgrade. It is a different shape of complexity. CRUD hides history but is easy to reason about locally; event sourcing surfaces history but demands discipline globally.

Reach for it when one or more of these are true:

- **Auditability is a hard requirement** — finance, healthcare, legal.
- **Multiple stakeholders need different views** of the same facts.
- **Time travel** is a product feature, not a nice-to-have.
- **Replays** are valuable — when you need to recompute projections after a bug fix.

Avoid it when the team is small, the domain is simple, and the cost of a wrong state is low. A todo app does not need event sourcing. A payment processor does.

## Conclusion

CRUD is not wrong. It is a model optimized for a particular tradeoff: simplicity over history. Event sourcing is the same problem, optimized the other way. The job of an engineer is not to pick the "better" pattern but to recognize which tradeoff your system can actually afford.
