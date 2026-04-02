# Veil — AI Agent Observability Platform

## What We're Building
Veil is a SaaS observability platform for AI agents.
Engineers add one line of code. Veil automatically
detects, classifies, and alerts on agent failures.
Built on top of OpenLIT github repo. (OpenTelemetry).

## Core Rules — Never Violate These
1. SDK must never add more than 5ms latency
2. All SDK telemetry collection is async/fire-and-forget
3. Never block the agent execution thread
4. Every database query must include org_id for tenant isolation
5. OpenLIT types never leak outside /lib/normalizer
6. No API endpoint unprotected except /health and /api/ingest

## Tech Stack
- Framework: Next.js 14 App Router
- UI: shadcn/ui + Tailwind CSS
- Auth: Clerk
- Database: Supabase (Railway)
- Telemetry: OpenLIT
- Integrations: Composio (GitHub, Slack)
- Hosting: Railway
- Code Review: CodeRabbit
- Hosting: Vercel


## Folder Structure
/app                    Next.js app router pages
/components/ui          shadcn components
/components/veil        Veil specific components
/lib/sdk               Veil Python SDK source
/lib/normalizer        OpenLIT normalization layer
/lib/rules             Failure classification engine
/lib/db                Database queries (always scoped by org_id)
/api                   Backend API routes

## Database Schema (Core Tables)
organizations           id, name, api_key, created_at
agents                  id, org_id, name, created_at
sessions                id, org_id, agent_id, status,
                        failure_type, cost, duration_ms,
                        started_at, completed_at
events                  id, session_id, org_id, step,
                        type, payload, timestamp
classifications         id, session_id, category,
                        subcategory, severity, reason

## Failure Categories (Rules Engine)
Context exhaustion, RAG failure, Cost anomaly,
Tool failure, Infinite loop, Goal drift,
Prompt injection, Hallucination, Latency spike,
Silent failure — classify these first.

## SDK Public API (All Engineers Ever Touch)
import veil
veil.init(api_key="vl_xxx")   ← this is it

## Frontend Tooling
- Always use shadcn MCP for adding/modifying UI components:
  `npx shadcn@latest mcp init --client claude`
  This gives Claude direct access to the shadcn registry.

## What NOT To Do
- Never make sync HTTP calls in SDK hot path
- Never store raw OpenLIT data without normalizing
- Never let OpenLIT schema leak into core models
- Never add engineer-facing config beyond api_key
- Never merge without CodeRabbit review
- Never build features not in this document
- Never push directly to git always create PRs