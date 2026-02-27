# Cron Systems Guide - SuperBotijo

> **Summary:** Guide for choosing between System Cron, OpenClaw Cron, and Heartbeat for scheduling tasks in SuperBotijo.

This document explains the three scheduling systems available in SuperBotijo and when to use each one.

---

## Table of Contents

1. [Overview](#overview)
2. [Quick Decision Guide](#quick-decision-guide)
3. [System Cron (Linux)](#system-cron-linux)
4. [OpenClaw Cron (Gateway)](#openclaw-cron-gateway)
5. [Heartbeat](#heartbeat)
6. [Current Setup](#current-setup)
7. [Best Practices](#best-practices)
8. [Migration Guide](#migration-guide)

---

## Overview

SuperBotijo has **three different scheduling systems** available:

| System | Location | Managed By | Use Case |
|--------|----------|------------|----------|
| **System Cron** | `/etc/cron.d/` | Linux OS | System tasks, scripts |
| **OpenClaw Cron** | `~/.openclaw/cron/jobs.json` | OpenClaw Gateway | Agent tasks, reminders |
| **Heartbeat** | Main session | OpenClaw Gateway | Periodic checks, monitoring |

Each system serves different purposes and has different strengths.

---

## Quick Decision Guide

### Decision Flowchart

```
Does the task need to run at an EXACT time?
  YES → Use OpenClaw Cron
  NO  → Continue...

Does the task need the AI agent?
  YES → Use OpenClaw Cron
  NO  → Continue...

Can this task be batched with other periodic checks?
  YES → Use Heartbeat
  NO  → Use System Cron

Is this a one-shot reminder?
  YES → Use OpenClaw Cron with --at
  NO  → Continue...

Does it need a different model or thinking level?
  YES → Use OpenClaw Cron (isolated)
  NO  → Use Heartbeat
```

### Quick Reference Table

| Question | System |
|----------|--------|
| Exact timing required? | OpenClaw Cron |
| Needs AI agent/reasoning? | OpenClaw Cron |
| Simple system script? | System Cron |
| Multiple checks in batch? | Heartbeat |
| One-shot reminder? | OpenClaw Cron |
| System backups/sync? | System Cron |
| Context-aware monitoring? | Heartbeat |

---

## System Cron (Linux)

### What it is

Traditional Linux cron jobs stored in `/etc/cron.d/`. These run independently of OpenClaw and the agent.

### When to use

✅ **Perfect for:**
- System backups
- Data synchronization scripts
- File cleanup/maintenance
- Processes that run even if Gateway is stopped
- Simple scripts without AI reasoning

❌ **Don't use for:**
- Tasks requiring agent decisions
- Reminders that need to notify you
- Tasks that need model/thinking overrides
- Anything that needs conversational context

### Current examples

```bash
# Obsidian vault backup (every 12 hours)
0 */12 * * * root /usr/local/bin/obsidian-vault-backup.sh

# SuperBotijo activities sync (every 5 minutes)
*/5 * * * * root /opt/superbotijo/sync-activities-simple.sh

# OpenClaw ICS calendar sync (every 15 minutes)
*/15 * * * * root /opt/openclaw-ics/.venv/bin/python /opt/openclaw-ics/ics_sync.py

# Obsidian daily extract (daily at 03:15)
15 3 * * * root /opt/obsidian-enrich/daily_extract.py

# Obsidian LLM classify (daily at 03:30)
30 3 * * * root OPENCLAW_LLM_CLASSIFY_MAX=20 /opt/obsidian-enrich/llm_classify_extracted.py
```

### Advantages

- Runs even if OpenClaw Gateway is stopped
- No token usage
- Simple and reliable
- Full system access
- Easy to manage via systemd

### Disadvantages

- No AI reasoning
- No automatic notifications
- No model selection
- Manual management required

### How to manage

```bash
# List all system cron jobs
ls -la /etc/cron.d/

# Add new job
sudo nano /etc/cron.d/my-job

# View logs
tail -f /var/log/syslog | grep CRON
```

---

## OpenClaw Cron (Gateway)

### What it is

Built-in scheduler that runs **inside the OpenClaw Gateway**. Jobs are stored in `~/.openclaw/cron/jobs.json` and can trigger agent tasks.

### When to use

✅ **Perfect for:**
- Exact timing ("Send report at 9:00 AM every Monday")
- One-shot reminders ("Remind me in 20 minutes")
- Tasks requiring AI reasoning
- Announcements to channels (Telegram, Slack, WhatsApp)
- Isolated tasks with different model/thinking
- Background tasks that shouldn't clutter main session history

❌ **Don't use for:**
- Simple system scripts (use System Cron instead)
- Batch periodic checks (use Heartbeat instead)

### Key features

- **Precise timing**: 5-field or 6-field cron expressions with timezone support
- **Session isolation**: Runs in `cron:<jobId>` without polluting main history
- **Model overrides**: Use different model per job (e.g., Opus for deep analysis)
- **Delivery control**: Announce summaries to channels
- **One-shot support**: `--at` for precise future timestamps

### Examples

#### One-shot reminder (main session)

```bash
openclaw cron add \
  --name "Meeting reminder" \
  --at "20m" \
  --session main \
  --system-event "Reminder: standup meeting starts in 10 minutes." \
  --wake now \
  --delete-after-run
```

#### Recurring daily briefing (isolated)

```bash
openclaw cron add \
  --name "Morning briefing" \
  --cron "0 7 * * *" \
  --tz "Europe/Madrid" \
  --session isolated \
  --message "Generate today's briefing: weather, calendar, top emails, news summary." \
  --model opus \
  --announce \
  --channel telegram \
  --to "244620835"
```

#### Weekly deep analysis (different model)

```bash
openclaw cron add \
  --name "Weekly codebase analysis" \
  --cron "0 6 * * 0" \
  --tz "Europe/Madrid" \
  --session isolated \
  --message "Analyze codebase for technical debt and optimization opportunities." \
  --model opus \
  --thinking high \
  --announce \
  --channel telegram \
  --to "244620835"
```

#### System event (main session)

```bash
openclaw cron add \
  --name "Check project" \
  --every "4h" \
  --session main \
  --system-event "Time for a project health check" \
  --wake now
```

### Main vs Isolated session

| Feature | Main Session | Isolated Session |
|---------|-------------|------------------|
| Session | Main | `cron:<jobId>` |
| History | Shared | Fresh each run |
| Context | Full | None (starts clean) |
| Model | Main session model | Can override |
| Output | Via heartbeat | Announce summary |

**Use main session when:**
- Reminder should appear in main context
- Agent should handle it with full context
- No separate isolated run needed

**Use isolated session when:**
- Clean slate without prior context
- Different model or thinking settings
- Announce summaries directly to channel
- History shouldn't clutter main session

### How to manage

```bash
# List all OpenClaw cron jobs
openclaw cron list

# Add new job
openclaw cron add --name "My job" --cron "0 9 * * *" --session isolated --message "..."

# Run job immediately
openclaw cron run <job-id>

# View run history
openclaw cron runs --id <job-id> --limit 50

# Edit job
openclaw cron edit <job-id> --message "Updated prompt"

# Delete job
openclaw cron remove <job-id>
```

### Storage location

- Jobs: `~/.openclaw/cron/jobs.json`
- Run history: `~/.openclaw/cron/runs/<jobId>.jsonl`

---

## Heartbeat

### What it is

Periodic checks that run in the **main session** at regular intervals (default: 30 minutes). Designed for the agent to monitor things and surface important items.

### When to use

✅ **Perfect for:**
- Batching multiple periodic checks together
- Context-aware decisions (agent knows what's urgent)
- Conversational continuity
- Low-overhead monitoring
- Smart suppression (only alerts when needed)

❌ **Don't use for:**
- Exact timing requirements
- One-shot reminders
- Tasks that need different model
- Noisy/frequent tasks

### How it works

1. Agent reads `HEARTBEAT.md` checklist every 30 minutes
2. Performs all checks in a single agent turn
3. If nothing needs attention → replies `HEARTBEAT_OK` (no message delivered)
4. If something important → sends message to configured target

### Example: HEARTBEAT.md

```markdown
# Heartbeat checklist

## Checks to perform every 30 minutes

- [ ] Check email for urgent messages
- [ ] Review calendar for events in next 2 hours
- [ ] Check weather for significant changes
- [ ] Review any pending tasks
- [ ] If background task finished, summarize results
- [ ] If idle for 8+ hours, send brief check-in

## Notes

- Only alert if something actually needs attention
- Use `HEARTBEAT_OK` if everything is fine
- Be smart about prioritization
```

### Configuration

```json5
{
  agents: {
    defaults: {
      heartbeat: {
        every: "30m",          // interval
        target: "last",        // where to deliver alerts
        activeHours: { start: "08:00", end: "22:00" }, // optional
      },
    },
  },
}
```

### Advantages

- **Batches multiple checks**: One agent turn reviews everything
- **Reduces API calls**: Cheaper than multiple cron jobs
- **Context-aware**: Agent knows recent conversations
- **Smart suppression**: Only alerts when necessary
- **Natural timing**: Drifts slightly based on queue load

### Disadvantages

- Not exact timing (~30 min intervals)
- Shares main session context
- Cannot use different model

---

## Current Setup

### System Cron Jobs

Currently running in `/etc/cron.d/`:

| Job | Schedule | Purpose |
|-----|----------|---------|
| `obsidian-daily-extract` | Daily 03:15 | Extract evergreen notes from daily |
| `obsidian-llm-classify` | Daily 03:30 | Classify extracted notes with LLM |
| `obsidian-vault-backup` | Every 12h | Backup vault to GitHub |
| `superbotijo-sync-activities` | Every 5 min | Sync OpenClaw activities to dashboard |
| `openclaw-ics-sync` | Every 15 min | Sync calendar from ICS feed |

### OpenClaw Cron Jobs

Currently: **0 jobs** (empty)

Location: `~/.openclaw/cron/jobs.json`

### Heartbeat

Currently: **Not configured**

Location: `HEARTBEAT.md` in workspace root

---

## Best Practices

### 1. Use the right tool for the job

- **System scripts** → System Cron
- **Agent tasks** → OpenClaw Cron
- **Batch monitoring** → Heartbeat

### 2. Batch similar checks

Instead of 5 separate cron jobs checking:
- Email
- Calendar
- Weather
- Notifications
- Project status

Use **one heartbeat** that checks all 5 in a single turn.

### 3. Keep HEARTBEAT.md small

Large checklists increase token usage. Keep it concise:

```markdown
# Heartbeat

- Check email/calendar for urgent items
- Review pending tasks
- Alert if idle 8+ hours
```

### 4. Use isolated sessions for noisy tasks

Tasks that run frequently or generate lots of output should use `--session isolated` to avoid cluttering main session history.

### 5. Set appropriate models

- Routine checks: Default model
- Deep analysis: `--model opus`
- Quick tasks: `--model haiku`

### 6. Configure delivery wisely

- `--announce` for important summaries
- `--delivery none` for internal-only tasks
- `--channel telegram` for mobile notifications

### 7. Timezone awareness

Always specify `--tz` for time-sensitive jobs:

```bash
--cron "0 9 * * *" --tz "Europe/Madrid"
```

### 8. One-shot jobs auto-delete

Jobs with `--at` delete after success by default. Use `--no-delete-after-run` to keep them.

---

## Migration Guide

### From System Cron to OpenClaw Cron

**Before (System Cron):**
```bash
# /etc/cron.d/daily-report
0 9 * * * root /opt/scripts/send-report.sh
```

**After (OpenClaw Cron):**
```bash
openclaw cron add \
  --name "Daily report" \
  --cron "0 9 * * *" \
  --tz "Europe/Madrid" \
  --session isolated \
  --message "Generate and send daily report." \
  --announce \
  --channel telegram \
  --to "244620835"
```

### From multiple cron jobs to Heartbeat

**Before (5 separate cron jobs):**
```bash
*/30 * * * * root check-email.sh
*/30 * * * * root check-calendar.sh
*/30 * * * * root check-weather.sh
*/30 * * * * root check-notifications.sh
*/30 * * * * root check-projects.sh
```

**After (single heartbeat):**
```markdown
# HEARTBEAT.md

- Check email for urgent messages
- Check calendar for events in next 2h
- Check weather for significant changes
- Review notifications
- Check project status
```

---

## Combining All Three

The most efficient setup uses **all three systems**:

### System Cron
- Backups and sync
- System maintenance
- Scripts without AI

### OpenClaw Cron
- Daily briefing at 7am
- Weekly review on Mondays
- One-shot reminders
- Deep analysis with Opus

### Heartbeat
- Email monitoring
- Calendar awareness
- Project health checks
- Smart notifications

### Example: Complete setup

**System Cron (`/etc/cron.d/`):**
```bash
# Backup every 12h
0 */12 * * * root /usr/local/bin/backup.sh

# Sync every 5 min
*/5 * * * * root /opt/superbotijo/sync.sh
```

**OpenClaw Cron:**
```bash
# Morning briefing
openclaw cron add --name "Morning brief" --cron "0 7 * * *" --session isolated --message "Generate daily briefing" --announce

# Weekly review
openclaw cron add --name "Weekly review" --cron "0 9 * * 1" --session isolated --message "Weekly project review" --model opus --announce
```

**Heartbeat (`HEARTBEAT.md`):**
```markdown
# Heartbeat

- Check email for urgent items
- Check calendar for upcoming events
- Review project status
- Alert if idle 8+ hours
```

---

## Troubleshooting

### OpenClaw Cron not running

1. Check cron is enabled:
   ```bash
   openclaw status
   ```

2. Check Gateway is running:
   ```bash
   systemctl status openclaw-gateway
   ```

3. Check jobs exist:
   ```bash
   openclaw cron list
   ```

### Heartbeat not working

1. Check `HEARTBEAT.md` exists in workspace
2. Check heartbeat configuration in `openclaw.json`
3. Check Gateway logs:
   ```bash
   journalctl -u openclaw-gateway -f
   ```

### System Cron not running

1. Check cron service:
   ```bash
   systemctl status cron
   ```

2. Check logs:
   ```bash
   tail -f /var/log/syslog | grep CRON
   ```

3. Check job syntax:
   ```bash
   crontab -l
   ```

---

## References

- [OpenClaw Cron Jobs Documentation](https://docs.openclaw.ai/automation/cron-jobs)
- [Cron vs Heartbeat Guide](https://docs.openclaw.ai/automation/cron-vs-heartbeat)
- [Heartbeat Configuration](https://docs.openclaw.ai/gateway/heartbeat)
- [System Cron Documentation](https://man7.org/linux/man-pages/man5/crontab.5.html)

---

**Last updated:** 2026-02-27  
**Author:** SuperBotijo 🫙
