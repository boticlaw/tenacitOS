#!/bin/bash
# Sync OpenClaw sessions to TenacitOS activities database
# This script populates the activities dashboard with real agent sessions
# Run via cron every 5 minutes: */5 * * * * root /path/to/sync-openclaw-sessions.sh

set -e

# Configuration
OPENCLAW_DIR="${OPENCLAW_DIR:-/root/.openclaw}"
TENACITOS_DB="${TENACITOS_DB:-/root/.openclaw/workspace/mission-control/data/activities.db}"
OPENCLAW_CONFIG="$OPENCLAW_DIR/openclaw.json"

# Check dependencies
if ! command -v sqlite3 &> /dev/null; then
    echo "Error: sqlite3 not installed" >&2
    exit 1
fi

if ! command -v jq &> /dev/null; then
    echo "Error: jq not installed" >&2
    exit 1
fi

# Get list of configured channels from OpenClaw config
CONFIGURED_CHANNELS=""
if [ -f "$OPENCLAW_CONFIG" ]; then
    CONFIGURED_CHANNELS=$(jq -r '.channels | keys[]' "$OPENCLAW_CONFIG" 2>/dev/null | tr '\n' '|' | sed 's/|$//')
fi

# Ensure activities table exists
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

# Create indexes for better performance
sqlite3 "$TENACITOS_DB" "CREATE INDEX IF NOT EXISTS idx_activities_timestamp ON activities(timestamp DESC);"
sqlite3 "$TENACITOS_DB" "CREATE INDEX IF NOT EXISTS idx_activities_agent ON activities(agent);"

# Process each agent's sessions
sessions_added=0
for agent_dir in "$OPENCLAW_DIR"/agents/*/; do
    [ -d "$agent_dir" ] || continue
    
    agent_id=$(basename "$agent_dir")
    sessions_file="$agent_dir/sessions/sessions.json"

    if [ ! -f "$sessions_file" ]; then
        continue
    fi

    # Parse sessions and insert into DB
    while IFS= read -r activity; do
        [ -z "$activity" ] && continue

        id=$(echo "$activity" | jq -r '.id')
        timestamp=$(echo "$activity" | jq -r '.timestamp')
        type=$(echo "$activity" | jq -r '.type')
        description=$(echo "$activity" | jq -r '.description' | sed "s/'/''/g")
        status=$(echo "$activity" | jq -r '.status')
        agent=$(echo "$activity" | jq -r '.agent')
        metadata=$(echo "$activity" | jq -c '.metadata' | sed "s/'/''/g")

        # Insert if not exists
        result=$(sqlite3 "$TENACITOS_DB" "INSERT OR IGNORE INTO activities (id, timestamp, type, description, status, duration_ms, tokens_used, agent, metadata) VALUES ('$id', '$timestamp', '$type', '$description', '$status', NULL, NULL, '$agent', '$metadata'); SELECT changes();")
        
        if [ "$result" -gt 0 ]; then
            ((sessions_added++))
        fi
    done < <(jq -r --arg agent "$agent_id" --arg configured "$CONFIGURED_CHANNELS" '
        to_entries[] |
        .value as $session |
        # Determine actual channel
        (
            if $session.deliveryContext.channel then
                $session.deliveryContext.channel
            elif $session.origin.provider then
                $session.origin.provider
            else
                $session.lastChannel // "unknown"
            end
        ) as $rawChannel |
        # Validate channel is configured, else mark as test/internal
        (if ($configured == "" or ($configured | test($rawChannel))) then
            $rawChannel
        else
            "test"
        end) as $actualChannel |
        {
            id: $session.sessionId,
            timestamp: ($session.updatedAt | tonumber / 1000 | strftime("%Y-%m-%dT%H:%M:%S.000Z")),
            type: "session",
            description: "Chat session via \($actualChannel)",
            status: "success",
            agent: $agent,
            metadata: {
                channel: $actualChannel,
                chatType: $session.chatType,
                from: ($session.origin.from // null)
            }
        } |
        @json
    ' "$sessions_file" 2>/dev/null)
done

# Prune activities older than 30 days
cutoff=$(date -d "30 days ago" -u +"%Y-%m-%dT%H:%M:%S.000Z")
pruned=$(sqlite3 "$TENACITOS_DB" "DELETE FROM activities WHERE timestamp < '$cutoff'; SELECT changes();")

echo "✓ Synced $sessions_added new sessions, pruned $pruned old records"
