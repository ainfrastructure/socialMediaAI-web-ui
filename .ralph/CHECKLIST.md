# Ralf Loop Setup Checklist

Use this checklist to track your setup progress.

## ✅ Pre-Setup (Already Done)

- [x] Created `.ralph/` directory structure
- [x] Created `PROMPT.md` with core instructions
- [x] Created `fix_plan.md` with 100 tasks
- [x] Created `specs/` documentation
- [x] Created `ralph.config.json`
- [x] Created execution scripts
- [x] Created GitHub Actions workflow
- [x] Set scripts as executable
- [x] Updated `.gitignore`

## 📋 Your Setup Tasks (To Do)

### 1. Install Ralf Loop
- [ ] Run: `npm install -g @snarktank/ralph`
- [ ] Verify: `ralph --version`

### 2. Get API Keys
- [ ] Get Anthropic API key from: https://console.anthropic.com/settings/keys
- [ ] (Optional) Get GitHub token from: https://github.com/settings/tokens
  - Select scopes: `repo`, `workflow`
- [ ] (Optional) Get Linear API key from: Linear Settings → API

### 3. Configure Environment
- [ ] Copy template: `cp .env.ralph.template .env`
- [ ] Edit `.env` and add your `ANTHROPIC_API_KEY`
- [ ] (Optional) Add `GITHUB_TOKEN` to `.env`
- [ ] (Optional) Add `LINEAR_API_KEY` and `LINEAR_TEAM_ID` to `.env`

### 4. Verify Setup
- [ ] Run: `./scripts/verify-ralph-setup.sh`
- [ ] Ensure all checks pass ✅

### 5. Optional: GitHub Integration
- [ ] Create GitHub labels:
  - [ ] `gh label create "ralph-task" --color "7B68EE"`
  - [ ] `gh label create "ralph-done" --color "00FF00"`
  - [ ] `gh label create "ralph-blocked" --color "FF0000"`
- [ ] Push workflow: `git add .github/workflows/ralph-integration.yml && git commit -m "Add Ralf GitHub workflow" && git push`

### 6. Optional: Linear Integration
- [ ] Get team ID: `curl -X POST https://api.linear.app/graphql -H "Authorization: ${LINEAR_API_KEY}" -d '{"query":"{ teams { nodes { id name } } }"}'`
- [ ] Add team ID to `.env`
- [ ] Create "ralph-task" label in Linear

## 🚀 Launch

- [ ] Review task list: `cat .ralph/fix_plan.md`
- [ ] Review instructions: `cat .ralph/PROMPT.md`
- [ ] Launch Ralf: `./scripts/ralph-overnight.sh`
- [ ] (Optional) Monitor in separate terminal: `tail -f .ralph/logs/overnight_*.log`

## 🌅 Morning Review

- [ ] Check summary: `git log --oneline --since="12 hours ago" --graph`
- [ ] Count completed tasks: `grep "\[x\]" .ralph/fix_plan.md | wc -l`
- [ ] Check for errors: `grep -i "error\|blocked" .ralph/logs/overnight_*.log`
- [ ] Build app: `npm run build`
- [ ] Test on iOS: `npx cap sync ios && npx cap open ios`
- [ ] Test on Android: `npx cap sync android && npx cap open android`

## 🔧 Troubleshooting

If you encounter issues:

- [ ] Read `RALPH_SETUP.md` for detailed troubleshooting
- [ ] Check verification output for specific errors
- [ ] Ensure all API keys are valid
- [ ] Check logs in `.ralph/logs/` for details

## 📚 Documentation Reference

- **Quick Start**: `RALPH_QUICKSTART.md` (5 steps, 5 minutes)
- **Detailed Guide**: `RALPH_SETUP.md` (complete setup)
- **Config Reference**: `.ralph/README.md` (file descriptions)
- **Summary**: `RALPH_IMPLEMENTATION_SUMMARY.md` (what was created)

---

**Current Progress**: Check items as you complete them!

Use: `./scripts/verify-ralph-setup.sh` to see what's left.
