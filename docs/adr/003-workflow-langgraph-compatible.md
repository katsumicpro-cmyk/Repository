# ADR 003: Workflow engine with LangGraph-compatible interface

**Status:** Accepted  
**Date:** 2026-06-26

## Context

The knowledge creation pipeline (Discovery → Pattern → Principle → Future → Concept) is a directed graph of processing steps. LangGraph is a strong future candidate but introduces complexity for MVP.

## Decision

Implement a minimal in-process workflow engine in `packages/workflow` with an interface compatible with LangGraph concepts (Node, Edge, State, Engine). When LangGraph is adopted, only `engine.ts` internals change; Node definitions and State schema remain stable.

## Consequences

- MVP launches without LangGraph dependency
- Migration path to LangGraph is a targeted swap, not a rewrite
- Node definitions are independently testable
