/**
 * 30 Days of Instagram Reels Captions
 *
 * Content follows the 4-Pillar Framework:
 * - Educational/Tips (40%) → 12 posts
 * - Behind-the-Scenes (25%) → 8 posts
 * - Community (20%) → 6 posts
 * - Promotional (15%) → 4 posts
 *
 * Each caption uses Hook-Value-CTA structure with 3-tier hashtags.
 * Brand voice: Authoritative yet approachable, tech-informed but jargon-free.
 */

import type { ReelCaption, CaptionBrandVoice } from '@/types/reels-captions'

/**
 * Default brand voice for Social Media AI captions.
 * Can be overridden per-brand via the brand's BrandDna settings.
 */
export const DEFAULT_BRAND_VOICE: CaptionBrandVoice = {
  tone: 'authoritative yet approachable',
  traits: [
    'tech-savvy',
    'solution-focused',
    'community-oriented',
    'confident but not arrogant',
    'encouraging',
  ],
  vocabularyInclude: [
    'AI-powered', 'effortless', 'streamline', 'boost', 'level up',
    'smart', 'results', 'strategy', 'growth', 'engagement',
    'content game', 'social presence', 'brand story',
  ],
  vocabularyExclude: [
    'guru', 'hack', 'disrupting', 'synergy', 'pivot',
    'crushing it', 'grind', 'hustle culture',
  ],
  emojiUsage: 'moderate',
  preferredEmojis: ['🚀', '✨', '💡', '🎯', '📈', '🔥', '👀', '💪', '🤖', '📱'],
  lengthPreference: 'medium',
}

/**
 * 30 days of Instagram Reels captions.
 * Pillar distribution: Educational (12), BTS (8), Community (6), Promotional (4)
 */
