#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
COMPILED_DIR="$SCRIPT_DIR/compiled"

TARGETS=(
  "$ROOT_DIR/web/src/zk/circuits"
  "$ROOT_DIR/mobile/src/zk/circuits"
)

mkdir -p "$COMPILED_DIR"

for circuit in board_validity hash_helper shot_proof turns_proof; do
  echo "Compiling $circuit..."
  (cd "$SCRIPT_DIR/$circuit" && nargo compile)
  cp "$SCRIPT_DIR/$circuit/target/$circuit.json" "$COMPILED_DIR/"
  echo "  -> compiled/$circuit.json"
done

echo ""
echo "Distributing to consumers..."
for target in "${TARGETS[@]}"; do
  mkdir -p "$target"
  cp "$COMPILED_DIR"/*.json "$target/"
  echo "  -> ${target#$ROOT_DIR/}"
done

echo ""
echo "Done. All circuits compiled and distributed."
echo "  backend: reads from CIRCUIT_DIR env (default: ../circuits/compiled)"
echo "  web:     web/src/zk/circuits/"
echo "  mobile:  mobile/src/zk/circuits/"
