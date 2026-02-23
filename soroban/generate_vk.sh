#!/usr/bin/env bash
# Generate verification keys for Noir circuits (UltraHonk + Keccak)
# Requires: bb (barretenberg CLI) in PATH
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
CIRCUIT_DIR="${SCRIPT_DIR}/../circuits"
VK_DIR="${SCRIPT_DIR}/vk"

mkdir -p "$VK_DIR"

CIRCUITS=("board_validity" "turns_proof")

for circuit in "${CIRCUITS[@]}"; do
  echo "=== Generating VK for ${circuit} ==="

  CIRCUIT_JSON="${CIRCUIT_DIR}/${circuit}/target/${circuit}.json"
  if [ ! -f "$CIRCUIT_JSON" ]; then
    echo "ERROR: Circuit not found: ${CIRCUIT_JSON}"
    echo "Run 'nargo compile' in circuits/${circuit}/ first"
    exit 1
  fi

  bb write_vk \
    -b "$CIRCUIT_JSON" \
    -o "${VK_DIR}/" \
    --scheme ultra_honk \
    --oracle_hash keccak \
    --output_format bytes_and_fields

  # bb outputs 'vk' file — rename to circuit-specific name
  mv "${VK_DIR}/vk" "${VK_DIR}/${circuit}_vk.bin"

  echo "  -> ${VK_DIR}/${circuit}_vk.bin"
done

echo ""
echo "VK generation complete. Files:"
ls -la "$VK_DIR"/*.bin
