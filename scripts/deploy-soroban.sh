#!/usr/bin/env bash

set -euo pipefail

NETWORK="${1:-${STELLAR_NETWORK:-testnet}}"
SOURCE="${STELLAR_SOURCE:-deployer}"
OUT_DIR="target/wasm"

if [[ "$NETWORK" != "testnet" && "$NETWORK" != "mainnet" ]]; then
  echo "Usage: STELLAR_SOURCE=<identity-or-secret> $0 [testnet|mainnet]" >&2
  exit 2
fi

if [[ "$NETWORK" == "mainnet" && "${ALLOW_MAINNET_DEPLOY:-false}" != "true" ]]; then
  echo "Mainnet deployment spends real XLM. Re-run with ALLOW_MAINNET_DEPLOY=true." >&2
  exit 2
fi

if ! command -v stellar >/dev/null 2>&1; then
  echo "Stellar CLI is required: cargo install --locked stellar-cli" >&2
  exit 1
fi

SOURCE_ADDRESS="${STELLAR_SOURCE_ADDRESS:-}"
if [[ -z "$SOURCE_ADDRESS" ]]; then
  SOURCE_ADDRESS="$(stellar keys address "$SOURCE" 2>/dev/null || true)"
fi
if [[ -z "$SOURCE_ADDRESS" ]]; then
  echo "Unable to resolve the signer address. Set STELLAR_SOURCE_ADDRESS." >&2
  exit 1
fi

echo "Building Soroban contracts..."
stellar contract build --out-dir "$OUT_DIR"

echo "Deploying wallet-guard to $NETWORK..."
WALLET_GUARD_ID="$(
  stellar contract deploy \
    --wasm "$OUT_DIR/wallet_guard.wasm" \
    --source "$SOURCE" \
    --network "$NETWORK" \
    --alias "ai-wallet-manager-wallet-guard-$NETWORK" |
    tail -n 1
)"

echo "Initializing wallet-guard..."
stellar contract invoke \
  --id "$WALLET_GUARD_ID" \
  --source "$SOURCE" \
  --network "$NETWORK" \
  --send yes \
  -- initialize \
  --owner "$SOURCE_ADDRESS"

echo "Deploying multi-asset-manager to $NETWORK..."
MULTI_ASSET_ID="$(
  stellar contract deploy \
    --wasm "$OUT_DIR/multi_asset_manager.wasm" \
    --source "$SOURCE" \
    --network "$NETWORK" \
    --alias "ai-wallet-manager-multi-asset-$NETWORK" |
    tail -n 1
)"

echo "Initializing multi-asset-manager..."
stellar contract invoke \
  --id "$MULTI_ASSET_ID" \
  --source "$SOURCE" \
  --network "$NETWORK" \
  --send yes \
  -- initialize \
  --admin "$SOURCE_ADDRESS"

echo
echo "Deployment complete."
echo "Network: $NETWORK"
echo "Deployer: $SOURCE_ADDRESS"
echo "Wallet Guard: $WALLET_GUARD_ID"
echo "Multi Asset Manager: $MULTI_ASSET_ID"
echo
echo "Set these application variables:"
echo "NEXT_PUBLIC_STELLAR_NETWORK=$NETWORK"
echo "SOROBAN_CONTRACT_ID=$WALLET_GUARD_ID"
echo "NEXT_PUBLIC_CONTRACT_ID=$WALLET_GUARD_ID"
echo "MULTI_ASSET_CONTRACT_ID=$MULTI_ASSET_ID"
echo "NEXT_PUBLIC_MULTI_ASSET_CONTRACT_ID=$MULTI_ASSET_ID"
