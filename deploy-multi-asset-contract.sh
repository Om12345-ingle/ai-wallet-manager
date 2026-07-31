#!/usr/bin/env bash

set -euo pipefail

echo "Both contracts are deployed together to keep their network and signer consistent."
exec "$(dirname "$0")/scripts/deploy-soroban.sh" "${1:-testnet}"
