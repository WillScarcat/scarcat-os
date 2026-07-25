# WillTokenV5 — Deployment Log

## 2026-07-24 — Robinhood Chain testnet (4663)

- **Contract address:** `0xd69c454eCf09eE8294e69231e0727e55F59E42D1`
- **Contract:** `contracts/ajan1-WillTokenV5.sol`
- **Deploy method:** `cast send --create` via `contracts/ajan1-testnet-deploy.sh`
- **Guardians (threshold 2 of 3):**
  1. `0xaf5b815B5350e07b414a6B49b925adEDDae1a4F6` — CEO Primary
  2. `0x57DEd864D1b5Fe23A5C8a50fABFC5ed35fDd959B` — CEO Backup
  3. `0x146AE2B3738FeBBfFb1c571B7cE2e596c1ab39De` — Chief Strategist

### Verification note
This address was reported via CEO directive. It was not independently
verified on-chain by the AI CTO (no Robinhood Chain testnet RPC access
in this environment). `contracts/ajan1-WillTokenV5.sol` and its tests
(12/12 PASS) were compiled and tested locally before being copied into
this repo — that is what was verified, not the on-chain state.
