# Scarcat OS — Investor GitBook Outline (Phase 4 Draft)

DRAFT — this is a GitBook page structure outline, not full content.
Each section is a 1-2 sentence summary + a note on which existing
source it should be drawn from.

## Source note (honesty)

The directive asked for this to be based on a "Day 1 report" — no file
with that name was found in this environment (searched: will-dapp/design/,
scarcat/, scarcat-os/). Instead, "Day 1" was built from two real
sources: (1) `artifacts/openclaw-architecture.md` (architecture), (2)
today's actual `DISPATCH.md` history (WillTokenV5 v1→v5, 4 Red Team
rounds + 12/12 tests, Anvil deploy, OpenClaw node, swarm boot, monitor,
social-fi webhook, willdapp.com integration — all genuinely written and
verified today, in a single session). The "Day 1" section below
summarizes this real history — it does not cite a fabricated report.

---

## SUMMARY (GitBook page tree)

```
* Introduction
  * What Is Scarcat OS
  * Why an Agentic OS

* Vision
  * Manifesto Summary (Manifesto v1→v3 synthesis)
  * OpenClaw Integration

* Product
  * $WILL Token (WillTokenV5)
  * Claw Score
  * A2A Economy

* Technical Architecture
  * On-chain Layer
  * Off-chain Layer (OpenClaw Node + Swarm)
  * Social Layer

* Day 1 — What Was Built
  * Contract: WillTokenV5
  * Infrastructure: OpenClaw Node + Swarm Boot
  * Interface: Scarcat OS Command Center

* Roadmap
  * Phase 3 — Completed
  * Phase 4 — In Progress
  * Phase 5 (Post-MVP) — Open Items

* Tokenomics
  * Supply and Distribution
  * Tier System
  * Tax/Dividend Model

* Team / Swarm Structure
  * 9-Agent System
  * AI CTO Operating Model

* Security
  * Guardian Multisig
  * Red Team Process
  * Known Limitations (stated honestly)

* Appendix
  * Glossary
  * Sources
```

---

## Section details

### Introduction

**What Is Scarcat OS** — 1 paragraph: an "Agentic OS" built around
$WILL, where AI agents are the primary actor — source: Manifesto v3's
opening line ("DApps serve humans" → "AI agents live and trade
autonomously").

**Why an Agentic OS** — the differentiation narrative from the memecoin
category. *Source needed: not yet written, requires Agent-7's marketing
input.*

### Vision

**Manifesto Summary** — synthesis of
`~/dev/will-dapp/design/SCARCAT_MANIFESTO_V3.md` (OpenClaw integration,
ClawHub strategy, DePIN layer, A2A economy, the OpenClaw-native
mutation of the 8 roles).

**OpenClaw Integration** — `artifacts/openclaw-architecture.md` is the
direct source. **The honesty note MUST carry over to this section**:
imsg/acpx/wacli/gogcli/clawsweeper/mcporter/openclaw-windows-node could
not be verified as real code in this environment — investor material
must keep the distinction between "planned" and "built" explicit,
otherwise it risks a "vaporware" perception.

### Product

**$WILL Token** — WillTokenV5.sol: agent-native, EIP-712 intent-based,
guardian multisig + timelock + round mechanism. Source:
`artifacts/ajan1-WillTokenV5.sol` + `DEPLOYMENT_LOG.md`
(`0xd69c454eCf09eE8294e69231e0727e55F59E42D1`, testnet — **must be
independently verified on-chain before being presented to investors**,
see Security section).

**Claw Score** — the `SCARCAT_ECON_MODEL.md §7` formula
(0.35H+0.25T+0.20C+0.15F+0.05A), implemented in
`artifacts/ajan6-ClawScore.ts`, numerically verified against the 3
examples in the document.

**A2A Economy** — the Manifesto v3 A2A flow +
`openclaw-architecture.md §3`. *Open item: the fee model is not yet
wired into WillTokenV5 (see phase3-roadmap.md) — this should not be
presented as a "live revenue model," but as "designed, integration
pending."*

### Technical Architecture

The three subsections should directly mirror
`openclaw-architecture.md`'s layer diagram (the mermaid diagram can be
carried over to GitBook). Additional source for the **Social Layer**
subsection: `artifacts/social-fi-webhook.ts` (added this round — X/
Telegram webhook ingestion, CRC handshake + secret-token validation
tested) and `artifacts/crawler-bridge.ts`.

### Day 1 — What Was Built

This section is based on today's real DISPATCH.md records, not a
fabricated "Day 1 report." Concrete, verified items:

- WillTokenV5.sol: 4 Red Team revision rounds (v1→v5), 12/12 automated
  tests PASS (including executeIntent, the pause/unpause round-reuse
  regression, burnLP, signature malleability)
- End-to-end deploy + guardian/agent flow verified on Anvil
- `openclaw-node.ts`: EIP-712 signature scheme verified against the
  real contract (viem signature → accepted on-chain → balance
  transferred)
- `swarm-boot.ts`: 9 agent test wallets + live on-chain monitoring,
  verified end-to-end
- `scarcat-monitor.tsx`: integrated into willdapp.com, `/scarcat-os`
  route produced by a real `next build` (today, this round)
- `social-fi-webhook.ts`: X CRC handshake + Telegram webhook, verified
  with synthetic payloads matching the official protocols

*Note: the phrase "deployed on testnet" was reported via CEO directive;
the AI CTO could not independently verify it on-chain (no RPC access)
— this material must be verified against a real explorer link before
going to investors.*

### Roadmap

Phase 3 (completed) / Phase 4 (this round: willdapp integration, social
webhook, this document) / Phase 5 open items should be pulled directly
from `artifacts/phase3-roadmap.md` (AgentScope, batch settlement, where
ClawScore is computed, the WillTokenV5↔WillDividendTracker identity
assumption, whether the OpenClaw repos are real).

### Tokenomics

`SCARCAT_ECON_MODEL.md` is the direct source (supply distribution, tier
system, dynamic tax formula). *Note: WillTokenV5 is architecturally
independent from the WillDividendTracker that ECON_MODEL references —
how these two are told as a single story to investors needs to be
clarified (see phase3-roadmap.md item 2).*

### Team / Swarm Structure

The 9-agent system (`status/SWARM_STATUS.md` role table) + the AI CTO
operating model (CEO → AI CTO → Agent-9 → Agents 1-8, the
dispatch/CLAUDE.md hierarchy). This section must not be conflated with
"human team" expectations — investors must be told explicitly, not
hidden from the fact, that the operating model is AI-agent-based.

### Security

- Guardian multisig: 2/3 threshold, one signer (Chief Strategist)
  independent of the CEO — see the CTO security note (2026-07-24,
  deploy script round).
- Red Team process: 12 findings (critical+medium+low) closed across
  v1→v5, each round's record is in DISPATCH.md.
- Known limitations (must be listed honestly): the contract has not
  been independently audited, AgentScope/batch settlement deferred to
  Phase 3, most of the OpenClaw off-chain components are not yet built.

### Appendix

Glossary (ClawScore, guardian, intent, tier, etc.) + a source list
(references to all `artifacts/*.md` and `design/*.md` files).

---

## Next step

Once this outline is approved by the CEO/Agent-7, each section should
be split into separate GitBook pages (`.md` files + `SUMMARY.md`). No
section's full text has been written yet — this is a deliberate scope
boundary (the directive asked for an "outline," not full content).