export const REELS_CAPTIONS: ReelCaption[] = [
  // ===== DAY 1 — EDUCATIONAL =====
  {
    day: 1,
    pillar: 'educational',
    hook: 'Stop posting at the wrong time ⏰',
    body: 'Most brands lose 40% of their reach by posting when their audience is asleep. The data is clear: Reels posted between 3-7 PM in your audience\'s timezone get significantly more views. Here\'s how to find YOUR optimal window.',
    cta: 'Save this for your next posting session 🔖',
    ctaType: 'save',
    hashtags: {
      broad: ['#socialmedia', '#digitalmarketing', '#instagramtips'],
      targeted: ['#socialmediamanagement', '#contentcreation', '#instagramreels', '#socialmediatips', '#marketingstrategy'],
      niche: ['#reelsstrategy', '#postingtimes', '#instagramgrowth2025', '#socialmediatools', '#contentscheduling'],
    },
    reelConcept: 'Screen recording showing analytics + clock overlay revealing best posting times',
    scheduledDayOfWeek: 'monday',
    scheduledTime: '17:00',
  },

  // ===== DAY 2 — BEHIND THE SCENES =====
  {
    day: 2,
    pillar: 'behind-the-scenes',
    hook: 'How we build AI that gets you 📱',
    body: 'Peek behind the curtain. Our team spends hours training our AI to understand YOUR brand voice — not generic templates. Every caption, every hashtag set is crafted to sound like you, not a robot.',
    cta: 'Follow along for more behind-the-scenes looks 👀',
    ctaType: 'follow',
    hashtags: {
      broad: ['#ai', '#tech', '#startup'],
      targeted: ['#aitools', '#behindthescenes', '#techstartup', '#buildingaistartup', '#productdevelopment'],
      niche: ['#aicontentcreation', '#socialmediastartup', '#bts2025', '#aimarketing', '#techinnovation'],
    },
    reelConcept: 'Quick office/desk clips showing team working on AI models, code on screens, whiteboard sessions',
    scheduledDayOfWeek: 'tuesday',
    scheduledTime: '17:00',
  },

  // ===== DAY 3 — EDUCATIONAL =====
  {
    day: 3,
    pillar: 'educational',
    hook: 'Your hashtags are probably wrong 🏷️',
    body: 'Using only big hashtags like #food or #marketing? You\'re competing with millions. The 3-tier strategy works: 2-3 broad tags for reach, 5-8 targeted tags for relevance, and 4-7 niche tags for discoverability. Mix them every post.',
    cta: 'Double tap if you\'re updating your hashtag strategy today 💡',
    ctaType: 'engagement',
    hashtags: {
      broad: ['#instagramtips', '#socialmedia', '#contentmarketing'],
      targeted: ['#hashtagstrategy', '#instagramgrowth', '#socialmediastrategy', '#contentcreator', '#marketingtips'],
      niche: ['#hashtagresearch', '#instagramalgorithm2025', '#hashtagtips', '#growyourinstagram', '#reelshashtags'],
    },
    reelConcept: 'Text overlay Reel showing 3 tiers visually — bad hashtags crossed out, good ones highlighted',
    scheduledDayOfWeek: 'wednesday',
    scheduledTime: '17:00',
  },

  // ===== DAY 4 — COMMUNITY =====
  {
    day: 4,
    pillar: 'community',
    hook: 'This brand grew 300% in 60 days 📈',
    body: 'Meet @[featured_brand] — they started using AI-powered captions two months ago. Their engagement tripled. Their secret? Consistent posting with on-brand messaging that actually resonates with their audience.',
    cta: 'Tag a brand that deserves this kind of growth ✨',
    ctaType: 'share',
    hashtags: {
      broad: ['#growthmindset', '#success', '#branding'],
      targeted: ['#brandgrowth', '#successstory', '#socialmediagrowth', '#businessgrowth', '#engagementgrowth'],
      niche: ['#clientspotlight', '#socialmediaresults', '#airesults', '#contentresults', '#brandsuccess2025'],
    },
    reelConcept: 'Before/after analytics screenshots with upbeat music, then feature brand\'s best content',
    scheduledDayOfWeek: 'thursday',
    scheduledTime: '17:00',
  },

  // ===== DAY 5 — EDUCATIONAL =====
  {
    day: 5,
    pillar: 'educational',
    hook: 'The first 3 words decide everything 🎯',
    body: 'Instagram cuts your caption at "...more." If those first 3 words don\'t stop the scroll, no one reads the rest. Use questions, bold claims, or numbers. "Did you know..." always loses to "Stop doing this."',
    cta: 'Share this with someone who needs better hooks 🔗',
    ctaType: 'share',
    hashtags: {
      broad: ['#copywriting', '#instagramtips', '#contentcreation'],
      targeted: ['#captionwriting', '#instagramcaptions', '#hookwriting', '#scrollstopper', '#contentcreator'],
      niche: ['#captionhooks', '#instagramcopywriting', '#reelscaptions', '#writingforsocial', '#hookformula'],
    },
    reelConcept: 'Split screen: boring hooks vs. scroll-stopping hooks with engagement count comparison',
    scheduledDayOfWeek: 'friday',
    scheduledTime: '12:00',
  },

  // ===== DAY 6 — BEHIND THE SCENES =====
  {
    day: 6,
    pillar: 'behind-the-scenes',
    hook: 'What 1,000 captions taught our AI 🤖',
    body: 'We analyzed over 1,000 top-performing captions across food, fashion, and tech brands. The pattern? Every viral caption follows Hook → Value → CTA. Our AI learned this so you don\'t have to study it.',
    cta: 'Comment "FORMULA" and we\'ll share the breakdown 💬',
    ctaType: 'engagement',
    hashtags: {
      broad: ['#ai', '#machinelearning', '#socialmedia'],
      targeted: ['#aicontent', '#datadriven', '#socialmediastrategy', '#contentanalysis', '#aimarketing'],
      niche: ['#captionformula', '#aitraining', '#socialmediadatascience', '#contentpatterns', '#viralformula'],
    },
    reelConcept: 'Data visualization Reel — numbers flying, charts building, then revealing the Hook-Value-CTA formula',
    scheduledDayOfWeek: 'saturday',
    scheduledTime: '10:00',
  },

  // ===== DAY 7 — PROMOTIONAL =====
  {
    day: 7,
    pillar: 'promotional',
    hook: 'Generate 30 days of content in 5 min ⚡',
    body: 'Tired of staring at a blank caption box every single day? Our AI generates an entire month of on-brand Reels captions — with hooks, CTAs, and optimized hashtags — in minutes. Your content calendar, handled.',
    cta: 'Link in bio to try it free 🔗',
    ctaType: 'link',
    hashtags: {
      broad: ['#socialmedia', '#contentcreation', '#productivity'],
      targeted: ['#socialmediatool', '#contentplanning', '#aitools', '#socialmediamanager', '#contentcalendar'],
      niche: ['#aicaptionwriter', '#reelscaptions', '#socialmediaai', '#automatedmarketing', '#contentbatching'],
    },
    reelConcept: 'Speed demo: show the app generating captions in real-time, calendar filling up instantly',
    scheduledDayOfWeek: 'sunday',
    scheduledTime: '18:00',
  },

  // ===== DAY 8 — EDUCATIONAL =====
  {
    day: 8,
    pillar: 'educational',
    hook: 'Reels vs Stories: which one wins? 🤔',
    body: 'Reels reach 2x more non-followers than Stories. But Stories build loyalty with existing fans. Smart strategy? Use Reels for discovery and Stories for connection. Post your Reel, then use Stories to drive viewers back to it.',
    cta: 'Save this breakdown for your strategy session 📌',
    ctaType: 'save',
    hashtags: {
      broad: ['#instagramtips', '#socialmedia', '#digitalmarketing'],
      targeted: ['#instagramreels', '#instagramstories', '#contentstrategy', '#instagramalgorithm', '#socialmediastrategy'],
      niche: ['#reelsvsstories', '#instagramreach', '#discoveryreels', '#instagramtips2025', '#contentformat'],
    },
    reelConcept: 'Side-by-side comparison graphic — Reels stats vs Stories stats with animated counters',
    scheduledDayOfWeek: 'monday',
    scheduledTime: '18:00',
  },

  // ===== DAY 9 — COMMUNITY =====
  {
    day: 9,
    pillar: 'community',
    hook: 'You asked, we built it 🛠️',
    body: 'Last month you told us you wanted better hashtag suggestions. So we rebuilt our entire hashtag engine from scratch. The new 3-tier system gives you broad, targeted, AND niche tags — all matched to your industry.',
    cta: 'What feature should we build next? Drop it below 👇',
    ctaType: 'engagement',
    hashtags: {
      broad: ['#community', '#feedback', '#tech'],
      targeted: ['#productupdate', '#customerfeedback', '#featurerequest', '#userdriven', '#betterproduct'],
      niche: ['#weareallistening', '#communitydriven', '#builtforyou', '#productiteration', '#socialmediatools'],
    },
    reelConcept: 'Show DM/comment screenshots asking for feature → reveal the new feature in action',
    scheduledDayOfWeek: 'tuesday',
    scheduledTime: '16:00',
  },

  // ===== DAY 10 — BEHIND THE SCENES =====
  {
    day: 10,
    pillar: 'behind-the-scenes',
    hook: 'A day in the life of our AI team 💻',
    body: 'Coffee at 8. Code review at 9. Testing caption variations against real brand data by 10. Our team doesn\'t just write algorithms — we obsess over making every generated caption feel authentically human.',
    cta: 'Follow for the next episode of our BTS series 📺',
    ctaType: 'follow',
    hashtags: {
      broad: ['#tech', '#startup', '#dayinthelife'],
      targeted: ['#startuplife', '#techteam', '#behindthescenes', '#aidev', '#buildingproducts'],
      niche: ['#aistartup', '#techbts', '#startupjourney2025', '#mlengineering', '#productbuilding'],
    },
    reelConcept: 'DITL vlog style — quick cuts of morning routine, coding, testing, team lunch, shipping code',
    scheduledDayOfWeek: 'wednesday',
    scheduledTime: '16:00',
  },

  // ===== DAY 11 — EDUCATIONAL =====
  {
    day: 11,
    pillar: 'educational',
    hook: '5 CTAs that actually work 💪',
    body: 'Forget "click the link." These CTAs drive real action:\n1. "Save this for later" (triggers algorithm)\n2. "Tag someone who needs this"\n3. "Comment your answer below"\n4. "Share to your Story"\n5. "DM us the word [X]"',
    cta: 'Which CTA do YOU use most? Tell us below ⬇️',
    ctaType: 'engagement',
    hashtags: {
      broad: ['#marketingtips', '#instagramtips', '#socialmedia'],
      targeted: ['#calltoaction', '#engagementtips', '#socialmediatips', '#contentcreator', '#growyouraudience'],
      niche: ['#ctaformula', '#instagramengagement2025', '#reelsengagement', '#captionformulas', '#instagramgrowthips'],
    },
    reelConcept: 'Text-on-screen Reel listing each CTA with quick examples of each one working',
    scheduledDayOfWeek: 'thursday',
    scheduledTime: '17:00',
  },

  // ===== DAY 12 — EDUCATIONAL =====
  {
    day: 12,
    pillar: 'educational',
    hook: 'The algorithm rewards this one thing 🏆',
    body: 'Instagram\'s algorithm in 2025 has one obsession: watch time. Every second someone spends on your Reel signals value. That\'s why hooks matter more than ever. A strong first frame = longer watch = more reach.',
    cta: 'Bookmark this reminder for your next Reel 🔖',
    ctaType: 'save',
    hashtags: {
      broad: ['#instagramtips', '#algorithm', '#socialmedia'],
      targeted: ['#instagramalgorithm', '#reelstips', '#watchtime', '#instagramreach', '#contentstrategy'],
      niche: ['#algorithm2025', '#reelsreach', '#instagramhack2025', '#watchtimetips', '#reelsalgorithm'],
    },
    reelConcept: 'Animated graph showing watch time vs. reach correlation, then hook formula reveal',
    scheduledDayOfWeek: 'friday',
    scheduledTime: '11:00',
  },

  // ===== DAY 13 — BEHIND THE SCENES =====
  {
    day: 13,
    pillar: 'behind-the-scenes',
    hook: 'We tested 50 hooks. Here\'s #1 🥇',
    body: 'Our content team A/B tested 50 different caption hooks across 10 industries. The winner? Starting with a number + a pain point. "3 mistakes killing your reach" outperformed everything. Data doesn\'t lie.',
    cta: 'Comment "HOOKS" to get our top 10 hook templates 📝',
    ctaType: 'engagement',
    hashtags: {
      broad: ['#marketing', '#contentcreation', '#socialmedia'],
      targeted: ['#abtesting', '#contentresearch', '#hookwriting', '#socialmediatips', '#datadrivenmarketing'],
      niche: ['#captionhooks', '#contenttesting', '#hookformulas', '#socialmediadatascience', '#reelshooks'],
    },
    reelConcept: 'Reveal-style Reel — show testing process, blur results, then dramatic reveal of #1 hook',
    scheduledDayOfWeek: 'saturday',
    scheduledTime: '10:00',
  },

  // ===== DAY 14 — COMMUNITY =====
  {
    day: 14,
    pillar: 'community',
    hook: 'Your best caption wins a feature 🏅',
    body: 'We want to see YOUR best work. Drop your most fire Reel caption in the comments — the one with the best hook, the cleanest CTA. Our team picks a winner every Friday and features them on our page.',
    cta: 'Drop your best caption below. Go! ⬇️',
    ctaType: 'ugc',
    hashtags: {
      broad: ['#community', '#contentcreation', '#socialmedia'],
      targeted: ['#captionchallenge', '#communitycontest', '#ugc', '#socialmediatips', '#contentcommunity'],
      niche: ['#captioncontest', '#bestcaption', '#socialmediacommunity', '#contentchallenge2025', '#captionwriting'],
    },
    reelConcept: 'Montage of previous winning captions + hype music + "YOUR TURN" at the end',
    scheduledDayOfWeek: 'sunday',
    scheduledTime: '18:00',
  },

  // ===== DAY 15 — EDUCATIONAL =====
  {
    day: 15,
    pillar: 'educational',
    hook: 'Batch your content or burn out 🔥',
    body: 'Creating content daily is a fast track to exhaustion. The top creators batch: one session, 7-14 days of content. Set up your brand voice once, generate captions in bulk, schedule everything. Then go live your life.',
    cta: 'Share this with a creator who needs to hear it 💌',
    ctaType: 'share',
    hashtags: {
      broad: ['#productivity', '#contentcreation', '#creatorlife'],
      targeted: ['#contentbatching', '#socialmediatips', '#creatorwellbeing', '#batchcontent', '#worksmarter'],
      niche: ['#contentbatch', '#socialmediaburnout', '#creatorproductivity', '#batchcreation2025', '#contentwellbeing'],
    },
    reelConcept: 'Time lapse of batching session — setting up, generating content, scheduling, then relaxing',
    scheduledDayOfWeek: 'monday',
    scheduledTime: '17:00',
  },

  // ===== DAY 16 — BEHIND THE SCENES =====
  {
    day: 16,
    pillar: 'behind-the-scenes',
    hook: 'Our biggest mistake this year 😬',
    body: 'We launched a feature nobody asked for. Spent 3 weeks building an auto-reply bot. Usage? Near zero. Lesson: always talk to your users before building. Now every feature starts with your feedback, not our assumptions.',
    cta: 'Ever shipped something nobody wanted? Tell us your story 😅',
    ctaType: 'engagement',
    hashtags: {
      broad: ['#startup', '#lessons', '#entrepreneurship'],
      targeted: ['#startuplessons', '#failforward', '#productmanagement', '#startuplife', '#buildingpublic'],
      niche: ['#startupfails', '#lessonlearned2025', '#productfail', '#buildinpublic', '#transparentstartup'],
    },
    reelConcept: 'Storytime Reel — talking head with text overlays, dramatic music for the fail, upbeat for the lesson',
    scheduledDayOfWeek: 'tuesday',
    scheduledTime: '17:00',
  },

  // ===== DAY 17 — EDUCATIONAL =====
  {
    day: 17,
    pillar: 'educational',
    hook: 'Your brand voice is your superpower 🦸',
    body: 'Every brand that blows up on Reels has one thing in common: a distinctive voice. Not the same motivational quotes as everyone else. Your quirks, your perspective, your way of saying things — THAT\'S what makes people follow.',
    cta: 'Save this and define your brand voice today 💡',
    ctaType: 'save',
    hashtags: {
      broad: ['#branding', '#marketing', '#socialmedia'],
      targeted: ['#brandvoice', '#brandidentity', '#brandstrategy', '#authenticbranding', '#brandpersonality'],
      niche: ['#brandvoiceguide', '#brandingtips2025', '#authenticsocialmedia', '#socialmediabranding', '#voicematters'],
    },
    reelConcept: 'Examples of brand voice: show same product described in 3 different voices — generic vs. unique',
    scheduledDayOfWeek: 'wednesday',
    scheduledTime: '17:00',
  },

  // ===== DAY 18 — PROMOTIONAL =====
  {
    day: 18,
    pillar: 'promotional',
    hook: 'New: AI captions that sound like YOU ✨',
    body: 'We just shipped the biggest update to our caption engine. It now learns your brand\'s tone, preferred phrases, and even your emoji style. The result? Captions that are indistinguishable from ones you\'d write yourself.',
    cta: 'Try it today — link in bio 🚀',
    ctaType: 'link',
    hashtags: {
      broad: ['#ai', '#socialmedia', '#technology'],
      targeted: ['#productlaunch', '#aiupdate', '#socialmediatool', '#captionwriter', '#newfeature'],
      niche: ['#aicaptions', '#branddvoiceai', '#socialmediaatools', '#captiongeneration', '#aicontentwriter'],
    },
    reelConcept: 'Product demo — type in brand name, watch AI generate caption, show it matching brand voice perfectly',
    scheduledDayOfWeek: 'thursday',
    scheduledTime: '16:00',
  },

  // ===== DAY 19 — COMMUNITY =====
  {
    day: 19,
    pillar: 'community',
    hook: 'From 200 to 20K followers in 90 days 🚀',
    body: 'This creator was stuck at 200 followers for months. Then they nailed three things: consistent posting schedule, strong hooks on every Reel, and hashtags that actually matched their niche. Here\'s exactly what changed.',
    cta: 'Tag a creator who\'s about to blow up 🌟',
    ctaType: 'share',
    hashtags: {
      broad: ['#growthmindset', '#success', '#motivation'],
      targeted: ['#creatorgrowth', '#instagramgrowth', '#followergrowth', '#successstory', '#socialmediasuccess'],
      niche: ['#200to20k', '#growthstory', '#instagramgrowth2025', '#creatorspotlight', '#organicgrowth'],
    },
    reelConcept: 'Screenshot journey — follower count at different dates with music building, reveal final number',
    scheduledDayOfWeek: 'friday',
    scheduledTime: '12:00',
  },

  // ===== DAY 20 — EDUCATIONAL =====
  {
    day: 20,
    pillar: 'educational',
    hook: 'Post less, grow more. Here\'s why 📉➡️📈',
    body: 'Posting 3x daily dilutes your reach. The algorithm tests each post with a small audience first. Too many posts = each gets less initial distribution. Quality over quantity: 4-5 Reels per week, each one polished.',
    cta: 'Comment "QUALITY" if you\'re choosing quality over quantity 💎',
    ctaType: 'engagement',
    hashtags: {
      broad: ['#instagramtips', '#socialmedia', '#contentcreation'],
      targeted: ['#qualityoverquantity', '#postingfrequency', '#socialmediastrategy', '#instagramalgorithm', '#contenttips'],
      niche: ['#postingschedule2025', '#qualitycontent', '#reelsfrequency', '#smartposting', '#lessismore'],
    },
    reelConcept: 'Graph animation showing diminishing returns on posts per day, then optimal frequency highlight',
    scheduledDayOfWeek: 'saturday',
    scheduledTime: '10:00',
  },

  // ===== DAY 21 — BEHIND THE SCENES =====
  {
    day: 21,
    pillar: 'behind-the-scenes',
    hook: 'How we write 100 captions in an hour ⌨️',
    body: 'Our content team has a system: 15 min for brand voice setup, 15 min for pillar selection, 30 min for AI generation + human editing. The secret isn\'t speed — it\'s having a framework that removes decision fatigue.',
    cta: 'Follow for more productivity frameworks 🧠',
    ctaType: 'follow',
    hashtags: {
      broad: ['#productivity', '#contentcreation', '#ai'],
      targeted: ['#contentworkflow', '#writingprocess', '#aiwriting', '#contentprocess', '#productivitytips'],
      niche: ['#captionworkflow', '#aicaptions', '#contentframework', '#writingproductivity', '#bulkcontent'],
    },
    reelConcept: 'Timer overlay showing the hour breakdown — real speed footage of the process',
    scheduledDayOfWeek: 'sunday',
    scheduledTime: '18:00',
  },

  // ===== DAY 22 — EDUCATIONAL =====
  {
    day: 22,
    pillar: 'educational',
    hook: 'The 4 content pillars every brand needs 🏛️',
    body: 'Struggling with what to post? Every successful brand uses 4 pillars:\n• Educational (40%) — Teach something\n• BTS (25%) — Show your process\n• Community (20%) — Feature your people\n• Promotional (15%) — Sell\n\nRotate them. Never run out of ideas.',
    cta: 'Save this framework and plan your next month 📋',
    ctaType: 'save',
    hashtags: {
      broad: ['#contentmarketing', '#socialmedia', '#branding'],
      targeted: ['#contentpillars', '#contentstrategy', '#contentplanning', '#brandstrategy', '#socialmediastrategy'],
      niche: ['#4pillars', '#contentframeworks', '#socialmediaplanning2025', '#contentcalendar', '#pillarstrategy'],
    },
    reelConcept: 'Visual breakdown — 4 pillars appear one by one with examples for each, pie chart at the end',
    scheduledDayOfWeek: 'monday',
    scheduledTime: '18:00',
  },

  // ===== DAY 23 — BEHIND THE SCENES =====
  {
    day: 23,
    pillar: 'behind-the-scenes',
    hook: 'This is what our AI sees 👁️',
    body: 'When you give our AI your brand info, here\'s what happens under the hood: it maps your tone to a voice spectrum, identifies your audience\'s language patterns, and generates captions that match both. Think of it as a digital copywriter that studied your brand.',
    cta: 'Drop a 🤖 if you want to see more AI deep-dives',
    ctaType: 'engagement',
    hashtags: {
      broad: ['#ai', '#technology', '#behindthescenes'],
      targeted: ['#aiexplained', '#howaiworks', '#techexplained', '#aimarketing', '#machinelearning'],
      niche: ['#aiunderhood', '#nlpexplained', '#aibrandvoice', '#techbts', '#aicontentengine'],
    },
    reelConcept: 'Screen capture of AI processing — input goes in, visualize the analysis, output comes out',
    scheduledDayOfWeek: 'tuesday',
    scheduledTime: '17:00',
  },

  // ===== DAY 24 — EDUCATIONAL =====
  {
    day: 24,
    pillar: 'educational',
    hook: 'Emojis boost engagement by 48% 📊',
    body: 'Data from 500K+ Instagram posts shows it: captions with emojis get 48% more engagement. But it\'s not about spamming 🎉🎉🎉. Strategic placement matters — one in the hook, one in the CTA. That\'s the sweet spot.',
    cta: 'Double tap and drop your favorite emoji below 👇',
    ctaType: 'engagement',
    hashtags: {
      broad: ['#instagramtips', '#socialmedia', '#marketing'],
      targeted: ['#emojimarketing', '#engagementtips', '#instagramengagement', '#captionwriting', '#socialmediatips'],
      niche: ['#emojistrategy', '#captionemojis', '#engagementdata', '#instagramdata2025', '#socialmediadaata'],
    },
    reelConcept: 'Stat reveal Reel — show the 48% number dramatically, then side-by-side with/without emoji examples',
    scheduledDayOfWeek: 'wednesday',
    scheduledTime: '16:00',
  },

  // ===== DAY 25 — PROMOTIONAL =====
  {
    day: 25,
    pillar: 'promotional',
    hook: 'Your free content calendar is here 📅',
    body: 'We created a free 30-day Reels content calendar with pre-written hooks, CTA suggestions, and hashtag sets for every post. No email gate, no catch — just a resource we wish existed when we started.',
    cta: 'Grab it at the link in bio — 100% free 🎁',
    ctaType: 'link',
    hashtags: {
      broad: ['#freeresource', '#socialmedia', '#contentcreation'],
      targeted: ['#contentcalendar', '#freecalendar', '#socialmediaresource', '#contentplanning', '#freetemplate'],
      niche: ['#reelscalendar', '#30daycalendar', '#freecontentplan', '#socialmediafreebie', '#contenttemplate2025'],
    },
    reelConcept: 'Scroll through the calendar visually, show it being used, highlight "FREE" with text effects',
    scheduledDayOfWeek: 'thursday',
    scheduledTime: '17:00',
  },

  // ===== DAY 26 — COMMUNITY =====
  {
    day: 26,
    pillar: 'community',
    hook: 'We read every single DM 💌',
    body: 'Every DM, every comment, every suggestion — our team reads it all. This community isn\'t just users; you\'re co-builders. Your ideas shaped our hashtag engine, our scheduling features, and what\'s coming next.',
    cta: 'DM us your biggest content struggle — we\'ll help 🤝',
    ctaType: 'ugc',
    hashtags: {
      broad: ['#community', '#feedback', '#socialmedia'],
      targeted: ['#communitybuilding', '#customerlove', '#usersfirst', '#communitydriven', '#wecareaboutyou'],
      niche: ['#dmme', '#communitymatters', '#userfeedback2025', '#socialmediacommunnity', '#realtalk'],
    },
    reelConcept: 'Montage of reading DMs (blurred for privacy), reacting positively, showing implemented features',
    scheduledDayOfWeek: 'friday',
    scheduledTime: '11:00',
  },

  // ===== DAY 27 — BEHIND THE SCENES =====
  {
    day: 27,
    pillar: 'behind-the-scenes',
    hook: 'We ship updates every single week 🚢',
    body: 'Most tools update quarterly. We push improvements weekly. This week: smarter hashtag rotation to prevent algorithm penalties, improved caption length optimization, and a new hook suggestion engine.',
    cta: 'Turn on post notifications so you never miss an update 🔔',
    ctaType: 'follow',
    hashtags: {
      broad: ['#startup', '#tech', '#innovation'],
      targeted: ['#productupdate', '#changelog', '#weeklyupdate', '#buildingpublic', '#startupspeed'],
      niche: ['#weeklyrelease', '#shippingfast', '#productvelocity', '#startupupdates', '#buildinpublic2025'],
    },
    reelConcept: 'Changelog-style Reel — each update slides in with sound effect, quick demo of each feature',
    scheduledDayOfWeek: 'saturday',
    scheduledTime: '10:00',
  },

  // ===== DAY 28 — EDUCATIONAL =====
  {
    day: 28,
    pillar: 'educational',
    hook: 'Stop using the same hashtags every time 🔄',
    body: 'Using identical hashtags on every post tells the algorithm you\'re spamming. Rotate your sets: create 5 hashtag groups for your niche, and cycle through them. Same strategy, different tags. Your reach will thank you.',
    cta: 'Save this and create your 5 hashtag groups today 📎',
    ctaType: 'save',
    hashtags: {
      broad: ['#instagramtips', '#socialmedia', '#marketing'],
      targeted: ['#hashtagstrategy', '#hashtagtips', '#instagramgrowth', '#instagramreach', '#socialmediatips'],
      niche: ['#hashtagrotation', '#hashtaggroups', '#instagramhacks2025', '#hashtagmanagement', '#smarthashtags'],
    },
    reelConcept: 'Visual of 5 different hashtag groups rotating — show them swapping on a post, reach graph going up',
    scheduledDayOfWeek: 'sunday',
    scheduledTime: '17:00',
  },

  // ===== DAY 29 — PROMOTIONAL =====
  {
    day: 29,
    pillar: 'promotional',
    hook: 'What if your content ran itself? 🤔',
    body: 'Imagine: brand voice dialed in, 30 days of captions ready, hashtags optimized, posting times scheduled — all before Monday morning. That\'s not a dream. That\'s what our platform does. Your content, on autopilot.',
    cta: 'Start your free trial — link in bio ✨',
    ctaType: 'link',
    hashtags: {
      broad: ['#socialmedia', '#automation', '#ai'],
      targeted: ['#socialmediaautomation', '#contentautomation', '#aitools', '#socialmediatool', '#marketingautomation'],
      niche: ['#autopilotcontent', '#aitool2025', '#socialmediaaai', '#automatedcaptions', '#contentfreedom'],
    },
    reelConcept: 'Cinematic "imagine" Reel — show the dream (relaxing) while content posts itself (split screen)',
    scheduledDayOfWeek: 'monday',
    scheduledTime: '17:00',
  },

  // ===== DAY 30 — COMMUNITY =====
  {
    day: 30,
    pillar: 'community',
    hook: '30 days done. What\'s next? 🎉',
    body: 'You made it through 30 days of consistent Reels content! That\'s something most brands never achieve. The engagement data from this month will shape next month\'s strategy. Keep showing up — momentum compounds.',
    cta: 'Comment "DONE" and celebrate with us 🥳 What was your best performing Reel?',
    ctaType: 'engagement',
    hashtags: {
      broad: ['#milestone', '#celebration', '#socialmedia'],
      targeted: ['#30daychallenge', '#consistency', '#socialmediagrowth', '#contentgoals', '#milestoneachieved'],
      niche: ['#30daysofcontent', '#contentconsistency', '#reelschallenge', '#monthofcontent', '#growthmilestone'],
    },
    reelConcept: 'Montage of all 30 days of content (quick flashes), ending with celebration and stats overlay',
    scheduledDayOfWeek: 'tuesday',
    scheduledTime: '17:00',
  },
]

/**
 * Get captions filtered by content pillar.
 */
export function getCaptionsByPillar(pillar: ReelCaption['pillar']): ReelCaption[] {
  return REELS_CAPTIONS.filter(c => c.pillar === pillar)
}

/**
 * Get the full formatted caption text (hook + body + cta + hashtags).
 */
export function formatFullCaption(caption: ReelCaption): string {
  const allHashtags = [
    ...caption.hashtags.broad,
    ...caption.hashtags.targeted,
    ...caption.hashtags.niche,
  ].join(' ')

  return `${caption.hook}\n\n${caption.body}\n\n${caption.cta}\n\n${allHashtags}`
}

/**
 * Get pillar distribution stats for the current caption set.
 */
export function getPillarDistribution(): Record<string, { count: number; percentage: number }> {
  const total = REELS_CAPTIONS.length
  const counts: Record<string, number> = {}

  for (const caption of REELS_CAPTIONS) {
    counts[caption.pillar] = (counts[caption.pillar] || 0) + 1
  }

  const result: Record<string, { count: number; percentage: number }> = {}
  for (const [pillar, count] of Object.entries(counts)) {
    result[pillar] = {
      count,
      percentage: Math.round((count / total) * 100),
    }
  }

  return result
}
