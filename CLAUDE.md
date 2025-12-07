# Development Guidelines

## Critical Rules (Top Priority)

### 1. No Copy-Paste - Create Shared Components & Styles
- NEVER copy-paste similar code between components
- Extract repeated patterns into reusable components in `src/components/`
- Check existing Base* components before creating new ones
- Make components generic and reusable when possible

**STYLING: This repo has massive style duplication. Before writing new CSS:**
- Check if a Base* component already handles the styling
- Use existing CSS variables from `theme.css` - don't recreate similar values
- If you see repeated style patterns across components, extract to a shared component or utility class
- Common culprits: card styles, button styles, modal styles, form layouts, glass effects

**When building new features:** Look for opportunities to refactor existing duplicated styles/components into reusable ones. Don't just add more duplication - fix it as you go.

### 2. Clean Up Unused Code
- Delete dead code, unused functions/variables/imports
- Remove stale files and components no longer in use
- Clean up unused i18n keys when removing features
- Run `npm run build` to catch issues
- This repo has bloat - actively clean as you work

### 3. No Hardcoded Text (i18n Required)
- Files: `src/i18n/locales/en.ts` and `no.ts`
- Template: `{{ $t('key') }}` or with interpolation: `{{ $t('key', { name: value }) }}`
- Script: `const { t } = useI18n(); t('key')`
- Add keys to BOTH language files
- Reuse `common` section keys when possible

### 4. Use CSS Variables Only
Never hardcode colors, spacing, or typography. Use `src/assets/theme.css`.

---

## Architecture Overview

### File Structure
```
src/
├── assets/theme.css         # Design tokens (CSS variables)
├── components/              # Reusable components (Base*, modals, UI)
├── views/                   # Page views
├── stores/                  # Pinia stores (state management)
├── composables/             # Shared logic (use* hooks)
├── services/                # API services
├── config/                  # Sentry, PostHog config
├── utils/                   # Utility functions
├── i18n/locales/            # en.ts, no.ts translations
└── router/                  # Vue Router with guards
```

### Key Patterns

**Stores (src/stores/)** - Pinia for global state
```typescript
import { useAuthStore } from '@/stores/auth'
const authStore = useAuthStore()
```

**Composables (src/composables/)** - Shared component logic
```typescript
import { useLogin } from '@/composables/useLogin'
const { login, isLoading } = useLogin()
```

**Services (src/services/)** - API calls
```typescript
import { api } from '@/services/api'
const response = await api.get('/endpoint')
```

### Route Guards
Routes use `meta` for access control:
```typescript
{ path: '/dashboard', meta: { requiresAuth: true } }
{ path: '/login', meta: { requiresGuest: true } }
```

### Error Tracking & Analytics
```typescript
import { captureError } from '@/config/sentry'
import { trackEvent } from '@/utils/monitoring'

captureError(error)
trackEvent('event_name', { property: 'value' })
```

---

## Component Library

### Base Components (Use These First)
Check `src/components/Base*.vue` before creating new components:

| Component | Purpose | Key Props |
|-----------|---------|-----------|
| `BaseButton` | Buttons | `variant` (primary/secondary/ghost/danger), `size`, `fullWidth` |
| `BaseCard` | Glass containers | `variant` (glass/glass-intense/solid), `hoverable`, `elevated` |
| `BaseAlert` | Messages | `type` (success/error/info/warning), `dismissible` |
| `BaseInput` | Form inputs | `type`, `label`, `error`, `hint` |
| `BaseModal` | Modal dialogs | `size` (sm/md/lg/xl/full), uses Teleport |

### Other Key Components
- `DashboardLayout` - Main app wrapper
- `MaterialIcon` - Material Symbols icons
- `PlatformLogo` - Social platform icons
- `Toast` - Toast notifications
- `LoadingOverlay` - Loading states
- `*Modal` - Various modal dialogs (check existing before creating new)

---

## Design System

**"Quiet Luxury"** aesthetic:
- Deep charcoal backgrounds + muted gold accents
- Typography: Playfair Display (headings) + Inter (body)
- Glassmorphism with backdrop blur
- Subtle animations

**Avoid:** Neon colors, flashy effects, cluttered layouts

### CSS Variables (src/assets/theme.css)
```css
/* Backgrounds */
--bg-primary, --bg-secondary, --bg-tertiary, --bg-elevated

/* Text */
--text-primary, --text-secondary, --text-muted, --text-on-gold

/* Gold Accents */
--gold-primary, --gold-light, --gold-dark, --gold-subtle, --gradient-gold

/* Glass Effects */
--glass-bg, --glass-border, --blur-md, --blur-lg

/* Semantic Colors */
--success-bg/border/text, --error-bg/border/text, --info-bg/border/text, --warning-bg/border/text

/* Spacing: --space-{xs|sm|md|lg|xl|2xl|3xl|4xl|5xl} */
/* Typography: --font-heading, --font-body, --text-{xs|sm|base|lg|xl|2xl|3xl|4xl|5xl} */
/* Radius: --radius-{sm|md|lg|xl|full} */
/* Shadows: --shadow-{sm|md|lg|xl}, --glow-gold-{sm|md} */
/* Transitions: --transition-{fast|base|slow} */
/* Platform Brands: --gradient-{facebook|instagram|tiktok|twitter|linkedin} */
```

---

## Patterns & Conventions

### Component Template
```vue
<script setup lang="ts">
import { useI18n } from 'vue-i18n'

interface Props { title?: string }
const props = withDefaults(defineProps<Props>(), { title: '' })
const emit = defineEmits<{ (e: 'click'): void }>()
const { t } = useI18n()
</script>

<template>
  <div class="my-component">
    <h2>{{ t('section.title') }}</h2>
  </div>
</template>

<style scoped>
.my-component {
  background: var(--bg-secondary);
  padding: var(--space-xl);
  border-radius: var(--radius-lg);
}
</style>
```

### Modal Pattern
```vue
<Teleport to="body">
  <BaseModal v-model="isOpen" size="md">
    <!-- content -->
  </BaseModal>
</Teleport>
```

### Mobile Considerations
- Touch targets: minimum 44-48px
- Safe area insets: `env(safe-area-inset-*)`
- Mobile-first responsive design

---

## Best Practices

1. Use CSS variables from theme.css exclusively
2. Mobile-first responsive design
3. Scoped styles (`<style scoped>`)
4. TypeScript interfaces for props/emits
5. Teleport modals to body for z-index safety
6. Keyboard navigation for accessibility
7. Dark theme only (no light mode)
8. Clean up as you work - delete unused code

### Accessibility: Reduced Motion
```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

### Gold Gradient Text
```css
.gold-text {
  background: var(--gradient-gold);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}
```
