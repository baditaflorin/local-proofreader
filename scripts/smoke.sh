#!/usr/bin/env bash
set -euo pipefail

npm run build:app
port="${SMOKE_PORT:-$((4300 + RANDOM % 1000))}"
node scripts/static-server.mjs docs "$port" &
server_pid=$!

cleanup() {
  kill "$server_pid" >/dev/null 2>&1 || true
}
trap cleanup EXIT

sleep 1
node scripts/smoke.mjs "http://127.0.0.1:${port}/local-proofreader/"
