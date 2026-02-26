# Cost Tracking System

SuperBotijo now tracks real usage costs by reading OpenClaw session data and calculating costs based on actual token usage.

## How It Works

1. **Data Collection**: The `collect-usage.ts` script reads `openclaw status --json` to get current session data
2. **Cost Calculation**: Uses model pricing table to calculate costs based on input/output tokens
3. **Storage**: Saves snapshots to SQLite database (`data/usage-tracking.db`)
4. **API**: The `/api/costs` endpoint queries the database to serve real cost data to the dashboard

## Model Pricing

Current pricing (as of Feb 2026):

| Model | Input ($/M tokens) | Output ($/M tokens) |
|-------|-------------------|---------------------|
| Opus 4.6 | $15.00 | $75.00 |
| Sonnet 4.5 | $3.00 | $15.00 |
| Haiku 3.5 | $0.80 | $4.00 |
| Gemini Flash | $0.15 | $0.60 |
| Gemini Pro | $1.25 | $5.00 |
| Grok 4.1 Fast | $2.00 | $10.00 |

Pricing is defined in `src/lib/pricing.ts`.

## Manual Collection

To collect usage data manually:

```bash
cd /root/.openclaw/workspace/mission-control
npx tsx scripts/collect-usage.ts
```

This will:
- Read current OpenClaw session data
- Calculate costs for each agent + model combination
- Save a snapshot to the database (replacing any existing data for the same hour)

## Automatic Collection (Cron)

To set up hourly automatic collection:

```bash
cd /root/.openclaw/workspace/mission-control
./scripts/setup-cron.sh
```

This adds a cron job that runs every hour at minute 0.

**View cron jobs:**
```bash
crontab -l
```

**View logs:**
```bash
tail -f /var/log/mission-control-usage.log
```

**Remove cron job:**
```bash
crontab -e
# Delete the line containing 'collect-usage.ts'
```

## Database Schema

```sql
CREATE TABLE usage_snapshots (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  timestamp INTEGER NOT NULL,
  date TEXT NOT NULL,           -- YYYY-MM-DD
  hour INTEGER NOT NULL,         -- 0-23
  agent_id TEXT NOT NULL,
  model TEXT NOT NULL,
  input_tokens INTEGER NOT NULL,
  output_tokens INTEGER NOT NULL,
  total_tokens INTEGER NOT NULL,
  cost REAL NOT NULL,
  created_at INTEGER DEFAULT (strftime('%s', 'now'))
);
```

## Querying the Database

**Total cost today:**
```bash
sqlite3 data/usage-tracking.db \
  "SELECT SUM(cost) FROM usage_snapshots WHERE date = date('now');"
```

**Cost by agent (last 30 days):**
```bash
sqlite3 data/usage-tracking.db \
  "SELECT agent_id, ROUND(SUM(cost), 2) as cost 
   FROM usage_snapshots 
   WHERE date >= date('now', '-30 days')
   GROUP BY agent_id 
   ORDER BY cost DESC;"
```

**Cost by model:**
```bash
sqlite3 data/usage-tracking.db \
  "SELECT model, ROUND(SUM(cost), 2) as cost 
   FROM usage_snapshots 
   WHERE date >= date('now', '-30 days')
   GROUP BY model 
   ORDER BY cost DESC;"
```

**Daily trend (last 7 days):**
```bash
sqlite3 data/usage-tracking.db \
  "SELECT date, ROUND(SUM(cost), 2) as cost 
   FROM usage_snapshots 
   WHERE date >= date('now', '-7 days')
   GROUP BY date 
   ORDER BY date DESC;"
```

## API Endpoints

### GET /api/costs

Returns cost summary, breakdowns, and trends.

**Query params:**
- `timeframe` (default: `30d`) - Number of days to include in aggregations

**Response:**
```json
{
  "today": 0.80,
  "yesterday": 1.25,
  "thisMonth": 12.50,
  "lastMonth": 38.90,
  "projected": 52.30,
  "budget": 100.00,
  "byAgent": [
    { "agent": "main", "cost": 5.50, "tokens": 450000, "percentOfTotal": 44 }
  ],
  "byModel": [
    { "model": "anthropic/claude-sonnet-4-5", "cost": 8.30, "tokens": 890000, "percentOfTotal": 66 }
  ],
  "daily": [
    { "date": "02-20", "cost": 0.80, "input": 12000, "output": 8000 }
  ],
  "hourly": [
    { "hour": "14:00", "cost": 0.12 }
  ]
}
```

## Troubleshooting

**No data showing up:**
- Run `npx tsx scripts/collect-usage.ts` to collect initial data
- Check database exists: `ls -lh data/usage-tracking.db`
- Query database: `sqlite3 data/usage-tracking.db "SELECT COUNT(*) FROM usage_snapshots;"`

**Unknown model warnings:**
- Update `src/lib/pricing.ts` with new model pricing
- Rebuild: `npm run build`
- Restart: `systemctl restart mission-control`

**Costs seem wrong:**
- Verify pricing in `src/lib/pricing.ts`
- Check token counts: `openclaw status --json | jq '.sessions.byAgent[].recent[].totalTokens'`
- Recalculate: delete database and re-collect

## Future Enhancements

- [ ] Budget alerts (email/Telegram when >80% spent)
- [ ] Export reports (PDF/CSV)
- [ ] Cost forecasting with ML
- [ ] Per-session cost tracking (not just agent totals)
- [ ] Integration with OpenRouter billing API for real invoices
- [ ] Cost optimization suggestions ("switch to Haiku for heartbeats")

---

**Created:** 2026-02-20  
**Author:** Tenacitas 🦞
