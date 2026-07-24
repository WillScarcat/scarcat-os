#!/usr/bin/env bash
set -euo pipefail

# ROBINHOOD CHAIN TESTNET DEPLOY (4663) — via `cast send --create`.
# This is the ONLY sanctioned deploy path for chain 4663: CLAUDE.md is
# explicit and repeated twice — "forge script chain 4663'te calismiyor
# -> cast send --create". ajan1-deploy.s.sol (a forge script) stays
# hardcoded to Anvil (31337) and must never be pointed at 4663.
#
# Private key handling: DEPLOYER_PRIVATE_KEY (if used) must be an
# exported shell variable, never written to this script, a .env file,
# or any other file — per CLAUDE.md ("Private key asla dosyaya
# yazilmaz"). A hardware wallet flag (--ledger) is preferred when
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
# GUARDIAN_3 is the Bas Stratejist, independent of the CEO — see prior
# CTO security note on why this matters (a CEO-only 2-of-3 provides no
# protection against the CEO alone being compromised or coerced).
GUARDIAN_1="0xaf5b815B5350e07b414a6B49b925adEDDae1a4F6"  # CEO Ana
GUARDIAN_2="0x57DEd864D1b5Fe23A5C8a50fABFC5ed35fDd959B"  # CEO Yedek
GUARDIAN_3="0x146AE2B3738FeBBfFb1c571B7cE2e596c1ab39De"  # Bas Stratejist
THRESHOLD=2

TREASURY_ADDRESS="${TREASURY_ADDRESS:?Set TREASURY_ADDRESS}"
INITIAL_SUPPLY="${INITIAL_SUPPLY:-420690000000000000000000000000}" # 420.69B WILL * 1e18

echo "== Robinhood Chain testnet (chain id $CHAIN_ID) deploy =="
echo "RPC:      $RPC_URL"
echo "Treasury: $TREASURY_ADDRESS"
echo "Supply:   $INITIAL_SUPPLY"
echo "Guardians (threshold=$THRESHOLD of 3):"
echo "  1) $GUARDIAN_1  (CEO Ana)"
echo "  2) $GUARDIAN_2  (CEO Yedek)"
echo "  3) $GUARDIAN_3  (Bas Stratejist)"
echo

RPC_CHAIN_ID="$(cast chain-id --rpc-url "$RPC_URL")"
if [[ "$RPC_CHAIN_ID" != "$CHAIN_ID" ]]; then
  echo "HATA: RPC chain id $RPC_CHAIN_ID doner, $CHAIN_ID bekleniyordu. Durduruldu." >&2
  exit 1
fi

read -r -p "Yukaridaki bilgiler dogru, gercekten deploy edilsin mi? [evet/hayir] " CONFIRM
if [[ "$CONFIRM" != "evet" ]]; then
  echo "Iptal edildi."
  exit 1
fi

echo "== Derleniyor (forge build) =="
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
  echo "HATA: derleme ciktisi bulunamadi: $ARTIFACT_JSON" >&2
  exit 1
fi
BYTECODE="$(jq -r '.bytecode.object' "$ARTIFACT_JSON")"
BYTECODE="${BYTECODE#0x}"

if [[ -z "$BYTECODE" || "$BYTECODE" == "null" ]]; then
  echo "HATA: bytecode alinamadi." >&2
  exit 1
fi

echo "== Constructor argumanlari encode ediliyor (cast abi-encode) =="
CTOR_ARGS="$(cast abi-encode \
  "constructor(uint256,address,address[],uint256)" \
  "$INITIAL_SUPPLY" \
  "$TREASURY_ADDRESS" \
  "[$GUARDIAN_1,$GUARDIAN_2,$GUARDIAN_3]" \
  "$THRESHOLD")"

DEPLOY_DATA="0x${BYTECODE}${CTOR_ARGS#0x}"

echo "== cast send --create ile deploy =="
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
  echo "HATA: DEPLOYER_PRIVATE_KEY set edilmedi ve USE_LEDGER=1 verilmedi." >&2
  echo "Private key hicbir zaman bir dosyaya yazilmamali — sadece export edilmis" >&2
  echo "bir shell degiskeni olarak veya --ledger ile gecirin." >&2
  exit 1
fi

echo
echo "== Deploy tamamlandi =="
echo "Guardian yetkisi constructor'da yukaridaki 3 adrese ATOMIK olarak"
echo "kuruldu. Ayri bir 'yetkileri multisig'e devret' adimi YOK ve"
echo "GEREKMIYOR — WillTokenV5'te owner kavrami zaten kaldirilmisti."
