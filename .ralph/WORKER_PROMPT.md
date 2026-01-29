# SocialChef Web UI - Development Guide

You are building features for the **SocialChef Web UI**, a Vue 3 + TypeScript + Vite frontend.

## Mission

Implement and maintain the Vue 3 web application for SocialChef, following the "Quiet Luxury" design aesthetic and modern frontend best practices.

## Technology Stack

- **Framework:** Vue 3 (Composition API with `<script setup>`)
- **Language:** TypeScript (strict mode)
- **Build:** Vite 7
- **State:** Pinia stores
- **Routing:** Vue Router 4
- **Styling:** CSS/SCSS with scoped styles
- **i18n:** vue-i18n
- **Charts:** vue-chartjs + chart.js
- **Date:** date-fns + date-fns-tz
- **Testing:** Playwright (e2e)
- **Linting:** ESLint + oxlint + Prettier

## Backend Reference

The backend API is at: `/home/ubuntu/socialMediaAI`

Use it as reference for:
- API endpoints and response shapes
- Authentication flow
- Data models and types

## Key Principles

### 1. Vue 3 Composition API

```vue
<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()
const loading = ref(false)
const user = computed(() => authStore.user)

onMounted(async () => {
  // Initialize
})
</script>
```

### 2. TypeScript First

- Define interfaces for all data shapes
- Use strict typing (no `any` without justification)
- Export types from dedicated `types/` files

```typescript
// types/user.ts
export interface User {
  id: string
  email: string
  name: string
  subscription: SubscriptionTier
}

export type SubscriptionTier = 'free' | 'pro' | 'enterprise'
```

### 3. Pinia Stores

```typescript
// stores/auth.ts
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { api } from '@/services/api'
import type { User } from '@/types/user'

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null)
  const token = ref<string | null>(localStorage.getItem('token'))

  const isAuthenticated = computed(() => !!token.value)

  async function login(email: string, password: string) {
    const response = await api.post('/auth/login', { email, password })
    token.value = response.data.token
    user.value = response.data.user
    localStorage.setItem('token', response.data.token)
  }

  function logout() {
    token.value = null
    user.value = null
    localStorage.removeItem('token')
  }

  return { user, token, isAuthenticated, login, logout }
})
```

### 4. Component Structure

```vue
<template>
  <div class="user-card">
    <h2>{{ user.name }}</h2>
    <p>{{ user.email }}</p>
    <BaseButton @click="handleEdit">
      {{ t('common.edit') }}
    </BaseButton>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import BaseButton from '@/components/base/BaseButton.vue'
import type { User } from '@/types/user'

const { t } = useI18n()

defineProps<{
  user: User
}>()

const emit = defineEmits<{
  edit: [userId: string]
}>()

const handleEdit = () => {
  emit('edit', props.user.id)
}
</script>

<style scoped>
.user-card {
  background: var(--bg-secondary);
  padding: var(--spacing-md);
  border-radius: var(--radius-lg);
}
</style>
```

## Design System

### Colors (Quiet Luxury Theme)

```css
:root {
  /* Backgrounds */
  --bg-primary: #f6f1e7;      /* Warm cream */
  --bg-secondary: #faf7f0;    /* Lighter cream */
  --bg-tertiary: #f0ebe1;     /* Slightly darker cream */

  /* Accents */
  --accent: #0f3d2e;          /* Deep forest green */
  --accent-light: #1a5a45;    /* Lighter green */
  --accent-dark: #0a2818;     /* Darker green */

  /* Text */
  --text-primary: #2d2d2d;    /* Main text */
  --text-secondary: #5a5a5a;  /* Secondary text */
  --text-muted: #888888;      /* Muted text */

  /* Status */
  --success: #0f3d2e;
  --error: #ef4444;
  --warning: #f59e0b;
}
```

### Typography

- **Headings:** Playfair Display (serif)
- **Body:** Inter (sans-serif)
- Use CSS custom properties for sizes

### Spacing

```css
:root {
  --spacing-xs: 4px;
  --spacing-sm: 8px;
  --spacing-md: 16px;
  --spacing-lg: 24px;
  --spacing-xl: 32px;
  --spacing-2xl: 48px;
}
```

## File Structure

```
src/
├── components/          # Reusable UI components
│   ├── base/           # Base components (Button, Card, Input)
│   └── features/       # Feature-specific components
├── views/              # Page views/screens
├── stores/             # Pinia state management
├── services/           # API services
├── composables/        # Shared composition functions
├── types/              # TypeScript type definitions
├── utils/              # Utility functions
├── assets/             # Images, fonts
├── locales/            # i18n translation files
└── router/             # Vue Router configuration
```

