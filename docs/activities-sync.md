# OpenClaw Sessions Sync

This script populates the TenacitOS activities dashboard with real session data from OpenClaw agents.

## Problem

By default, the "Activities" dashboard in TenacitOS shows no data because it uses its own SQLite database. This is confusing for users who expect to see real activity from their OpenClaw agents.

## Solution

This script reads OpenClaw agent sessions from `~/.openclaw/agents/*/sessions/sessions.json` and syncs them to the TenacitOS activities database, making the dashboard show real agent activity.

## Features

- **Real data**: Shows actual OpenClaw agent sessions
- **Channel validation**: Only shows configured channels (e.g., telegram, discord)
- **Test detection**: Marks sessions from unconfigured channels as "test"
- **Auto-cleanup**: Prunes activities older than 30 days
- **Incremental**: Only adds new sessions

## Installation

### 1. Install dependencies

```bash
sudo apt-get install sqlite3 jq  # Ubuntu/Debian
```

### 2. Run the script manually to test

```bash
cd /root/.openclaw/workspace/mission-control
./scripts/sync-openclaw-sessions.sh
```

### 3. Set up cron job

```bash
sudo tee /etc/cron.d/tenacitos-sync-activities <<'EOF'
# Sync OpenClaw sessions to TenacitOS activities every 5 minutes
*/5 * * * * root /opt/tenacitos/sync-openclaw-sessions.sh >> /var/log/tenacitos-sync.log 2>&1
EOF
```

## Configuration

Environment variables (optional):

- `OPENCLAW_DIR`: Path to OpenClaw installation (default: `/root/.openclaw`)
- `TENACITOS_DB`: Path to TenacitOS database (default: `$OPENCLAW_DIR/workspace/mission-control/data/activities.db`)

## What it syncs

For each OpenClaw agent session:

- **Type**: `session`
- **Description**: `Chat session via <channel>`
- **Agent**: Agent ID (e.g., `main`, `obsidian-brain`)
- **Status**: `success`
- **Metadata**: Channel, chat type, origin

## Channel validation

The script reads configured channels from `openclaw.json` and validates:

- If channel is configured (e.g., `telegram`) → shows as is
- If channel is not configured (e.g., `whatsapp`) → shows as `test`

This prevents showing impossible channels in the dashboard.

## Troubleshooting

### No data appears

1. Check if OpenClaw has sessions:
   ```bash
   ls -la ~/.openclaw/agents/*/sessions/sessions.json
   ```

2. Run script manually with verbose output:
   ```bash
   bash -x ./scripts/sync-openclaw-sessions.sh
   ```

3. Check database:
   ```bash
   sqlite3 ~/.openclaw/workspace/mission-control/data/activities.db \
     "SELECT COUNT(*) FROM activities WHERE type='session';"
   ```

### Wrong channels shown

The script validates channels against `openclaw.json`. Check your configuration:

```bash
jq '.channels | keys' ~/.openclaw/openclaw.json
```

## Contributing

Contributions welcome! This is a community contribution to make TenacitOS more useful out of the box.

## License

MIT (same as TenacitOS)
