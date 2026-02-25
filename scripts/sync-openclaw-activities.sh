#!/bin/bash
# Sync OpenClaw messages to TenacitOS - Simple & Fast

OPENCLAW_DIR="${OPENCLAW_DIR:-/root/.openclaw}"
TENACITOS_DB="${TENACITOS_DB:-/root/.openclaw/workspace/mission-control/data/activities.db}"

command -v sqlite3 >/dev/null 2>&1 || exit 1
command -v jq >/dev/null 2>&1 || exit 1

sqlite3 "$TENACITOS_DB" "CREATE TABLE IF NOT EXISTS activities (
  id TEXT PRIMARY KEY,
  timestamp TEXT NOT NULL,
  type TEXT NOT NULL,
  description TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'success',
  duration_ms INTEGER,
  tokens_used INTEGER,
  agent TEXT,
  metadata TEXT
);"

total=0
for jsonl_file in "$OPENCLAW_DIR"/agents/*/sessions/*.jsonl; do
    [ -f "$jsonl_file" ] || continue
    
    agent=$(basename $(dirname $(dirname "$jsonl_file")))
    session=$(basename "$jsonl_file" .jsonl)
    
    # Process messages
    while IFS= read -r line; do
        [ -z "$line" ] && continue
        
        id=$(echo "$line" | jq -r '.id')
        timestamp=$(echo "$line" | jq -r '.timestamp')
        role=$(echo "$line" | jq -r '.message.role // "unknown"')
        
        [ "$role" = "null" ] && continue
        [ "$timestamp" = "null" ] && continue
        
        if [ "$role" = "user" ]; then
            type="message_sent"
            desc="User message"
        else
            type="message_received"
            desc="Agent response"
        fi
        
        metadata="{\"role\":\"$role\",\"session\":\"$session\"}"
        
        sqlite3 "$TENACITOS_DB" "INSERT OR IGNORE INTO activities (id, timestamp, type, description, status, agent, metadata) VALUES ('$id', '$timestamp', '$type', '$desc', 'success', '$agent', '$metadata');" 2>/dev/null && ((total++))
        
    done < <(jq -c 'select(.type == "message" and .message.role != null)' "$jsonl_file" 2>/dev/null)
done

# Prune old records
cutoff=$(date -d "30 days ago" -u +"%Y-%m-%dT%H:%M:%S")
sqlite3 "$TENACITOS_DB" "DELETE FROM activities WHERE timestamp < '$cutoff';"

echo "✓ Synced $total activities"