## Naming Conventions

- **Components:** PascalCase (`BaseButton.vue`, `UserCard.vue`)
- **Views:** PascalCase with suffix (`LoginView.vue`, `DashboardView.vue`)
- **Stores:** camelCase with `use` prefix (`useAuthStore.ts`)
- **Composables:** camelCase with `use` prefix (`useForm.ts`)
- **Services:** camelCase (`apiService.ts`)
- **Utils:** camelCase (`formatDate.ts`)
- **Types:** PascalCase (`User.ts`, `ApiResponse.ts`)

## Development Workflow

### For Each Task:

1. **Read the task** from `.ralph/tasks.md`
2. **Review backend API** if API integration involved
3. **Plan your approach** - what components/stores needed?
4. **Implement** following Vue 3 patterns
5. **Test** - run the dev server and verify functionality
6. **Quality gates:**
   - `npm run type-check`
   - `npm run lint`
   - `npm run build`
7. **Commit** with message: `feat: [description]` or `fix: [description]`
8. **Update task** status

## Common Patterns

### API Calls with Error Handling

```typescript
const loading = ref(false)
const error = ref<string | null>(null)

async function fetchData() {
  loading.value = true
  error.value = null
  try {
    const response = await api.get('/endpoint')
    data.value = response.data
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'An error occurred'
  } finally {
    loading.value = false
  }
}
```

### Form Handling

```typescript
import { ref, computed } from 'vue'

const form = ref({
  email: '',
  password: ''
})

const isValid = computed(() => {
  return form.value.email.includes('@') && form.value.password.length >= 8
})

async function handleSubmit() {
  if (!isValid.value) return
  // submit...
}
```

### i18n Usage

```vue
<template>
  <h1>{{ t('dashboard.title') }}</h1>
  <p>{{ t('dashboard.welcome', { name: user.name }) }}</p>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
const { t } = useI18n()
</script>
```

## Quality Standards

### Must Have:

- ✅ TypeScript types for all props/emits
- ✅ Error handling with try/catch for async operations
- ✅ Loading states for async operations
- ✅ Empty states for lists
- ✅ i18n for all user-facing text
- ✅ Responsive design (mobile-first)
- ✅ Accessible (proper labels, focus management)
- ✅ Scoped CSS styles

### Must NOT:

- ❌ Hardcoded text (use i18n)
- ❌ Hardcoded colors (use CSS variables)
- ❌ Unhandled promise rejections
- ❌ `any` types without justification
- ❌ Options API (use Composition API)
- ❌ Global CSS without scoping

## Testing

### E2E Testing with Playwright

```typescript
import { test, expect } from '@playwright/test'

test('user can login', async ({ page }) => {
  await page.goto('/login')
  await page.fill('[data-testid="email"]', 'test@example.com')
  await page.fill('[data-testid="password"]', 'password123')
  await page.click('[data-testid="submit"]')
  await expect(page).toHaveURL('/dashboard')
})
```

### Manual Testing Checklist

- [ ] Works on Chrome, Firefox, Safari
- [ ] Responsive (375px, 768px, 1024px+)
- [ ] Loading states display correctly
- [ ] Error states display correctly
- [ ] Empty states display correctly
- [ ] Forms validate properly
- [ ] Navigation works correctly

## Scripts

```bash
npm run dev            # Start dev server (localhost:5173)
npm run build          # Build for production
npm run preview        # Preview production build
npm run type-check     # TypeScript validation
npm run lint           # Lint and fix code
npm run format         # Format with Prettier
npm run test:e2e       # Run Playwright tests
npm run verify         # Full verification
npm run quick-check    # Quick lint + type check
```

## Environment Variables

```env
VITE_API_URL=http://localhost:3000    # Backend API URL
```

Access in code:
```typescript
const apiUrl = import.meta.env.VITE_API_URL
```

## Getting Help

- Backend API: `/home/ubuntu/socialMediaAI`
- Vue 3 docs: https://vuejs.org/
- Pinia docs: https://pinia.vuejs.org/
- Vite docs: https://vitejs.dev/
- vue-i18n docs: https://vue-i18n.intlify.dev/

## Success Metrics

Each task is complete when:
1. All subtasks implemented
2. All success criteria met
3. Quality gates pass (`npm run type-check && npm run lint && npm run build`)
4. Code committed with clear message
5. Task marked as done

---

**Remember:** Write clean, maintainable Vue 3 code. Quality over speed! 🚀
