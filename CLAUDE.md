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

**"Quiet Luxury"** aesthetic with **Light Mode**:
- Warm cream background (`#f6f1e7`) with deep green accents (`#0f3d2e`)
- Brushed brass/gold icons (`#b08a5a` → `#9a7848` gradient)
- Typography: Playfair Display (headings) + Inter (body)
- Glassmorphism with backdrop blur on light backgrounds
- Subtle animations and soft shadows

**Color Palette:**
- **Primary Background:** `#f6f1e7` (warm cream)
- **Secondary Background:** `#faf7f0` (lighter cream)
- **Accent Color:** `#0f3d2e` (deep forest green) - used for buttons, links, active states
- **Icons:** Brushed brass gradient (`#b08a5a` → `#9a7848`)
- **Text on Green:** White (`#ffffff`) for proper contrast

**Status Colors:**
- **Published:** Green (`#0f3d2e`) - main accent color
- **Scheduled:** Orange (`#f59e0b`)
- **Failed:** Red (`#ef4444`)

**Avoid:** Dark backgrounds, neon colors, flashy effects, cluttered layouts

### CSS Variables (src/assets/theme.css)
```css
/* Backgrounds (Light Mode) */
--bg-primary: #f6f1e7;      /* Main cream background */
--bg-secondary: #faf7f0;    /* Lighter cream */
--bg-tertiary: #f0ebe1;     /* Slightly darker cream */
--bg-elevated: #e8e1d5;     /* Elevated elements */

/* Text (Dark on Light) */
--text-primary: #2d2d2d;    /* Main text */
--text-secondary: #5a5a5a;  /* Secondary text */
--text-muted: #888888;      /* Muted text */
--text-on-gold: #f6f1e7;    /* Text on green buttons (cream) */

/* Green Accents (replaces gold for interactive elements) */
--gold-primary: #0f3d2e;    /* Deep forest green */
--gold-light: #1a5a45;      /* Lighter green */
--gold-dark: #0a2818;       /* Darker green */

/* Glass Effects (Light Mode) */
--glass-bg: rgba(255, 255, 255, 0.7);
--glass-border: rgba(15, 61, 46, 0.12);

/* Semantic Colors */
--success-bg/border/text, --error-bg/border/text, --info-bg/border/text, --warning-bg/border/text

/* Spacing: --space-{xs|sm|md|lg|xl|2xl|3xl|4xl|5xl} */
/* Typography: --font-heading, --font-body, --text-{xs|sm|base|lg|xl|2xl|3xl|4xl|5xl} */
/* Radius: --radius-{sm|md|lg|xl|full} */
/* Shadows: Use green-tinted shadows - rgba(15, 61, 46, 0.08-0.15) */
/* Transitions: --transition-{fast|base|slow} */
/* Platform Brands: --gradient-{facebook|instagram|tiktok|twitter|linkedin} */
```

### Icon Colors
- **Golden/Brass Icons:** Use gradient `#b08a5a` → `#9a7848` (see `src/components/icons/Golden*.vue`)
- **Check icons on green background:** Always use white (`#ffffff`) for contrast
- **Logo:** Brushed brass with brass glow effect

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
7. Light theme only - use cream backgrounds and green accents
8. Clean up as you work - delete unused code
9. Check icons on green: always use white (`#ffffff`) for contrast
10. Loading overlays: use light cream (`rgba(246, 241, 231, 0.85)`) not dark

### Accessibility: Reduced Motion
```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

### Accent Gradient Text (Green)
```css
.accent-text {
  background: var(--gradient-gold);  /* Now green gradient */
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}
```

### Brass Icon Gradient (for decorative icons)
```css
/* Used in Golden*.vue icon components */
linearGradient: #b08a5a → #9a7848
```
