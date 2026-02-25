# Activity Sync (Optional)

The Activities dashboard shows real-time agent activity. By default, it's empty because TenacitOS uses its own database. To populate it with real OpenClaw session data:

```bash
# Install dependencies
sudo apt-get install sqlite3 jq

# Run the sync script
./scripts/sync-openclaw-sessions.sh

# Set up auto-sync every 5 minutes
sudo cp scripts/sync-openclaw-sessions.sh /opt/tenacitos/
sudo tee /etc/cron.d/tenacitos-sync-activities <<'EOF'
*/5 * * * * root /opt/tenacitos/sync-openclaw-sessions.sh >> /var/log/tenacitos-sync.log 2>&1
EOF
```

See [docs/activities-sync.md](./docs/activities-sync.md) for details.
