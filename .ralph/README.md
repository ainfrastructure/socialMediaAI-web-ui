# Ralf Loop Configuration Directory

This directory contains all configuration files for Ralf Loop autonomous development.

## Files

### `PROMPT.md`
Core instructions for Ralf. Contains:
- Mission statement
- Technology stack
- Architecture principles
- Critical patterns to follow
- Exit conditions

**Update this file** if you need to change Ralf's behavior or add new instructions.

### `fix_plan.md`
Task checklist (100 tasks) organized by phase:
1. Foundation (Capacitor setup, base components)
2. Authentication (Supabase, OAuth)
3. Restaurant Management
4. Content Generation (Gemini, Veo)
5. Social Platform Connections
6. Scheduling & Publishing
7. Analytics & Engagement
8. Billing & Subscriptions
9. Native Polish
10. Quality & Testing

**Ralf marks tasks** with `[x]` as it completes them.

### `specs/`
Technical documentation:
- `requirements.md`: Platform requirements, plugins, performance targets
- `api-integration.md`: Complete API endpoint reference

**Reference these** when adding new features or debugging API calls.

### `logs/`
Execution logs from overnight runs:
- `overnight_[timestamp].log`: Full output from each run
- `ralph.log`: Continuous log (configured in `ralph.config.json`)

**Review logs** to track progress and debug issues.

## How Ralf Uses This Directory

1. **Reads `PROMPT.md`**: Understands mission and coding standards
2. **Reads `fix_plan.md`**: Gets next unchecked task
3. **Reads `specs/`**: References technical requirements
4. **Implements task**: Writes code, runs quality gates
5. **Updates `fix_plan.md`**: Marks task as `[x]` complete
6. **Commits changes**: Auto-commits with descriptive message
7. **Loops**: Repeats until all tasks done or exit condition met

## Customizing Ralf's Behavior

### Add New Tasks
Edit `fix_plan.md`:
```markdown
- [ ] Your new task description
```

### Change Quality Gates
Edit `../ralph.config.json`:
```json
{
  "quality": {
    "commands": ["npm run type-check", "npm run build"],
    "requiredToPass": ["build"]
  }
}
```

### Adjust API Rate Limits
Edit `../ralph.config.json`:
```json
{
  "ai": {
    "apiCallsPerHour": 30  // Lower = slower but cheaper
  }
}
```

### Add More Context
Add new `.md` files to `specs/` and reference them in `PROMPT.md`.

## Monitoring Progress

```bash
# Real-time log
tail -f logs/overnight_*.log

# Task completion count
grep -c "\[x\]" fix_plan.md

# Recent commits
git log --oneline --since="2 hours ago"
```

## Rollback

If Ralf makes unwanted changes:

```bash
# Find backup branch (created by ralph-overnight.sh)
git branch | grep backup

# Reset to backup
git reset --hard backup/[timestamp]
```

## Tips

- **Start small**: Test with a few tasks before full overnight run
- **Review commits**: Ralf's work is in version control, review it
- **Add context**: If Ralf gets stuck, add more detail to `PROMPT.md`
- **Manual fixes**: Fix blockers manually, let Ralf continue
- **Iterate**: Ralf learns from existing code patterns

---

**Ready to run?**
```bash
cd /Users/svendaneel/Desktop/Programming/socialMediaAI-web-ui
./scripts/ralph-overnight.sh
```
