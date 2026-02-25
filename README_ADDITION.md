# Activity Sync & Service Configuration (Optional)

## Activity Sync

The Activities dashboard shows real-time agent activity. By default, it's empty because TenacitOS uses its own database. To populate it with real OpenClaw message data:

```bash
# Install dependencies
sudo apt-get install sqlite3 jq

# Run the sync script (will sync all messages from .jsonl files)
./scripts/sync-openclaw-activities.sh

# Set up auto-sync every 5 minutes
sudo cp scripts/sync-openclaw-activities.sh /opt/tenacitos/
sudo tee /etc/cron.d/tenacitos-sync-activities <<'EOF'
*/5 * * * * root /opt/tenacitos/sync-openclaw-activities.sh >> /var/log/tenacitos-sync.log 2>&1
EOF
```

This will sync thousands of messages (user + agent responses) to the dashboard, showing real activity.

See [docs/activities-sync.md](./docs/activities-sync.md) for details.

## Service Configuration

TenacitOS automatically detects OpenClaw-related services. No configuration needed for most users.

### Auto-detected services

Services containing these keywords are automatically allowed:
- `openclaw` (e.g., openclaw-gateway)
- `tenacitos` (e.g., tenacitos)
- `mission-control`

### Additional services (optional)

If you need to control services with different names (e.g., nginx, mysql):

**Option 1: Environment variables**
```bash
# In .env.local
TENACITOS_SYSTEMD_SERVICES=nginx,mysql,redis-server
TENACITOS_PM2_SERVICES=my-app,worker-1
```

**Option 2: Config file**

Create `allowed-services.json` in the mission-control directory:

```json
{
  "systemd": ["nginx", "mysql", "redis-server"],
  "pm2": ["my-app", "worker-1"]
}
```

See [allowed-services.example.json](./allowed-services.example.json) for reference.
