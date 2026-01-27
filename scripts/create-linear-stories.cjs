#!/usr/bin/env node
/**
 * Create Linear Stories for Native App Migration
 *
 * This script creates an epic and 27 comprehensive stories for migrating
 * the SocialChef web app to a native iOS/Android app using NativeScript Vue 3.
 *
 * Prerequisites:
 * - LINEAR_API_KEY environment variable set
 * - LINEAR_TEAM_ID environment variable set
 *
 * Usage:
 *   node scripts/create-linear-stories.js
 */

const https = require('https');

// Configuration from environment variables
const LINEAR_API_KEY = process.env.LINEAR_API_KEY;
const LINEAR_TEAM_ID = process.env.LINEAR_TEAM_ID;

if (!LINEAR_API_KEY || !LINEAR_TEAM_ID) {
  console.error('❌ Missing required environment variables:');
  console.error('   LINEAR_API_KEY and LINEAR_TEAM_ID must be set');
  console.error('\nSet them in your .env file or export them:');
  console.error('   export LINEAR_API_KEY=lin_api_...');
  console.error('   export LINEAR_TEAM_ID=...');
  process.exit(1);
}

// Helper function to make GraphQL requests to Linear API
async function linearRequest(query, variables = {}) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({ query, variables });

    const options = {
      hostname: 'api.linear.app',
      port: 443,
      path: '/graphql',
      method: 'POST',
      headers: {
        'Authorization': LINEAR_API_KEY,
        'Content-Type': 'application/json',
        'Content-Length': data.length
      }
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          const response = JSON.parse(body);
          if (response.errors) {
            reject(new Error(JSON.stringify(response.errors, null, 2)));
          } else {
            resolve(response.data);
          }
        } catch (error) {
          reject(error);
        }
      });
    });

    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

// Priority mapping
const PRIORITY_MAP = {
  'Highest': 1,
  'High': 2,
  'Medium': 3,
  'Low': 4
};

