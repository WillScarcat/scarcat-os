#!/usr/bin/env bash
set -euo pipefail

# ROBINHOOD CHAIN TESTNET DEPLOY (4663) — via `cast send --create`.
# This is the ONLY sanctioned deploy path for chain 4663: CLAUDE.md is
# explicit and repeated twice — "forge script doesn't work on chain
# 4663 -> use cast send --create". ajan1-deploy.s.sol (a forge script)
# stays hardcoded to Anvil (31337) and must never be pointed at 4663.
#
# Private key handling: DEPLOYER_PRIVATE_KEY (if used) must be an
# exported shell variable, never written to this script, a .env file,
# or any other file — per CLAUDE.md ("private keys are never written
# to a file"). A hardware wallet flag (--ledger) is preferred when
# available.
#
# Guardian handoff: WillTokenV5 has no separate `owner` and no
# post-deploy "transfer to multisig" step (see ajan1-WillTokenV5.sol
# header). Guardian authority is established ATOMICALLY by the
# constructor call below — passing the 3 addresses here IS the handoff.

RPC_URL="${ROBINHOOD_TESTNET_RPC:?Set ROBINHOOD_TESTNET_RPC}"
CHAIN_ID=4663

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CONTRACT_SRC="$SCRIPT_DIR/ajan1-WillTokenV5.sol"
CONTRACT_NAME="WillTokenV5"

# Guardian set — dispatch/GUARDIAN_ADDRESSES.txt (2026-07-24).
# GUARDIAN_3 is the Chief Strategist, independent of the CEO — see prior
# CTO security note on why this matters (a CEO-only 2-of-3 provides no
# protection against the CEO alone being compromised or coerced).
GUARDIAN_1="0xaf5b815B5350e07b414a6B49b925adEDDae1a4F6"  # CEO Primary
GUARDIAN_2="0x57DEd864D1b5Fe23A5C8a50fABFC5ed35fDd959B"  # CEO Backup
GUARDIAN_3="0x146AE2B3738FeBBfFb1c571B7cE2e596c1ab39De"  # Chief Strategist
THRESHOLD=2

TREASURY_ADDRESS="${TREASURY_ADDRESS:?Set TREASURY_ADDRESS}"
INITIAL_SUPPLY="${INITIAL_SUPPLY:-420690000000000000000000000000}" # 420.69B WILL * 1e18

echo "== Robinhood Chain testnet (chain id $CHAIN_ID) deploy =="
echo "RPC:      $RPC_URL"
echo "Treasury: $TREASURY_ADDRESS"
echo "Supply:   $INITIAL_SUPPLY"
echo "Guardians (threshold=$THRESHOLD of 3):"
echo "  1) $GUARDIAN_1  (CEO Primary)"
echo "  2) $GUARDIAN_2  (CEO Backup)"
echo "  3) $GUARDIAN_3  (Chief Strategist)"
echo

RPC_CHAIN_ID="$(cast chain-id --rpc-url "$RPC_URL")"
if [[ "$RPC_CHAIN_ID" != "$CHAIN_ID" ]]; then
  echo "ERROR: RPC returned chain id $RPC_CHAIN_ID, expected $CHAIN_ID. Stopped." >&2
  exit 1
fi

read -r -p "Is the information above correct — really deploy? [yes/no] " CONFIRM
if [[ "$CONFIRM" != "yes" ]]; then
  echo "Cancelled."
  exit 1
fi

echo "== Compiling (forge build) =="
# No standalone `solc` binary is assumed to be on PATH (Foundry installs
# often don't expose one) — this scaffolds a throwaway forge project,
# builds with forge's own solc, and reads the creation bytecode straight
# out of the standard `out/` artifact JSON via jq.
BUILD_DIR="$(mktemp -d)"
trap 'rm -rf "$BUILD_DIR"' EXIT
mkdir -p "$BUILD_DIR/src"
cp "$CONTRACT_SRC" "$BUILD_DIR/src/"
(cd "$BUILD_DIR" && forge build --contracts src >/dev/null)

ARTIFACT_JSON="$BUILD_DIR/out/$(basename "$CONTRACT_SRC")/$CONTRACT_NAME.json"
if [[ ! -f "$ARTIFACT_JSON" ]]; then
  echo "ERROR: build output not found: $ARTIFACT_JSON" >&2
  exit 1
fi
BYTECODE="$(jq -r '.bytecode.object' "$ARTIFACT_JSON")"
BYTECODE="${BYTECODE#0x}"

if [[ -z "$BYTECODE" || "$BYTECODE" == "null" ]]; then
  echo "ERROR: could not obtain bytecode." >&2
  exit 1
fi

echo "== Encoding constructor arguments (cast abi-encode) =="
CTOR_ARGS="$(cast abi-encode \
  "constructor(uint256,address,address[],uint256)" \
  "$INITIAL_SUPPLY" \
  "$TREASURY_ADDRESS" \
  "[$GUARDIAN_1,$GUARDIAN_2,$GUARDIAN_3]" \
  "$THRESHOLD")"

DEPLOY_DATA="0x${BYTECODE}${CTOR_ARGS#0x}"

echo "== Deploying via cast send --create =="
# `--create` is a subcommand, not a flag (see `cast send --help`:
# "Usage: cast send [OPTIONS] [TO] [SIG] [ARGS]... [COMMAND]", --create
# listed under Commands). Everything after --create is parsed as its own
# argument, so --rpc-url/--private-key/--ledger MUST come before it —
# putting them after produced "'--rpc-url' unexpected argument".
if [[ -n "${DEPLOYER_PRIVATE_KEY:-}" ]]; then
  cast send \
    --rpc-url "$RPC_URL" \
    --private-key "$DEPLOYER_PRIVATE_KEY" \
    --create "$DEPLOY_DATA"
elif [[ "${USE_LEDGER:-}" == "1" ]]; then
  cast send \
    --rpc-url "$RPC_URL" \
    --ledger \
    --create "$DEPLOY_DATA"
else
  echo "ERROR: DEPLOYER_PRIVATE_KEY was not set and USE_LEDGER=1 was not given." >&2
  echo "A private key must never be written to a file — pass it only as an" >&2
  echo "exported shell variable, or use --ledger." >&2
  exit 1
fi

echo
echo "== Deploy complete =="
echo "Guardian authority was established ATOMICALLY in the constructor,"
echo "to the 3 addresses above. There is NO separate 'transfer authority"
echo "to multisig' step and none is NEEDED — WillTokenV5 already has no"
echo "owner concept."
