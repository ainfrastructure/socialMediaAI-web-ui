# Social Chef Native App - Autonomous Development

## Mission
Build a native iOS/Android app for Social Chef using Capacitor to wrap the existing Vue 3 web app.

## Stack
- **Framework**: Vue 3 + TypeScript + Capacitor 6
- **State**: Pinia stores (port from web app at /Users/svendaneel/Desktop/Programming/socialMediaAI-web-ui)
- **Build**: Vite 7
- **Native Bridge**: Capacitor plugins for camera, storage, notifications
- **Backend API**: Use existing API (no backend changes)

## Source Reference
The web app is at: `/Users/svendaneel/Desktop/Programming/socialMediaAI-web-ui`
Reuse components, stores, and services from this codebase.

## Quality Gates (MUST PASS before each commit)
```bash
npm run type-check    # TypeScript compilation
npm run lint          # ESLint + Oxlint
npm run build         # Vite production build
```

## Architecture Principles
1. **Port, Don't Rewrite**: Copy components from web app, adapt for mobile
2. **Mobile-First**: Optimize layouts for 375px-428px screens
3. **Native Enhancement**: Use Capacitor plugins for camera, biometrics, notifications
4. **Offline-First**: Cache restaurants, posts, and images locally
5. **Design System**: Maintain "Quiet Luxury" aesthetic (cream backgrounds, green accents)

## Feature Priority
1. Authentication (Supabase + OAuth)
2. Restaurant management
3. AI content generation (Gemini/Veo)
4. Social platform OAuth flows
5. Scheduling & publishing
6. Analytics dashboard
7. Subscription/billing
8. Push notifications

## Critical Patterns to Follow

### OAuth Deep Linking
OAuth redirects require custom URL schemes. Configure in `capacitor.config.ts`:
```typescript
ios: { scheme: 'socialchef' }
android: { allowMixedContent: false }
```

### Image Uploads
Use Capacitor Camera plugin:
```typescript
import { Camera, CameraResultType } from '@capacitor/camera'
const photo = await Camera.getPhoto({ resultType: CameraResultType.Base64 })
```

### API Integration
All endpoints documented in `.ralph/specs/api-integration.md`. Use existing service files:
```typescript
import { api } from '@/services/api'
const response = await api.post('/api/gemini/generate-image', { prompt })
```

## Exit Conditions
Stop when:
- All tasks in `.ralph/fix_plan.md` are checked ✅
- App builds successfully for iOS & Android
- Core user journey works: signup → create restaurant → generate content → schedule post
- No TypeScript/build errors

## RALPH_STATUS Block (Update after each iteration)
```json
{
  "EXIT_SIGNAL": false,
  "tasks_completed": 0,
  "tasks_remaining": 100,
  "current_focus": "Foundation setup",
  "blockers": []
}
```
