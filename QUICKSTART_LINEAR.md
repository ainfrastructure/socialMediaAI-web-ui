# Quick Start: Create Linear Stories for Native App Migration

This guide will help you quickly create 27 comprehensive Linear stories for the native app migration in under 5 minutes.

## TL;DR - Fastest Path

```bash
# Run the interactive setup
./scripts/setup-linear.sh
```

This single command will:
1. ✅ Create .env file if needed
2. ✅ Prompt for your Linear API key
3. ✅ Fetch and display your teams
4. ✅ Save configuration
5. ✅ Optionally create all 27 stories immediately

---

## Manual Setup (Alternative)

### Step 1: Get Linear Credentials (2 minutes)

#### Get API Key
1. Go to [Linear Settings → API](https://linear.app/settings/api)
2. Click "Personal API Keys"
3. Click "Create new key"
4. Copy the key (starts with `lin_api_...`)

#### Get Team ID
```bash
# Set your API key
export LINEAR_API_KEY="lin_api_your_key_here"

# Fetch teams
curl -X POST https://api.linear.app/graphql \
  -H "Authorization: ${LINEAR_API_KEY}" \
  -H "Content-Type: application/json" \
  -d '{"query":"{ teams { nodes { id name } } }"}' | jq

# Copy your team ID from the response
```

### Step 2: Configure Environment (30 seconds)

Add to your `.env` file:
```bash
LINEAR_API_KEY=lin_api_your_key_here
LINEAR_TEAM_ID=your-team-id-here
```

Or export directly:
```bash
export LINEAR_API_KEY="lin_api_your_key_here"
export LINEAR_TEAM_ID="your-team-id-here"
```

### Step 3: Create Stories (2 minutes)

```bash
# Load environment
source .env

# Run the script
node scripts/create-linear-stories.js
```

The script will:
- Create 27 stories with full descriptions
- Add labels: `native-migration`, `ralph-task`
- Set priorities and story point estimates
- Output URLs for each created story

---

## What You'll Get

### 27 Comprehensive Stories
- **Foundation & Infrastructure** (8 pts)
- **Authentication & Onboarding** (13 pts)
- **User Profile & Settings** (5 pts)
- **Subscription & Billing** (8 pts)
- **Restaurant Management** (13 pts)
- **Social Platform Accounts** (13 pts)
- **Content Creation - Easy Mode** (21 pts)
- **Content Creation - Advanced Mode** (21 pts)
- **Carousel Posts** (8 pts)
- **Posts Hub** (8 pts)
- **Favorites System** (5 pts)
- **Scheduler & Calendar** (21 pts)
- **Weekly Menu Generator** (8 pts)
- **Analytics & Engagement** (13 pts)
- **Notifications** (8 pts)
- **Real-time Features (SSE)** (5 pts)
- **Referral Program** (5 pts)
- **Image & Media Management** (8 pts)
- **Platform-Specific Publishing** (13 pts)
- **Offline Support** (8 pts)
- **Performance Optimization** (8 pts)
- **Testing & QA** (13 pts)
- **App Store Deployment** (8 pts)
- **Design System Migration** (13 pts)
- **Holiday Features** (5 pts)
- **Accessibility** (8 pts)
- **Documentation** (5 pts)

**Total: 290 story points**

### Each Story Includes
- ✅ Full title and description
- ✅ Detailed task list
- ✅ Success criteria
- ✅ Priority level (Highest/High/Medium/Low)
- ✅ Story point estimate
- ✅ Labels for filtering and automation

---

## After Creation

### View Your Stories
```bash
# In Linear, filter by label
Label: native-migration
```

Or visit:
```
https://linear.app/[your-workspace]/issues?filter=label:native-migration
```

### Set Up Dependencies (Optional)

Some stories depend on others. Recommended dependencies:

- **Authentication** blocks → **Profile, Restaurants, Content Creation**
- **Restaurant Management** blocks → **Content Creation**
- **Social Platform Accounts** blocks → **Publishing**
- **Content Creation** blocks → **Scheduler, Analytics**
- **Foundation** blocks → **Everything**

### Assign to Team Members

Distribute stories across your team by phase:
- **Phase 1 (Weeks 1-2)**: Foundation, Auth, Design System
- **Phase 2 (Weeks 3-5)**: Restaurants, Platforms, Media
- **Phase 3 (Weeks 6-9)**: Content Creation, Publishing
- **Phase 4 (Weeks 10-12)**: Scheduler, Analytics
- **Phase 5 (Weeks 13-14)**: Enhancements
- **Phase 6 (Weeks 15-16)**: Polish & Launch

### Use with Ralph Loop

All stories are labeled `ralph-task` for autonomous development:

```bash
# Sync Linear stories to Ralph
./scripts/sync-linear.sh

# Start overnight development
./scripts/ralph-overnight.sh
```

Ralph will pick up stories and work on them autonomously.

---

## Troubleshooting

### "Missing required environment variables"
```bash
# Check if variables are set
echo $LINEAR_API_KEY
echo $LINEAR_TEAM_ID

# If empty, source .env
source .env

# Or export directly
export LINEAR_API_KEY="..."
export LINEAR_TEAM_ID="..."
```

### "Unauthorized" Error
- Verify API key is correct (starts with `lin_api_`)
- Check key has write permissions
- Try creating a new API key

### Rate Limiting
- Script includes 200ms delay between requests
- If still rate limited, wait a few minutes and retry

### Duplicate Stories
- Script doesn't check for duplicates
- Delete duplicates manually in Linear
- Or filter by creation date

---

## Example Output

```
🚀 Starting Linear story creation for Native App Migration...

📋 Checking labels...
   ✓ Found label: native-migration
   ✓ Found label: ralph-task

📝 Creating stories...

✅ [1/27] Created: SCI-123 - Foundation & Infrastructure Setup
   Priority: Highest | Estimate: 8 points
   URL: https://linear.app/socialchef/issue/SCI-123

✅ [2/27] Created: SCI-124 - Authentication & Onboarding
   Priority: Highest | Estimate: 13 points
   URL: https://linear.app/socialchef/issue/SCI-124

... (25 more stories)

================================================================================
✨ Story creation complete!

📊 Summary:
   Total stories: 27
   Successfully created: 27
   Failed: 0
   Total story points: 290
================================================================================
```

---

## Next Steps

1. **Review Stories**: Check descriptions and tasks in Linear
2. **Set Dependencies**: Link dependent stories
3. **Create Projects**: Group by implementation phase
4. **Assign Owners**: Distribute across team
5. **Sprint Planning**: Move Phase 1 stories to first sprint
6. **Start Development**: Begin with Foundation story

---

## Additional Resources

- **Detailed Guide**: See `LINEAR_MIGRATION_STORIES.md`
- **Implementation Plan**: Full plan document in this repo
- **Linear API Docs**: https://developers.linear.app/
- **Ralph Loop Setup**: See `RALPH_SETUP.md`

---

**Ready? Let's create your stories!**

```bash
./scripts/setup-linear.sh
```

🚀 From zero to 27 stories in under 5 minutes!
