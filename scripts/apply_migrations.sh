#!/usr/bin/env bash
# Apply SQL migrations in server/migrations using psql
# Requires: SUPABASE_DB_URL and psql in PATH
set -euo pipefail

if [ -z "${SUPABASE_DB_URL:-}" ]; then
  echo "Set SUPABASE_DB_URL before running: export SUPABASE_DB_URL='postgres://user:pass@host:5432/db'"
  exit 2
fi

MIG_DIR="$(dirname "$0")/../server/migrations"
MIGS=("$MIG_DIR"/*.sql)

if [ ${#MIGS[@]} -eq 0 ]; then
  echo "No migrations found in $MIG_DIR"
  exit 0
fi

echo "Migrations to apply:"
for m in "${MIGS[@]}"; do echo " - $(basename "$m")"; done
read -p "Apply to $SUPABASE_DB_URL ? Type YES to continue: " confirm
if [ "$confirm" != "YES" ]; then
  echo "Aborted"; exit 1
fi

for m in "${MIGS[@]}"; do
  echo "Applying: $(basename "$m")"
  psql "$SUPABASE_DB_URL" -v ON_ERROR_STOP=1 -f "$m"
done

echo "Migrations applied successfully."