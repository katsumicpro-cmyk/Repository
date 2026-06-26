# ADR 001: Supabase First

**Status:** Accepted  
**Date:** 2026-06-26

## Context

Innovation OS requires authentication, relational data, vector search (embeddings), file storage, and row-level security. We need to select a backend platform for MVP.

## Decision

Use Supabase as the primary backend platform. All infrastructure (auth, DB, storage, vector) is provided by Supabase.

## Consequences

**Positive**
- Auth, RLS, Storage, Vector search in one managed service
- Generated TypeScript types from schema
- No infrastructure management in MVP
- pgvector natively available for knowledge embeddings

**Negative**
- Vendor lock-in risk (mitigated by Repository pattern abstracting DB access)
- Supabase SDK must not leak into domain layer