// Stories data structure
const stories = [
  {
    title: 'Foundation & Infrastructure Setup',
    description: `Set up native app infrastructure and core architecture

**Tasks:**
- Configure NativeScript environment for both iOS and Android
- Set up API client with authentication (token management, refresh logic)
- Implement persistent storage abstraction (replace localStorage)
- Configure environment variables and build configurations
- Set up error tracking (Sentry) and analytics (PostHog)
- Create base navigation structure
- Set up i18n with English and Norwegian translations

**Success Criteria:**
- App builds successfully for both iOS and Android
- API client can authenticate and refresh tokens automatically
- Persistent storage works across app restarts
- Navigation between pages works smoothly
- Analytics and error tracking are operational`,
    priority: 'Highest',
    estimate: 8,
    labels: ['native-migration', 'ralph-task', 'foundation']
  },
  {
    title: 'Authentication & Onboarding',
    description: `Implement complete authentication flow with all OAuth providers

**Tasks:**
- Email/password login and signup
- Magic link authentication
- Apple Sign-In integration (iOS)
- Google Sign-In integration
- Facebook Login integration
- Token storage and auto-refresh mechanism
- Session persistence across app restarts
- Onboarding flow for new users
- Profile loading and caching
- Logout functionality
- Password reset flow
- OTP verification

**Success Criteria:**
- Users can log in with all 4 methods (email, Apple, Google, Facebook)
- Tokens refresh automatically before expiration
- Users stay logged in after app restart
- Magic link opens app and authenticates user
- Onboarding screens show for new users
- Password reset works end-to-end`,
    priority: 'Highest',
    estimate: 13,
    labels: ['native-migration', 'ralph-task', 'authentication']
  },
  {
    title: 'User Profile & Settings',
    description: `Build user profile management and app settings

**Tasks:**
- Profile view with user info
- Subscription tier display
- Credit usage display (monthly/yearly/lifetime)
- Email management
- Account deletion flow
- App settings (language, font size, notifications)
- Timezone selection
- Theme preferences (if supporting)
- Notification preferences UI

**Success Criteria:**
- Profile displays accurate user data
- Subscription and credit info updates in real-time
- Language switching works throughout app
- Font size scaling applies globally
- Account deletion requires confirmation and works correctly`,
    priority: 'High',
    estimate: 5,
    labels: ['native-migration', 'ralph-task', 'profile']
  },
  {
    title: 'Subscription & Billing',
    description: `Implement subscription management with Stripe

**Tasks:**
- Display subscription plans (Monthly, Yearly, Lifetime)
- Show plan comparison with features
- Stripe checkout integration (mobile web view)
- In-app purchase integration (iOS App Store, Google Play)
- Customer portal access
- Subscription status sync
- Credit allocation by tier
- Paywall modal for non-subscribers
- Trial period handling
- Subscription cancellation UI

**Success Criteria:**
- Users can view all available plans
- Checkout flow works on both iOS and Android
- Subscriptions sync correctly from Stripe
- Credits are allocated based on subscription tier
- Paywall appears when appropriate
- Users can manage subscription via customer portal`,
    priority: 'High',
    estimate: 8,
    labels: ['native-migration', 'ralph-task', 'billing']
  },
  {
    title: 'Restaurant Management',
    description: `Implement restaurant CRUD and brand DNA management

**Tasks:**
- Restaurant list view
- Restaurant search/autocomplete (Google Places)
- Add restaurant flow (manual and from Places API)
- Restaurant detail view
- Edit restaurant information
- Delete restaurant with confirmation
- Brand DNA editor (logo, colors, description)
- Logo upload with image picker
- Restaurant selector (multi-restaurant support)
- Menu management (items with images)
- Image upload and management
- Image folders/categories
- Restaurant filtering in content views

**Success Criteria:**
- Users can search and add restaurants from Google Places
- Manual restaurant creation works
- Logo upload and brand DNA save correctly
- Restaurant switching updates all dependent views
- Menu items display with images
- Image management (upload, organize, delete) works
- Restaurant filter applies across app`,
    priority: 'High',
    estimate: 13,
    labels: ['native-migration', 'ralph-task', 'restaurant']
  },
  {
    title: 'Social Platform Account Management',
    description: `Connect and manage social media platform accounts

**Tasks:**
- Platform connection hub view
- Facebook OAuth flow and page selection
- Instagram OAuth flow and account selection
- TikTok OAuth flow
- Twitter/X OAuth flow
- LinkedIn OAuth flow
- Display connected accounts by platform
- Disconnect individual accounts
- Disconnect all accounts per platform
- Account status indicators
- Platform logo components
- OAuth callback handling for all platforms

**Success Criteria:**
- OAuth flows work for all 5 platforms (Facebook, Instagram, TikTok, Twitter, LinkedIn)
- Connected accounts display correctly
- Users can disconnect accounts individually or by platform
- Account status shows real-time connection state
- OAuth callbacks open app and complete authentication`,
    priority: 'Highest',
    estimate: 13,
    labels: ['native-migration', 'ralph-task', 'social-auth']
  },
  {
    title: 'Content Creation - Easy Mode',
    description: `Build Easy Mode content creation with AI generation

**Tasks:**
- Easy Mode UI (simplified workflow)
- Restaurant selection
- Menu item selection (from restaurant menu)
- Image vs Video toggle
- AI image generation (Gemini integration)
- AI video generation (VEO integration)
- Video operation polling with progress indicator
- Auto-generated captions and hashtags
- Platform selection (multi-select)
- Account selection per platform
- Post type selection (feed, reel, story, carousel per platform)
- Media preview before posting
- Immediate publish functionality
- Schedule for later option
- Loading states and progress indicators
- Error handling with retry

**Success Criteria:**
- Users can create posts in under 60 seconds
- Image generation completes in <30 seconds
- Video generation shows progress and completes
- Captions and hashtags are relevant and well-formatted
- Media preview shows generated content accurately
- Publishing succeeds for all selected platforms
- Scheduling works correctly
- Errors are handled gracefully with retry options`,
    priority: 'Highest',
    estimate: 21,
    labels: ['native-migration', 'ralph-task', 'content-creation']
  },
  {
    title: 'Content Creation - Advanced Mode',
    description: `Build Advanced Mode with full customization options

**Tasks:**
- Advanced Mode UI
- Style variation generation (4 options)
- Visual style selector (8 styles: behind scenes, clean strict, zoom in, etc.)
- Custom prompt input
- Reference image upload
- Logo watermark customization (position, opacity, scale)
- Promotional sticker addition (text, position, style, color)
- Holiday theme integration
- Strictness mode selection
- Image generation with overlays
- Video customization (model, duration, aspect ratio, resolution)
- Audio generation toggle for videos
- Watermark on videos
- Multiple media preview
- Advanced platform-specific settings

**Success Criteria:**
- Style variations generate 4 distinct options
- Custom prompts influence generation correctly
- Reference images affect output appropriately
- Watermark and stickers apply correctly
- Video customization options work as expected
- Advanced settings affect final output
- All customizations preview before generation`,
    priority: 'High',
    estimate: 21,
    labels: ['native-migration', 'ralph-task', 'content-creation']
  },
  {
    title: 'Carousel/Multi-Image Posts',
    description: `Support carousel posts with 2-10 images

**Tasks:**
- Carousel creation UI
- Image upload per slide (2-10 images)
- Image order management (drag to reorder)
- Media library picker for existing images
- Carousel caption and hashtags
- Preview carousel slides
- Platform compatibility check (Instagram, Facebook support)
- Publish carousel to supported platforms

**Success Criteria:**
- Users can create carousels with 2-10 images
- Image order can be changed
- Carousel preview shows all slides
- Carousels publish successfully to Instagram and Facebook
- Unsupported platforms show appropriate message`,
    priority: 'Medium',
    estimate: 8,
    labels: ['native-migration', 'ralph-task', 'content-creation']
  },
  {
    title: 'Posts Hub / Content Library',
    description: `Display and manage all created posts

**Tasks:**
- Posts list view with infinite scroll/pagination
- Post cards with thumbnails
- Filter by restaurant
- Filter by content type (image/video)
- Sort options (newest/oldest)
- Post detail modal
- View post metadata
- Delete post with confirmation
- Search posts by text
- Empty state for no posts
- Loading states
- Pull-to-refresh

**Success Criteria:**
- All posts load and display correctly
- Filters work in real-time
- Sorting updates view immediately
- Post details show full information
- Delete removes post from list
- Pull-to-refresh updates content
- Performance is smooth with 100+ posts`,
    priority: 'High',
    estimate: 8,
    labels: ['native-migration', 'ralph-task', 'content-library']
  },
  {
    title: 'Favorites System',
    description: `Save and manage favorite posts as templates

**Tasks:**
- Save post as favorite
- Favorites list view
- Favorite detail view
- Edit favorite post
- Delete favorite
- Use favorite as template for scheduling
- Favorite count display

**Success Criteria:**
- Posts can be saved as favorites
- Favorites list shows all saved posts
- Favorites can be edited
- Deleting favorite works with confirmation
- Favorites can be used as templates for new posts`,
    priority: 'Medium',
    estimate: 5,
    labels: ['native-migration', 'ralph-task', 'favorites']
  },
  {
    title: 'Scheduler & Calendar',
    description: `Build scheduling calendar with multi-platform support

**Tasks:**
- Calendar UI (month/week/day views)
- Date navigation (previous/next)
- Schedule post creation flow
- Date and time picker
- Timezone selection
- Platform selection for scheduled post
- Platform-specific post type selection
- Caption and hashtag editing
- Media preview in calendar
- Scheduled post list view
- Edit scheduled post
- Cancel scheduled post with confirmation
- Retry failed posts
- Platform-specific color coding
- Holiday display in calendar
- Holiday emoji indicators
- Filter by platform
- Filter by restaurant
- Immediate publish from scheduled post

**Success Criteria:**
- Calendar displays all scheduled posts correctly
- Month/week/day views all work
- Scheduling a post saves with correct date/time
- Timezone conversion works accurately
- Multiple platforms can be selected per post
- Editing scheduled posts updates correctly
- Canceling removes from calendar
- Failed posts can be retried
- Holidays display with appropriate emojis
- Filters update calendar view in real-time`,
    priority: 'Highest',
    estimate: 21,
    labels: ['native-migration', 'ralph-task', 'scheduler']
  },
  {
    title: 'Weekly Menu Post Generator',
    description: `Generate weekly menu graphics

**Tasks:**
- Weekly menu UI (5-day or 7-day)
- Layout selection (4 options: vertical stack, grid with header, calendar grid, filmstrip)
- Date display options
- Price display toggle
- Theme customization
- Start/end date selection
- Menu item selection per day
- Preview before generation
- Generate and download/share

**Success Criteria:**
- Both 5-day and 7-day layouts work
- All 4 layout options render correctly
- Theme customization applies
- Preview shows accurate representation
- Generated menu can be saved and shared
- Dates display correctly for selected range`,
    priority: 'Medium',
    estimate: 8,
    labels: ['native-migration', 'ralph-task', 'menu-generator']
  },
  {
    title: 'Analytics & Engagement',
    description: `Display post analytics and engagement metrics

**Tasks:**
- Analytics dashboard
- Engagement metrics (likes, comments, shares, reach, impressions)
- Refresh engagement from platforms
- Bulk engagement fetch
- Time-series engagement charts (line chart)
- Platform breakdown (doughnut chart)
- Post performance chart (bar chart)
- Date range selection
- Platform filter
- Restaurant filter
- Export analytics data
- Engagement sync status indicators
- Real-time updates via SSE

**Success Criteria:**
- Dashboard displays accurate engagement data
- Charts render correctly with real data
- Refresh fetches latest metrics from platforms
- Date range filter updates charts
- Platform and restaurant filters work
- Engagement syncs automatically
- SSE updates reflect in real-time`,
    priority: 'High',
    estimate: 13,
    labels: ['native-migration', 'ralph-task', 'analytics']
  },
  {
    title: 'Notifications & Preferences',
    description: `Implement notification system and user preferences

**Tasks:**
- In-app notification center
- Notification preferences UI
- Email notification toggles
- Digest frequency selection
- Push notification integration (iOS/Android)
- Notification badge counts
- Mark notifications as read
- Clear all notifications
- Test notification functionality
- SSE connection for real-time notifications
- Notification types (post published, failed, scheduled, etc.)

**Success Criteria:**
- Notifications display in notification center
- Preferences save and apply correctly
- Push notifications work on both platforms
- Badge counts update accurately
- SSE connection maintains and receives events
- Test notifications trigger successfully`,
    priority: 'Medium',
    estimate: 8,
    labels: ['native-migration', 'ralph-task', 'notifications']
  },
  {
    title: 'Real-time Features (SSE)',
    description: `Implement Server-Sent Events for real-time updates

**Tasks:**
- SSE client implementation
- Connection management with reconnection logic
- Event handling (connected, publish-success, publish-error, engagement-update, heartbeat)
- Exponential backoff for reconnection
- Update UI on events
- Connection status indicator

**Success Criteria:**
- SSE connection establishes on app launch
- Events trigger UI updates immediately
- Reconnection works after network loss
- Connection status shows in UI
- All event types handled correctly`,
    priority: 'Medium',
    estimate: 5,
    labels: ['native-migration', 'ralph-task', 'real-time']
  },
  {
    title: 'Referral Program',
    description: `Build referral system

**Tasks:**
- Referral code display
- Generate referral code
- Share referral code (native share)
- Referral stats display
- Apply referral code
- Referral landing page
- Pending referral detection

**Success Criteria:**
- Users can generate and share referral codes
- Stats show referrals and rewards
- Referral codes can be applied during signup
- Native share dialog works on both platforms`,
    priority: 'Low',
    estimate: 5,
    labels: ['native-migration', 'ralph-task', 'referral']
  },
  {
    title: 'Image & Media Management',
    description: `Handle image uploads, storage, and display

**Tasks:**
- Native image picker integration
- Image upload to backend
- Image compression before upload
- Video upload support
- Image preview
- Media library (local caching)
- Image URL handling
- Supabase storage integration
- Progress indicators for uploads
- Error handling and retry

**Success Criteria:**
- Users can pick images from device
- Images upload successfully
- Upload progress shows accurately
- Compressed images maintain quality
- Videos upload for video posts
- Media library caches images locally
- Failed uploads can be retried`,
    priority: 'Medium',
    estimate: 8,
    labels: ['native-migration', 'ralph-task', 'media']
  },
  {
    title: 'Platform-Specific Publishing',
    description: `Implement publishing logic for all 5 platforms

**Tasks:**
- Facebook publishing (feed, story, reel, carousel)
- Instagram publishing (feed, story, reel, carousel)
- TikTok video publishing
- Twitter text + media publishing
- LinkedIn post publishing
- Platform-specific post format validation
- Media format conversion if needed
- Post URL retrieval after publishing
- Error handling per platform
- Retry logic with exponential backoff
- Platform result tracking

**Success Criteria:**
- All post types work for Facebook (4 types)
- All post types work for Instagram (4 types)
- TikTok video posts work
- Twitter posts with media work
- LinkedIn posts with media work
- Platform-specific errors are descriptive
- Failed posts can be retried
- Post URLs are saved for later reference`,
    priority: 'Highest',
    estimate: 13,
    labels: ['native-migration', 'ralph-task', 'publishing']
  },
  {
    title: 'Offline Support & Data Sync',
    description: `Handle offline scenarios and data synchronization

**Tasks:**
- Detect network connectivity
- Queue operations when offline
- Sync when connection restored
- Cache API responses
- Offline indicator in UI
- Retry failed requests
- Conflict resolution
- Local database for offline data

**Success Criteria:**
- App detects offline state
- Operations queue when offline
- Queued operations execute when online
- API responses cache for offline access
- Offline indicator visible to user
- No data loss during offline periods`,
    priority: 'Medium',
    estimate: 8,
    labels: ['native-migration', 'ralph-task', 'offline']
  },
  {
    title: 'Performance Optimization',
    description: `Optimize app performance for smooth UX

**Tasks:**
- Image lazy loading
- List virtualization (CollectionView)
- Optimize bundle size
- Reduce API calls (caching)
- Debounce search inputs
- Throttle scroll events
- Optimize animations
- Memory leak prevention
- Startup time optimization
- Background task management

**Success Criteria:**
- App launches in <3 seconds
- List scrolling is smooth with 1000+ items
- No memory leaks after extended use
- Animations run at 60fps
- Network requests minimized via caching
- Battery drain is minimal`,
    priority: 'Medium',
    estimate: 8,
    labels: ['native-migration', 'ralph-task', 'performance']
  },
  {
    title: 'Testing & QA',
    description: `Implement testing strategy and QA process

**Tasks:**
- Unit tests for services and stores
- Integration tests for API client
- E2E tests for critical flows
- Visual regression testing
- Device testing (iOS: iPhone 12+, iPad; Android: various screen sizes)
- Test authentication flows
- Test payment flows
- Test publishing to all platforms
- Performance testing
- Accessibility testing
- Beta testing program setup

**Success Criteria:**
- 80%+ code coverage
- All critical flows have E2E tests
- Tests run in CI/CD
- App tested on 10+ devices
- No crashes in beta testing
- Accessibility score >90%`,
    priority: 'Medium',
    estimate: 13,
    labels: ['native-migration', 'ralph-task', 'testing']
  },
  {
    title: 'App Store Deployment',
    description: `Prepare and deploy to iOS App Store and Google Play

**Tasks:**
- App Store assets (screenshots, icons, descriptions)
- iOS App Store listing
- Google Play listing
- App Store Optimization (ASO)
- Privacy policy and terms integration
- App review preparation
- TestFlight setup for iOS
- Google Play internal testing
- Production release
- App versioning strategy
- Release notes automation

**Success Criteria:**
- App listed on both stores
- All metadata complete
- Screenshots showcase features
- Privacy policy linked
- Apps pass review on first submission
- Beta versions available via TestFlight and Play Internal Testing`,
    priority: 'High',
    estimate: 8,
    labels: ['native-migration', 'ralph-task', 'deployment']
  },
  {
    title: 'Migration of Design System',
    description: `Adapt web design system to native

**Tasks:**
- Create native theme with CSS variables equivalent
- Implement color palette (warm cream #f6f1e7, forest green #0f3d2e)
- Glassmorphism effects (backdrop blur alternatives)
- Typography system (Playfair Display + Inter)
- Icon components (Material Icons + custom golden icons)
- Base button component (4 variants)
- Base card component
- Base input component
- Base modal component
- Base alert component
- Animation system
- Status colors (published, scheduled, failed)
- Platform logo components

**Success Criteria:**
- All base components match web design
- Color palette consistent with web
- Typography renders correctly on all devices
- Glassmorphism effects look native
- Animations smooth on both platforms
- "Quiet luxury" aesthetic maintained`,
    priority: 'High',
    estimate: 13,
    labels: ['native-migration', 'ralph-task', 'design-system']
  },
  {
    title: 'Holiday Features',
    description: `Integrate holiday calendar and themed content

**Tasks:**
- Fetch holidays API integration
- Holiday calendar display
- Holiday emoji icons
- Holiday-themed content generation
- Country selection for holidays
- Holiday reminders/notifications

**Success Criteria:**
- Holidays display in calendar
- Emoji indicators show for holidays
- Holiday themes affect content generation
- Supports multiple countries`,
    priority: 'Low',
    estimate: 5,
    labels: ['native-migration', 'ralph-task', 'holidays']
  },
  {
    title: 'Accessibility',
    description: `Ensure app is accessible to all users

**Tasks:**
- Screen reader support (VoiceOver/TalkBack)
- Semantic labels for all interactive elements
- Focus management
- Color contrast compliance
- Font scaling support
- Reduced motion support
- Keyboard navigation (tablets)
- Haptic feedback
- Accessibility testing

**Success Criteria:**
- App usable with screen readers
- All interactive elements have labels
- Color contrast meets WCAG AA
- Font scaling works throughout app
- Reduced motion preferences respected
- Haptic feedback enhances UX`,
    priority: 'Medium',
    estimate: 8,
    labels: ['native-migration', 'ralph-task', 'accessibility']
  },
  {
    title: 'Documentation',
    description: `Create comprehensive documentation

**Tasks:**
- Developer documentation
- Architecture overview
- API integration guide
- Component library documentation
- Deployment guide
- Troubleshooting guide
- User guide
- Video tutorials

**Success Criteria:**
- All documentation complete
- Code documented with JSDoc
- README comprehensive
- Onboarding guide for new developers
- User guide available in-app`,
    priority: 'Low',
    estimate: 5,
    labels: ['native-migration', 'ralph-task', 'documentation']
  }
];

