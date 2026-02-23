#!/usr/bin/env bash
# Build and deploy the Battleship Verifier contract to Stellar testnet
# Requires: stellar CLI, STELLAR_SERVER_SECRET env var
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
VK_DIR="${SCRIPT_DIR}/vk"
GAME_HUB="CB4VZAT2U3UC6XFK3N23SKRF2NDCMP3QHJYMCHHFMZO7MRQO6DQ2EMYG"

# Validate VK files exist
for vk_file in board_validity_vk.bin turns_proof_vk.bin; do
  if [ ! -f "${VK_DIR}/${vk_file}" ]; then
    echo "ERROR: VK file not found: ${VK_DIR}/${vk_file}"
    echo "Run ./generate_vk.sh first"
    exit 1
  fi
done

# Build WASM
echo "=== Building contract ==="
cd "$SCRIPT_DIR"
stellar contract build

WASM_PATH="${SCRIPT_DIR}/target/wasm32v1-none/release/battleship_verifier.wasm"
if [ ! -f "$WASM_PATH" ]; then
  echo "ERROR: WASM not found at ${WASM_PATH}"
  exit 1
fi

echo "WASM size: $(wc -c < "$WASM_PATH") bytes"
echo ""

# Get admin address from server keypair
if [ -z "${STELLAR_SERVER_SECRET:-}" ]; then
  echo "ERROR: STELLAR_SERVER_SECRET env var not set"
  exit 1
fi

ADMIN=$(stellar keys address server 2>/dev/null || echo "")
if [ -z "$ADMIN" ]; then
  # Derive from secret key using node (searches backend for stellar-sdk)
  BACKEND_DIR="${SCRIPT_DIR}/../backend"
  ADMIN=$(cd "$BACKEND_DIR" && node -e "const{Keypair}=require('@stellar/stellar-sdk');console.log(Keypair.fromSecret(process.env.STELLAR_SERVER_SECRET).publicKey())" 2>/dev/null || echo "")
fi

if [ -z "$ADMIN" ]; then
  echo "ERROR: Could not derive admin address."
  exit 1
fi

echo "=== Deploying contract ==="
echo "  Admin:    ${ADMIN}"
echo "  Game Hub: ${GAME_HUB}"
echo ""

CONTRACT_ID=$(stellar contract deploy \
  --wasm "$WASM_PATH" \
  --source-account "$STELLAR_SERVER_SECRET" \
  --network testnet \
  -- \
  --admin "$ADMIN" \
  --game_hub "$GAME_HUB" \
  --vk_board_validity "$(cat "${VK_DIR}/board_validity_vk.bin" | xxd -p | tr -d '\n')" \
  --vk_turns_proof "$(cat "${VK_DIR}/turns_proof_vk.bin" | xxd -p | tr -d '\n')")

echo ""
echo "=== Deployed ==="
echo "  Contract ID: ${CONTRACT_ID}"
echo ""
echo "Add to backend .env:"
echo "  SOROBAN_CONTRACT_ID=${CONTRACT_ID}"
echo "  SOROBAN_RPC_URL=https://soroban-testnet.stellar.org"
