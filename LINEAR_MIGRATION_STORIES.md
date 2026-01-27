# Linear Stories for Native App Migration

This document explains how to create comprehensive Linear stories for migrating the SocialChef web app to a native iOS/Android application using NativeScript Vue 3.

## Overview

The migration plan includes:
- **27 comprehensive stories** covering all aspects of the native app
- **~290 total story points** estimated
- **16-20 week timeline** with 2-3 developers
- **6 implementation phases** from foundation to launch

## Prerequisites

Before running the script, you need:

1. **Linear API Key**: Get from Linear Settings → API → Personal API Keys
2. **Linear Team ID**: Your team's unique identifier

### Finding Your Linear Team ID

```bash
# First, set your API key
export LINEAR_API_KEY="lin_api_your_key_here"

# Then query for your teams
curl -X POST https://api.linear.app/graphql \
  -H "Authorization: ${LINEAR_API_KEY}" \
  -H "Content-Type: application/json" \
  -d '{"query":"{ teams { nodes { id name } } }"}' | jq

# Copy the team ID from the response
```

## Setup

### Option 1: Add to .env file (Recommended)

```bash
# Add these lines to your .env file
echo "LINEAR_API_KEY=lin_api_your_key_here" >> .env
echo "LINEAR_TEAM_ID=your-team-id-here" >> .env
```

### Option 2: Export as environment variables

```bash
export LINEAR_API_KEY="lin_api_your_key_here"
export LINEAR_TEAM_ID="your-team-id-here"
```

## Running the Script

```bash
# If using .env file, load it first
source .env

# Run the script
node scripts/create-linear-stories.js
```

The script will:
1. ✅ Check/create necessary labels (`native-migration`, `ralph-task`)
2. ✅ Create all 27 stories with full descriptions
3. ✅ Set priorities (Highest, High, Medium, Low)
4. ✅ Add story point estimates
5. ✅ Apply appropriate labels
6. ✅ Provide URLs to view each created story

## Expected Output

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

## Story Breakdown

### Phase 1: Foundation (Weeks 1-2) - 34 points
- Story 1: Foundation & Infrastructure Setup (8 pts)
- Story 2: Authentication & Onboarding (13 pts)
- Story 24: Design System Migration (13 pts)

### Phase 2: Core Features (Weeks 3-5) - 44 points
- Story 3: User Profile & Settings (5 pts)
- Story 5: Restaurant Management (13 pts)
- Story 6: Social Platform Accounts (13 pts)
- Story 18: Image & Media Management (8 pts)
- Story 4: Subscription & Billing (8 pts) [from Phase 5]

### Phase 3: Content Creation (Weeks 6-9) - 68 points
- Story 7: Content Creation - Easy Mode (21 pts)
- Story 8: Content Creation - Advanced Mode (21 pts)
- Story 9: Carousel Posts (8 pts)
- Story 19: Platform Publishing (13 pts)

### Phase 4: Management (Weeks 10-12) - 50 points
- Story 10: Posts Hub (8 pts)
- Story 11: Favorites System (5 pts)
- Story 12: Scheduler & Calendar (21 pts)
- Story 14: Analytics & Engagement (13 pts)

### Phase 5: Enhanced Features (Weeks 13-14) - 31 points
- Story 13: Weekly Menu Generator (8 pts)
- Story 15: Notifications (8 pts)
- Story 16: Real-time Features (5 pts)
- Story 25: Holiday Features (5 pts)
- Story 17: Referral Program (5 pts)

### Phase 6: Polish & Launch (Weeks 15-16) - 50 points
- Story 20: Offline Support (8 pts)
- Story 21: Performance Optimization (8 pts)
- Story 22: Testing & QA (13 pts)
- Story 26: Accessibility (8 pts)
- Story 23: App Store Deployment (8 pts)
- Story 27: Documentation (5 pts)

## After Creation

Once stories are created in Linear:

1. **Review Stories**: Check each story in Linear for accuracy
2. **Set Dependencies**: Add blockedBy/blocks relationships between stories
3. **Assign Owners**: Assign stories to team members
4. **Create Projects**: Group stories into Linear projects by phase
5. **Set Milestones**: Create milestones for each phase completion
6. **Start Sprint Planning**: Move Phase 1 stories into your first sprint

## Integration with Ralph Loop

These stories are labeled with `ralph-task`, making them compatible with the Ralph Loop autonomous agent:

```bash
# Sync Linear stories to Ralph
./scripts/sync-linear.sh

# Start Ralph overnight run
./scripts/ralph-overnight.sh
```

Ralph will automatically pick up stories from Linear and work on them overnight.

## Customization

To modify the stories before creation, edit:
- `scripts/create-linear-stories.js` - The `stories` array contains all story data
- Adjust priorities, estimates, descriptions, or tasks as needed
- Re-run the script (it won't create duplicates if you've already created stories)

## Troubleshooting

### "Missing required environment variables"
- Ensure `LINEAR_API_KEY` and `LINEAR_TEAM_ID` are set
- Check spelling and format
- Try exporting them directly: `export LINEAR_API_KEY=...`

### "Unauthorized" or 403 errors
- Verify your API key is correct
- Check that the key has write permissions
- Create a new API key if needed

### Rate limiting
- The script waits 200ms between requests to avoid rate limits
- If you still hit limits, increase the delay in the script

### Stories created but with errors
- Some stories may fail if descriptions are too long
- Review failed stories and create them manually
- Or edit the script to shorten descriptions

## Additional Resources

- [Linear API Documentation](https://developers.linear.app/docs/graphql/working-with-the-graphql-api)
- [NativeScript Vue 3 Docs](https://nativescript-vue.org/)
- [Ralph Loop Documentation](https://github.com/snarktank/ralph)
- [SocialChef Web App](https://github.com/yourusername/socialchef)

## Support

If you encounter issues:
1. Check the Linear API status
2. Verify your API key permissions
3. Review the script output for specific error messages
4. Open an issue in the repository

---

**Ready to create your stories?**

```bash
source .env
node scripts/create-linear-stories.js
```

Let's build the native app! 🚀📱
