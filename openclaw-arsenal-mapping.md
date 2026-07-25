# OpenClaw Arsenal Mapping — 9 Agents × 6 Tools

## ⚠️ HONESTY WARNING — read before proceeding

This document is **speculative**. Searched and confirmed (2026-07-24):
none of the names `Crabfleet`, `Lobster`, `discrawl`, `gitcrawl`,
`telecrawl`, `ClickClack` were found in this environment — neither as
real repos/code, nor as a description in any existing project document
(Manifesto/ECON_MODEL/QUANT_REPORT). The CEO directive only mentions
bare names, without a single line describing what they do (OpenClaw's
components like `imsg`/`acpx` at least had a one-sentence definition in
Manifesto v3 — these don't even have that).

The mapping below infers **purely from name semantics and each agent's
already-known role**. This is not an architectural decision document —
it's a starting point at the level of "if the names imply what they
seem to, it would probably work like this." **Before starting any real
integration work, the CEO/Chief Strategist should be asked for an
actual description of what these 6 tools are.**

---

## Inference confidence levels

| Tool | Inference | Confidence |
|---|---|---|
| `gitcrawl` | Git/GitHub repo activity crawler (commits, PRs, issues) | High — name is very explicit |
| `discrawl` | Discord activity crawler (server/channel/messages) | High — name is very explicit |
| `telecrawl` | Telegram activity crawler (channel/group messages) | High — name is very explicit |
| `Crabfleet` | Infrastructure layer running the crawler/worker "fleet" (orchestrates gitcrawl/discrawl/telecrawl) — conceptually similar to Manifesto v3's `gogcli` | Medium — inferred from the word "fleet," unverified |
| `Lobster` | Whale/wash-trading data analysis tool (same family as the vol/liq analysis in SCARCAT_QUANT_REPORT.md) | Low — only thematic (crustacean) fit, no functional clue |
| `ClickClack` | **No inference possible** | None — the name gives no semantic clue at all |

---

## Mapping (9 agents × inferred tool usage)

| Agent | Role | Likely tool(s) | Rationale |
|---|---|---|---|
| Agent-1 | Smart Contract & MEV Lead | `Lobster` (?) | MEV/wash-trading detection falls within Agent-1's scope (alongside clawsweeper) — but whether Lobster actually does this is unverified |
| Agent-2 | Interface & ClawHub | — | None of the names make a clear connection to interface/frontend |
| Agent-3 | Stealth Motion Designer | — | Same — no connection |
| Agent-4 | Node & Infrastructure | `Crabfleet` | "Fleet" = worker/node orchestration, the most natural fit with Agent-4's role |
| Agent-5 | ClawHub AI Model Engineer | `gitcrawl`, `Lobster` (?) | Repo activity (gitcrawl) + quant data (Lobster) makes sense for model development, but unverified |
| Agent-6 | A2A Monetization Strategist | `Lobster` (?) | Whale/data sales (SCARCAT_ECON_MODEL.md §8.2 "A2A Data Pricing") could depend on Lobster's output |
| Agent-7 | Ecosystem & Partnerships VP | `telecrawl`, `discrawl` | Community/partner monitoring — telecrawl stands out since Telegram is the primary channel for crypto projects |
| Agent-8 | Autonomous Swarm & Social-Fi | `discrawl`, `telecrawl` | Social layer + copy-trading (see openclaw-architecture.md §5) — both make sense for community signal |
| Agent-9 | Swarm Commander | `Crabfleet`, `gitcrawl` | Orchestration + monitoring the swarm's own development activity |

`ClickClack`: not assigned to any agent — no functional inference could
be made from the name. Speculating without CEO clarification would be
misleading.

---

## Relationship to the OpenClaw architecture

Compared against the layers in `openclaw-architecture.md`:

- `gitcrawl`/`discrawl`/`telecrawl` → **data ingestion** layer — not
  really playing the role of Manifesto v3's `imsg` (agent-to-agent
  messaging), but more the role **crawler-bridge.ts** already plays:
  collecting signals from the outside world (git/Discord/Telegram) and
  injecting them into `OpenClawBridge` as an A2A request.
  `artifacts/crawler-bridge.ts` provides a generic `CrawlerDataSource`
  interface + a testable mock implementation for this — once a real
  gitcrawl/discrawl exists, implementing this interface should be all
  that's needed.
- `Crabfleet` → likely the infrastructure that RUNS these crawlers;
  conceptually adjacent to `swarm-boot.ts`'s "9 agents, test wallets +
  monitoring" role, but not the same thing.
- `Lobster` → if it really is a quant/whale analysis tool, it could
  feed a future (Phase 3) "Agent Score" or risk-signal component of
  ClawScore — but this is pure speculation, see phase3-roadmap.md item
  4.

## Next step

This document **should not be used for architectural decisions**.
Recommended step: ask the CEO/Chief Strategist for a 1-2 sentence real
description of each of the 6 tools (the same way Manifesto v3 did for
`imsg`/`acpx`/etc.) — only then can this mapping become a real
architectural decision.