// Main execution function
async function main() {
  console.log('🚀 Starting Linear story creation for Native App Migration...\n');

  try {
    // Step 1: Get label IDs (or create them)
    console.log('📋 Checking labels...');
    const labelsToCreate = ['native-migration', 'ralph-task'];
    const labelIds = {};

    for (const labelName of labelsToCreate) {
      try {
        // Try to find existing label
        const labelsQuery = `
          query($teamId: String!, $name: String!) {
            team(id: $teamId) {
              labels(filter: { name: { eq: $name } }) {
                nodes {
                  id
                  name
                }
              }
            }
          }
        `;

        const labelsResult = await linearRequest(labelsQuery, {
          teamId: LINEAR_TEAM_ID,
          name: labelName
        });

        if (labelsResult.team.labels.nodes.length > 0) {
          labelIds[labelName] = labelsResult.team.labels.nodes[0].id;
          console.log(`   ✓ Found label: ${labelName}`);
        } else {
          // Create label
          const createLabelMutation = `
            mutation($name: String!, $teamId: String!) {
              issueLabelCreate(input: {
                name: $name
                teamId: $teamId
              }) {
                issueLabel {
                  id
                  name
                }
              }
            }
          `;

          const createResult = await linearRequest(createLabelMutation, {
            name: labelName,
            teamId: LINEAR_TEAM_ID
          });

          labelIds[labelName] = createResult.issueLabelCreate.issueLabel.id;
          console.log(`   ✓ Created label: ${labelName}`);
        }
      } catch (error) {
        console.error(`   ✗ Error with label ${labelName}:`, error.message);
      }
    }

    console.log('');

    // Step 2: Create stories
    console.log('📝 Creating stories...\n');

    const createdStories = [];
    let storyNumber = 1;

    for (const story of stories) {
      try {
        const mutation = `
          mutation($input: IssueCreateInput!) {
            issueCreate(input: $input) {
              issue {
                id
                identifier
                title
                url
              }
            }
          }
        `;

        // Collect label IDs for this story
        const storyLabelIds = story.labels
          .map(label => labelIds[label])
          .filter(id => id !== undefined);

        const input = {
          teamId: LINEAR_TEAM_ID,
          title: story.title,
          description: story.description,
          priority: PRIORITY_MAP[story.priority],
          estimate: story.estimate,
          labelIds: storyLabelIds
        };

        const result = await linearRequest(mutation, { input });
        const createdIssue = result.issueCreate.issue;

        createdStories.push(createdIssue);

        console.log(`✅ [${storyNumber}/${stories.length}] Created: ${createdIssue.identifier} - ${story.title}`);
        console.log(`   Priority: ${story.priority} | Estimate: ${story.estimate} points`);
        console.log(`   URL: ${createdIssue.url}`);
        console.log('');

        storyNumber++;

        // Rate limiting: wait 200ms between requests
        await new Promise(resolve => setTimeout(resolve, 200));

      } catch (error) {
        console.error(`❌ Failed to create story "${story.title}":`, error.message);
        console.error('');
      }
    }

    // Summary
    console.log('\n' + '='.repeat(80));
    console.log('✨ Story creation complete!\n');
    console.log(`📊 Summary:`);
    console.log(`   Total stories: ${stories.length}`);
    console.log(`   Successfully created: ${createdStories.length}`);
    console.log(`   Failed: ${stories.length - createdStories.length}`);
    console.log(`   Total story points: ${stories.reduce((sum, s) => sum + s.estimate, 0)}`);
    console.log('='.repeat(80) + '\n');

    if (createdStories.length > 0) {
      console.log('🔗 View your stories in Linear:');
      console.log(`   https://linear.app/team/${LINEAR_TEAM_ID}/issues`);
      console.log('');
    }

    console.log('💡 Next steps:');
    console.log('   1. Review stories in Linear');
    console.log('   2. Set up story dependencies if needed');
    console.log('   3. Assign stories to team members');
    console.log('   4. Start development! 🚀');
    console.log('');

  } catch (error) {
    console.error('❌ Fatal error:', error.message);
    process.exit(1);
  }
}

// Run the script
main();
