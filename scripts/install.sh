#!/usr/bin/env bash
set -euo pipefail

REPO_DIR="$(cd "$(dirname "$0")/.." && pwd)"
CLI_DIR="$REPO_DIR/packages/cli"

echo "==> Installing dependencies"
npm install --prefix "$REPO_DIR"

echo "==> Building all packages"
npm run build --prefix "$REPO_DIR"

echo "==> Linking 'plan' CLI globally"
cd "$CLI_DIR"
npm link

VERSION=$(node -p "require('./package.json').version")
GLOBAL_BIN="$(npm prefix -g)/bin"
WHICH=$(command -v plan 2>/dev/null || true)

echo ""
echo "Done — plan v${VERSION} linked globally (npm puts the shim under your global node prefix)."
echo "  global bin dir: ${GLOBAL_BIN}/plan"
if [[ -n "$WHICH" ]]; then
  echo "  this shell:     ${WHICH}"
else
  echo "  this shell:     (plan not on PATH — open a new terminal or ensure nvm/node global bin is in PATH)"
  echo "                  e.g. add to PATH: ${GLOBAL_BIN}"
fi
echo ""
echo "Run 'plan --help' to get started."
