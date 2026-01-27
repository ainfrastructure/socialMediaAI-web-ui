# Social Chef Native App - Technical Requirements

## Platform Targets
- **iOS**: 15.0+
- **Android**: API 26+ (Android 8.0 Oreo)

## Core Technologies
- **Framework**: Vue 3.4+ with Composition API
- **Language**: TypeScript 5.3+
- **Build Tool**: Vite 7
- **Native Bridge**: Capacitor 6
- **State Management**: Pinia
- **Router**: Vue Router 4
- **HTTP Client**: Axios
- **UI Framework**: Custom components (port from web app)

## Required Capacitor Plugins

### Official Capacitor Plugins
```json
{
  "@capacitor/camera": "^6.0.0",
  "@capacitor/preferences": "^6.0.0",
  "@capacitor/local-notifications": "^6.0.0",
  "@capacitor/share": "^6.0.0",
  "@capacitor/status-bar": "^6.0.0",
  "@capacitor/splash-screen": "^6.0.0",
  "@capacitor/haptics": "^6.0.0",
  "@capacitor/network": "^6.0.0"
}
```

### Community Plugins
```json
{
  "@capacitor-community/apple-sign-in": "^6.0.0",
  "@codetrix-studio/capacitor-google-auth": "^3.3.0",
  "@capacitor-community/fingerprint-aeid": "^6.0.0",
  "@capacitor-community/google-maps": "^6.0.0",
  "@capacitor-community/media": "^6.0.0"
}
```

## Backend API
- **Base URL**: Configured via `VITE_API_URL` environment variable
- **Authentication**: JWT Bearer tokens
- **Storage**: Supabase for auth + file storage
- **AI Services**: Google Gemini (images), Google Veo (videos)

## Design Requirements
- **Color Palette**: Cream backgrounds (#f6f1e7), deep green accents (#0f3d2e)
- **Typography**: Playfair Display (headings), Inter (body)
- **Effects**: Glassmorphism with backdrop blur
- **Icons**: Material Symbols + custom brass-gradient platform icons
- **Animations**: Subtle, respects prefers-reduced-motion

## Performance Requirements
- **App Size**: <50MB (iOS), <30MB (Android)
- **Bundle Size**: <5MB JavaScript
- **Cold Start**: <3 seconds
- **Image Generation**: <30 seconds
- **API Response**: <2 seconds (non-AI endpoints)

## Security Requirements
- **Token Storage**: Use Capacitor Preferences (encrypted on device)
- **Biometric Auth**: Optional, for quick login
- **API Keys**: Never hardcode, use environment variables
- **HTTPS Only**: All API calls must use HTTPS
- **OAuth**: Use system browser for OAuth flows (not WebView)

## Offline Capabilities
- **Cached Data**: Restaurants, generated content, scheduled posts
- **Queue**: Failed publishes retry when online
- **Sync**: Automatic when network available
- **Storage**: IndexedDB for structured data, Preferences for settings

## Accessibility Requirements
- **WCAG 2.1 AA**: Minimum compliance level
- **Screen Readers**: VoiceOver (iOS), TalkBack (Android)
- **Text Scaling**: Support Dynamic Type / Font Scale
- **Contrast**: 4.5:1 for body text, 3:1 for large text
- **Touch Targets**: Minimum 44x44pt

## Testing Requirements
- **Unit Tests**: Vitest for logic
- **E2E Tests**: Manual testing checklist (initial version)
- **Device Testing**: iOS Simulator + Android Emulator
- **Real Devices**: iPhone 12+, Pixel 5+ (before production)

## Build Requirements
- **Quality Gates**: Must pass before commit
  - `npm run type-check` (no TypeScript errors)
  - `npm run lint` (no ESLint/Oxlint errors)
  - `npm run build` (successful production build)
- **Environment Files**:
  - `.env.development` (local development)
  - `.env.production` (app store builds)

## App Store Requirements (Future)
- **App Name**: Social Chef
- **Bundle ID**: com.socialchef.app
- **Privacy Policy**: Required before submission
- **Screenshots**: 6.5" iPhone, 12.9" iPad, Android variants
- **Description**: Ready for localization (English, Norwegian)
