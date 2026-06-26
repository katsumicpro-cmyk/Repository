# ADR 002: Result<T, E> over thrown exceptions

**Status:** Accepted  
**Date:** 2026-06-26

## Context

Domain operations can fail for known business reasons (validation, not found, conflict). Using thrown exceptions makes failure paths invisible in type signatures and hard to test.

## Decision

All domain and application layer functions return `Result<T, AppError>` instead of throwing. Exceptions are only allowed in infrastructure code (network, DB) and must be caught and converted to `Result` before crossing layer boundaries.

## Consequences

- Failure cases are explicit in type signatures
- Railway-oriented composition via `map` / `flatMap`
- No try/catch in domain or application code
