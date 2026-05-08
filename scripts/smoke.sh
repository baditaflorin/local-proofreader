#!/usr/bin/env bash
set -euo pipefail

npm run build:app
server_log="$(mktemp)"
port="${SMOKE_PORT:-0}"
node scripts/static-server.mjs docs "$port" >"$server_log" &
server_pid=$!

cleanup() {
  kill "$server_pid" >/dev/null 2>&1 || true
  rm -f "$server_log"
}
trap cleanup EXIT

for _ in $(seq 1 50); do
  if grep -q 'Static server listening' "$server_log"; then
    break
  fi
  sleep 0.1
done

server_url="$(sed -n 's/^Static server listening on //p' "$server_log" | tail -n 1)"

if [ -z "$server_url" ]; then
  cat "$server_log"
  exit 1
fi

node scripts/smoke.mjs "$server_url"
