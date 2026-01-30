#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PORT="${PORT:-8000}"

cd "$ROOT_DIR"

echo "Serving Token Clash prototype from $ROOT_DIR"
echo "Open http://localhost:${PORT}/index.html"

python3 -m http.server "$PORT"
