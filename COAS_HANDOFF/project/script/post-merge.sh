#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "${BASH_SOURCE[0]}")/.."

# Restore the exact merged dependency versions without interactive prompts.
npm ci --no-audit --no-fund

# Validate the production bundle before workflow reconciliation starts the app.
npm run build

# Database changes require an explicit migration plan; never push schemas here.
