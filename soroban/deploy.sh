#!/usr/bin/env bash
# Build and deploy Verifier + Battleship contracts to Stellar testnet
# Requires: stellar CLI, STELLAR_SERVER_SECRET env var
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
VK_DIR="${SCRIPT_DIR}/vk"
WASM_DIR="${SCRIPT_DIR}/target/wasm32v1-none/release"
GAME_HUB="CB4VZAT2U3UC6XFK3N23SKRF2NDCMP3QHJYMCHHFMZO7MRQO6DQ2EMYG"

# Validate VK files exist
for vk_file in board_validity_vk.bin turns_proof_vk.bin; do
  if [ ! -f "${VK_DIR}/${vk_file}" ]; then
    echo "ERROR: VK file not found: ${VK_DIR}/${vk_file}"
    echo "Run ./generate_vk.sh first"
    exit 1
  fi
done

# Build all contracts
echo "=== Building contracts ==="
cd "$SCRIPT_DIR"
stellar contract build

for wasm in zk_verifier battleship; do
  if [ ! -f "${WASM_DIR}/${wasm}.wasm" ]; then
    echo "ERROR: WASM not found: ${WASM_DIR}/${wasm}.wasm"
    exit 1
  fi
  echo "  ${wasm}.wasm: $(wc -c < "${WASM_DIR}/${wasm}.wasm") bytes"
done
echo ""

# Get admin address from server keypair
if [ -z "${STELLAR_SERVER_SECRET:-}" ]; then
  echo "ERROR: STELLAR_SERVER_SECRET env var not set"
  exit 1
fi

ADMIN=$(stellar keys address server 2>/dev/null || echo "")
if [ -z "$ADMIN" ]; then
  BACKEND_DIR="${SCRIPT_DIR}/../backend"
  ADMIN=$(cd "$BACKEND_DIR" && node -e "const{Keypair}=require('@stellar/stellar-sdk');console.log(Keypair.fromSecret(process.env.STELLAR_SERVER_SECRET).publicKey())" 2>/dev/null || echo "")
fi

if [ -z "$ADMIN" ]; then
  echo "ERROR: Could not derive admin address."
  exit 1
fi

echo "  Admin:    ${ADMIN}"
echo "  Game Hub: ${GAME_HUB}"
echo ""

# ─── 1. Deploy Verifier ───
echo "=== Deploying Verifier ==="
VERIFIER_ID=$(stellar contract deploy \
  --wasm "${WASM_DIR}/zk_verifier.wasm" \
  --source-account "$STELLAR_SERVER_SECRET" \
  --network testnet \
  -- \
  --admin "$ADMIN")

echo "  Verifier ID: ${VERIFIER_ID}"

# Set VKs on verifier
echo "  Setting board_validity VK..."
stellar contract invoke \
  --id "$VERIFIER_ID" \
  --source-account "$STELLAR_SERVER_SECRET" \
  --network testnet \
  -- \
  set_verification_key \
  --admin "$ADMIN" \
  --circuit 0 \
  --vk_data "$(xxd -p < "${VK_DIR}/board_validity_vk.bin" | tr -d '\n')"

echo "  Setting turns_proof VK..."
stellar contract invoke \
  --id "$VERIFIER_ID" \
  --source-account "$STELLAR_SERVER_SECRET" \
  --network testnet \
  -- \
  set_verification_key \
  --admin "$ADMIN" \
  --circuit 1 \
  --vk_data "$(xxd -p < "${VK_DIR}/turns_proof_vk.bin" | tr -d '\n')"

echo ""

# ─── 2. Deploy Battleship ───
echo "=== Deploying Battleship ==="
BATTLESHIP_ID=$(stellar contract deploy \
  --wasm "${WASM_DIR}/battleship.wasm" \
  --source-account "$STELLAR_SERVER_SECRET" \
  --network testnet \
  -- \
  --admin "$ADMIN" \
  --verifier "$VERIFIER_ID" \
  --game_hub "$GAME_HUB")

echo "  Battleship ID: ${BATTLESHIP_ID}"
echo ""

# ─── Summary ───
echo "=== Deployed ==="
echo "  Verifier:   ${VERIFIER_ID}"
echo "  Battleship: ${BATTLESHIP_ID}"
echo "  Game Hub:   ${GAME_HUB} (existing)"
echo ""
echo "Add to backend .env:"
echo "  SOROBAN_CONTRACT_ID=${BATTLESHIP_ID}"
echo "  SOROBAN_RPC_URL=https://soroban-testnet.stellar.org"
