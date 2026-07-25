# Phase 3 Roadmap — Post-MVP

CEO decision (2026-07-24): "Today's operation is sealed." This document
records the items left out of MVP scope from the 3 gaps identified in
`artifacts/openclaw-architecture.md`, along with their rationale. V5
remains unchanged on Mainnet — nothing listed here is under active
development right now.

## Decision summary

| # | Gap | MVP decision |
|---|---|---|
| 1 | AgentScope (fine-grained authorization) | **Phase 3 — Post-MVP** |
| 2 | Batch settlement (`executeIntentBatch`) | **Phase 3 — Post-MVP** |
| 3 | ClawScore / WillDividendTracker (`0xe117...`) dependency | **Resolved — off-chain, within MVP scope** (see openclaw-architecture.md §4) |

---

## Phase 3.1 — AgentScope (fine-grained agent authorization)

**Problem:** `WillTokenV5.isAgent` is binary (bool) — any registered
agent can execute an `executeIntent` call signed by any signer, for
unlimited value. If an agent key is compromised, there is no
contract-level mechanism limiting the blast radius (current defense:
guardians removing it via `revokeAgent` — subject to a 2-day timelock).

**Design reference:** `artifacts/ajan1-WillTokenV6.sol` (marked
CANCELLED, never compiled/tested) proposed an `AgentScope` struct (daily
spending limit + function-selector restriction). When Phase 3 begins,
this file can be used as a starting point, but **must go through a full
CTO security review from scratch** — since it was cancelled, it was
never compiled or tested.

**Note:** AgentScope is an agent-level throttle — it does NOT fully
satisfy the (agent, principal)-specific delegation model acpx implies
(see openclaw-architecture.md §2). This should be evaluated separately
as a larger, harder problem.

**Prerequisites:** revisiting the V6 design, a full Red Team review (at
the level applied to WillTokenV1-V5 across the previous 4 revision
rounds), extensive testing on Anvil, and only then a decision to touch
mainnet.

---

## Phase 3.2 — Batch settlement (`executeIntentBatch`)

**Problem:** the "off-chain negotiation, periodic batched on-chain
settlement" flow Manifesto v3 envisions is gas-inefficient with the
current single-intent `executeIntent` (N intents = N separate txs).

**Options (to be decided in Phase 3):**
- (a) The same agent calls `executeIntent` multiple times within one
  transaction — simple, requires no contract change, but still N
  separate calls.
- (b) A new `executeIntentBatch(AgentIntent[] calldata intents, bytes[] calldata signatures)`
  function — real gas savings, but a new attack surface: partial-failure
  behavior (if one intent reverts, is everything rolled back or
  skipped?), reentrancy/ordering risks within a single expensive tx need
  to be re-evaluated.

**Prerequisites:** the (a) vs (b) decision, and if (b) is chosen, a
full CTO security review (partial-failure semantics in particular).

---

## Other open questions (not resolved this round, need future clarification)

1. **Where ClawScore is computed:** on-chain (gas cost) or a signed
   off-chain oracle (trust assumption)? Flagged as an open question
   from the start in `ajan6-ClawScoreV1.md`, still open.
2. **WillTokenV5 ↔ WillDividendTracker user identity assumption:** it is
   assumed both contracts share the same wallet address as "the same
   user" — this has never been verified. Even though the H component
   now comes solely from WillTokenV5, WillDividendTracker is still
   actively used elsewhere in the project (dividend/faction UI).
3. **imsg/acpx/wacli/gogcli/clawsweeper/mcporter/openclaw-windows-node:**
   Manifesto v3 says "seven repos analyzed," but none were found as real
   code in this environment (searched and confirmed). The core question
   to resolve before Phase 3 planning: are these existing, accessible
   repos, or will they be built from scratch? This affects the entire
   speculative foundation of openclaw-architecture.md.
4. **Faction Score (F) data source:** no data/0 in MVP. If resolved in
   Phase 3, there are two paths: (i) read-only integration with
   WillDividendTracker (no contract change, but partially reintroduces
   the 0xe117 dependency), (ii) V6-style native tracking (same
   prerequisites as AgentScope — requires a full security review).

---

## Principles (to remember when starting Phase 3 work)

- V5 is the active contract on Mainnet. No Phase 3 item touches mainnet
  without a full CTO security review and CEO approval.
- `cast send --create` is mandatory (forge script doesn't work on chain
  4663).
- Private keys are never written to a file.
- A new contract version always follows this order, without exception:
  (1) compiled and tested locally, (2) goes through a Red Team review,
  (3) gets CEO approval, (4) only then moves to testnet, then mainnet.
