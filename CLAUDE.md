# Premium Dark Theme Design System Guide

This document explains how to create new components, views, and features while maintaining the premium, elegant dark aesthetic of this application.

## Table of Contents
1. [Internationalization (i18n)](#internationalization-i18n)
2. [Design Philosophy](#design-philosophy)
3. [Architecture Overview](#architecture-overview)
4. [Using Existing Components](#using-existing-components)
5. [Creating New Components](#creating-new-components)
6. [Color Usage Guidelines](#color-usage-guidelines)
7. [Typography Guidelines](#typography-guidelines)
8. [Spacing & Layout](#spacing--layout)
9. [Animation Guidelines](#animation-guidelines)
10. [Common Patterns](#common-patterns)

---

## Internationalization (i18n)

**IMPORTANT: NEVER hardcode user-facing text in components.**

All text visible to users MUST be placed in the translation files and accessed via `$t()` or `t()`.

### Translation Files
- English: `src/i18n/locales/en.ts`
- Norwegian: `src/i18n/locales/no.ts`

### How to Add New Text

1. **Add the key to both language files:**
```typescript
// en.ts
mySection: {
  myLabel: 'My Label',
  myButton: 'Click Me',
}

// no.ts
mySection: {
  myLabel: 'Min etikett',
  myButton: 'Klikk meg',
}
```

2. **Use in templates with `$t()`:**
```vue
<template>
  <h1>{{ $t('mySection.myLabel') }}</h1>
  <button>{{ $t('mySection.myButton') }}</button>
</template>
```

3. **Use in scripts with `useI18n()`:**
```typescript
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
const message = t('mySection.myLabel')
```

4. **For dynamic values, use interpolation:**
```typescript
// en.ts
greeting: 'Hello, {name}!'

// Component
{{ $t('greeting', { name: userName }) }}
```

### Existing Key Sections
- `common` - Shared UI terms (cancel, save, delete, etc.)
- `platforms` - Platform names (Facebook, Instagram, etc.)
- `timezones` - Timezone labels
- `auth` - Login/authentication
- `dashboard` - Dashboard view
- `posts` - Posts management
- `scheduler` - Scheduler view
- `onboarding` - Onboarding flows
- `scheduleModal` - Schedule modal
- `facebookOnboarding` - Facebook connection modal

### What to NEVER Do
- ❌ Hardcode text directly in templates: `<h1>Welcome</h1>`
- ❌ Hardcode text in placeholders: `placeholder="Enter email"`
- ❌ Hardcode button labels: `<button>Submit</button>`
- ❌ Hardcode error messages in scripts
- ❌ Hardcode alt text for images

### What to ALWAYS Do
- ✅ Use `$t('key')` in templates
- ✅ Use `t('key')` in scripts after importing `useI18n`
- ✅ Add keys to BOTH `en.ts` and `no.ts`
- ✅ Use interpolation for dynamic content
- ✅ Reuse existing keys from `common` when possible

---

## Design Philosophy

**Quiet Luxury** - The design conveys premium quality through:
- Deep charcoal backgrounds with subtle gradients
- Muted gold accents (champagne tones)
- Refined typography (Playfair Display + Inter)
- Glassmorphism with frosted blur effects
- Smooth, intentional animations
- Clean spacing and soft shadows

**What to AVOID:**
- ❌ Neon colors or excessive gradients
- ❌ Overly bright or saturated colors
- ❌ Salesy or "scammy" effects
- ❌ Excessive animations or motion
- ❌ Heavy text or cluttered layouts

**What to EMBRACE:**
- ✅ Subtle elegance and sophistication
- ✅ Trust-building visual hierarchy
- ✅ Clear, readable content
- ✅ Professional polish
- ✅ Confidence-inspiring aesthetics

---

## Architecture Overview

### File Structure
```
src/
├── assets/
│   └── theme.css              # Global design tokens
├── components/
│   ├── BaseButton.vue         # Reusable button component
│   ├── BaseCard.vue           # Glass effect containers
│   ├── BaseAlert.vue          # Alert messages
│   ├── BaseInput.vue          # Form inputs
│   └── GradientBackground.vue # Animated background
└── views/
    ├── LoginView.vue
    ├── DashboardView.vue
    ├── PlansView.vue
    ├── ResetPasswordView.vue
    └── AuthCallbackView.vue
```

### Design Token System
All design tokens are defined in `src/assets/theme.css` as CSS variables. **Always use these variables instead of hardcoded values.**

---

## Using Existing Components

### BaseButton

```vue
<script setup>
import BaseButton from '@/components/BaseButton.vue'
</script>

<template>
  <!-- Primary gold button -->
  <BaseButton variant="primary" size="large" @click="handleClick">
    Subscribe Now
  </BaseButton>

  <!-- Secondary glass button -->
  <BaseButton variant="secondary" size="medium" @click="handleAction">
    Learn More
  </BaseButton>

  <!-- Ghost button (outlined) -->
  <BaseButton variant="ghost" size="small" @click="handleCancel">
    Cancel
  </BaseButton>

  <!-- Danger button -->
  <BaseButton variant="danger" @click="handleDelete">
    Delete Account
  </BaseButton>

  <!-- Full width button -->
  <BaseButton variant="primary" full-width :disabled="loading">
    {{ loading ? 'Processing...' : 'Continue' }}
  </BaseButton>
</template>
```

**Props:**
- `variant`: `'primary' | 'secondary' | 'ghost' | 'danger'` (default: `'primary'`)
- `size`: `'small' | 'medium' | 'large'` (default: `'medium'`)
- `fullWidth`: `boolean` (default: `false`)
- `disabled`: `boolean` (default: `false`)
- `type`: `'button' | 'submit' | 'reset'` (default: `'button'`)

---

### BaseCard

```vue
<script setup>
import BaseCard from '@/components/BaseCard.vue'
</script>

<template>
  <!-- Standard glass card -->
  <BaseCard variant="glass">
    <h2>Card Title</h2>
    <p>Card content goes here</p>
  </BaseCard>

  <!-- Intense glass (more opaque) -->
  <BaseCard variant="glass-intense">
    <h2>Important Content</h2>
  </BaseCard>

  <!-- Solid card (no transparency) -->
  <BaseCard variant="solid">
    <h2>Solid Background</h2>
  </BaseCard>

  <!-- Hoverable card (adds hover effect) -->
  <BaseCard variant="glass" hoverable>
    <h2>Click me!</h2>
  </BaseCard>

  <!-- Elevated card (stronger shadow) -->
  <BaseCard variant="glass" elevated>
    <h2>Featured Content</h2>
  </BaseCard>
</template>
```

**Props:**
- `variant`: `'glass' | 'glass-intense' | 'solid'` (default: `'glass'`)
- `hoverable`: `boolean` (default: `false`) - adds hover lift effect
- `elevated`: `boolean` (default: `false`) - stronger shadow

---

### BaseAlert

```vue
<script setup>
import { ref } from 'vue'
import BaseAlert from '@/components/BaseAlert.vue'

const showAlert = ref(true)
</script>

<template>
  <!-- Success alert -->
  <BaseAlert type="success" v-model="showAlert">
    Payment successful!
  </BaseAlert>

  <!-- Error alert -->
  <BaseAlert type="error" :dismissible="false">
    Invalid credentials
  </BaseAlert>

  <!-- Info alert -->
  <BaseAlert type="info" @close="handleClose">
    Please verify your email
  </BaseAlert>

  <!-- Warning alert -->
  <BaseAlert type="warning">
    Your subscription expires soon
  </BaseAlert>
</template>
```

**Props:**
- `type`: `'success' | 'error' | 'info' | 'warning'` (default: `'info'`)
- `message`: `string` - alternative to slot
- `dismissible`: `boolean` (default: `true`)
- `modelValue`: `boolean` (default: `true`) - for v-model support

---

### BaseInput

```vue
<script setup>
import { ref } from 'vue'
import BaseInput from '@/components/BaseInput.vue'

const email = ref('')
const bio = ref('')
</script>

<template>
  <!-- Text input -->
  <BaseInput
    v-model="email"
    type="email"
    label="Email Address"
    placeholder="your@email.com"
    required
  />

  <!-- Password input -->
  <BaseInput
    v-model="password"
    type="password"
    label="Password"
    hint="Must be at least 8 characters"
  />

  <!-- Textarea -->
  <BaseInput
    v-model="bio"
    type="textarea"
    label="Bio"
    placeholder="Tell us about yourself..."
    :rows="4"
  />

  <!-- Input with error -->
  <BaseInput
    v-model="username"
    label="Username"
    error="Username is already taken"
  />

  <!-- Disabled input -->
  <BaseInput
    v-model="readOnlyField"
    label="Read Only"
    disabled
  />
</template>
```

**Props:**
- `modelValue`: `string | number` - for v-model
- `type`: `string` (default: `'text'`) - also supports `'textarea'`
- `label`: `string`
- `placeholder`: `string`
- `required`: `boolean`
- `disabled`: `boolean`
- `error`: `string` - error message to display
- `hint`: `string` - helper text
- `rows`: `number` (default: `4`) - for textarea

---

## Creating New Components

### Component Template

```vue
<script setup lang="ts">
import { computed } from 'vue'

// Define props with TypeScript
interface Props {
  title?: string
  active?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  title: 'Default Title',
  active: false
})

// Define emits
const emit = defineEmits<{
  (e: 'select', id: string): void
}>()

// Your component logic here
</script>

<template>
  <div :class="['my-component', { active: props.active }]">
    <h3 class="component-title">{{ props.title }}</h3>
    <slot></slot>
  </div>
</template>

<style scoped>
/* Use CSS variables from theme.css */
.my-component {
  background: var(--bg-secondary);
  padding: var(--space-xl);
  border-radius: var(--radius-lg);
  border: var(--border-width) solid var(--border-color);
  transition: var(--transition-base);
}

.my-component.active {
  border-color: var(--gold-primary);
  background: var(--gold-subtle);
}

.component-title {
  font-family: var(--font-heading);
  font-size: var(--text-xl);
  color: var(--text-primary);
  margin-bottom: var(--space-md);
}
</style>
```

### Key Principles

1. **Always import the theme**: `@import '../assets/theme.css';` in App.vue (already done)
2. **Use CSS variables**: Never hardcode colors, spacing, or other design tokens
3. **Scoped styles**: Use `<style scoped>` to prevent style leakage
4. **TypeScript**: Define props and emits with TypeScript interfaces
5. **Accessibility**: Add proper ARIA labels and keyboard support

---

## Color Usage Guidelines

### Background Colors
```css
/* Main app background */
background: var(--bg-primary);       /* #0a0a0a - deepest black */

/* Cards and elevated surfaces */
background: var(--bg-secondary);     /* #141414 */

/* Nested elements within cards */
background: var(--bg-tertiary);      /* #1a1a1a */

/* Hover states, active elements */
background: var(--bg-elevated);      /* #222222 */
```

### Glass Effects
```css
/* Standard glass card */
background: var(--glass-bg);         /* rgba(26, 26, 26, 0.6) */
backdrop-filter: blur(var(--blur-md));
border: var(--border-width) solid var(--glass-border);

/* More intense glass */
background: rgba(26, 26, 26, 0.85);
backdrop-filter: blur(var(--blur-lg));
```

### Gold Accents
```css
/* Primary gold (buttons, highlights) */
color: var(--gold-primary);          /* #D4AF37 */

/* Lighter gold (hover states) */
color: var(--gold-light);            /* #E5C775 */

/* Darker gold (shadows, active states) */
color: var(--gold-dark);             /* #B8943D */

/* Subtle gold wash (backgrounds) */
background: var(--gold-subtle);      /* rgba(212, 175, 55, 0.1) */

/* Gold gradient */
background: var(--gradient-gold);    /* linear-gradient */
```

### Text Colors
```css
/* Primary text (headings, important content) */
color: var(--text-primary);          /* #F5F5F5 - off-white */

/* Secondary text (body, descriptions) */
color: var(--text-secondary);        /* #B8B8B8 */

/* Muted text (hints, captions) */
color: var(--text-muted);            /* #808080 */

/* Text on gold backgrounds */
color: var(--text-on-gold);          /* #0a0a0a - dark */
```

### Semantic Colors
```css
/* Success */
background: var(--success-bg);
border-color: var(--success-border);
color: var(--success-text);

/* Error */
background: var(--error-bg);
border-color: var(--error-border);
color: var(--error-text);

/* Info */
background: var(--info-bg);
border-color: var(--info-border);
color: var(--info-text);

/* Warning */
background: var(--warning-bg);
border-color: var(--warning-border);
color: var(--warning-text);
```

---

## Typography Guidelines

### Font Families
```css
/* Headings (elegant, serif) */
font-family: var(--font-heading);    /* Playfair Display */

/* Body text (clean, sans-serif) */
font-family: var(--font-body);       /* Inter */
```

### Font Sizes
```css
font-size: var(--text-xs);      /* 12px - small labels */
font-size: var(--text-sm);      /* 14px - body text, form labels */
font-size: var(--text-base);    /* 16px - default body */
font-size: var(--text-lg);      /* 18px - large body */
font-size: var(--text-xl);      /* 20px - section headings */
font-size: var(--text-2xl);     /* 24px - card titles */
font-size: var(--text-3xl);     /* 30px - page titles */
font-size: var(--text-4xl);     /* 36px - hero headings */
font-size: var(--text-5xl);     /* 48px - large prices/numbers */
```

### Font Weights
```css
font-weight: var(--font-light);      /* 300 */
font-weight: var(--font-normal);     /* 400 */
font-weight: var(--font-medium);     /* 500 */
font-weight: var(--font-semibold);   /* 600 */
font-weight: var(--font-bold);       /* 700 */
```

### Typography Examples
```vue
<template>
  <!-- Hero heading with gold gradient -->
  <h1 class="hero-title">Premium Features</h1>

  <!-- Section heading -->
  <h2 class="section-title">Getting Started</h2>

  <!-- Card title -->
  <h3 class="card-title">Account Settings</h3>

  <!-- Body text -->
  <p class="body-text">This is regular body text...</p>

  <!-- Small caption -->
  <span class="caption">Updated 2 hours ago</span>
</template>

<style scoped>
.hero-title {
  font-family: var(--font-heading);
  font-size: var(--text-4xl);
  font-weight: var(--font-bold);
  background: var(--gradient-gold);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.section-title {
  font-family: var(--font-heading);
  font-size: var(--text-2xl);
  font-weight: var(--font-semibold);
  color: var(--text-primary);
  margin-bottom: var(--space-lg);
}

.card-title {
  font-family: var(--font-heading);
  font-size: var(--text-xl);
  color: var(--text-primary);
}

.body-text {
  font-family: var(--font-body);
  font-size: var(--text-base);
  color: var(--text-secondary);
  line-height: var(--leading-normal);
}

.caption {
  font-size: var(--text-xs);
  color: var(--text-muted);
}
</style>
```

---

## Spacing & Layout

### Spacing Scale
```css
padding: var(--space-xs);       /* 4px */
padding: var(--space-sm);       /* 8px */
padding: var(--space-md);       /* 12px */
padding: var(--space-lg);       /* 16px */
padding: var(--space-xl);       /* 24px */
padding: var(--space-2xl);      /* 32px */
padding: var(--space-3xl);      /* 40px */
padding: var(--space-4xl);      /* 48px */
padding: var(--space-5xl);      /* 64px */
```

### Border Radius
```css
border-radius: var(--radius-sm);    /* 6px - small elements */
border-radius: var(--radius-md);    /* 10px - inputs, buttons */
border-radius: var(--radius-lg);    /* 14px - cards */
border-radius: var(--radius-xl);    /* 18px - large cards */
border-radius: var(--radius-2xl);   /* 24px - hero sections */
border-radius: var(--radius-full);  /* 9999px - pills, badges */
```

### Shadows
```css
box-shadow: var(--shadow-sm);       /* Subtle depth */
box-shadow: var(--shadow-md);       /* Standard elevation */
box-shadow: var(--shadow-lg);       /* Cards, modals */
box-shadow: var(--shadow-xl);       /* Featured elements */

/* Gold glow (use sparingly) */
box-shadow: var(--glow-gold-sm);
box-shadow: var(--glow-gold-md);
```

### Max Width Containers
```css
max-width: var(--max-width-sm);     /* 400px - forms */
max-width: var(--max-width-md);     /* 600px - articles */
max-width: var(--max-width-lg);     /* 800px - dashboard */
max-width: var(--max-width-xl);     /* 1000px - wide content */
max-width: var(--max-width-2xl);    /* 1200px - full layouts */
```

### Layout Example
```vue
<template>
  <div class="page-container">
    <div class="content-wrapper">
      <BaseCard variant="glass">
        <h2 class="section-title">Content Title</h2>
        <p class="body-text">Content goes here...</p>
      </BaseCard>
    </div>
  </div>
</template>

<style scoped>
.page-container {
  min-height: 100vh;
  padding: var(--space-2xl);
}

.content-wrapper {
  max-width: var(--max-width-lg);
  margin: 0 auto;
}

/* Responsive */
@media (max-width: 768px) {
  .page-container {
    padding: var(--space-lg);
  }
}
</style>
```

---

## Animation Guidelines

### Transitions
```css
/* Standard transition for most interactions */
transition: var(--transition-base);     /* 250ms smooth */

/* Fast transition for micro-interactions */
transition: var(--transition-fast);     /* 150ms smooth */

/* Slow transition for large movements */
transition: var(--transition-slow);     /* 350ms smooth */
```

### Common Animations
```css
/* Fade in from bottom (page load) */
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-in {
  animation: fadeInUp 0.6s var(--ease-smooth);
}

/* Hover lift effect */
.hover-lift {
  transition: transform var(--duration-normal) var(--ease-smooth),
              box-shadow var(--duration-normal) var(--ease-smooth);
}

.hover-lift:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-xl);
}

/* Pulse animation (loading, attention) */
@keyframes pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.05); }
}

.pulse {
  animation: pulse 2s ease-in-out infinite;
}

/* Spinner */
@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.spinner {
  animation: spin 1s linear infinite;
}
```

### Accessibility: Reduced Motion
```css
/* Always include this */
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## Common Patterns

### Page Layout Pattern
```vue
<script setup lang="ts">
import BaseCard from '@/components/BaseCard.vue'
import BaseButton from '@/components/BaseButton.vue'
</script>

<template>
  <div class="page-view">
    <!-- Header -->
    <div class="header">
      <h1 class="brand-title">Page Title</h1>
      <BaseButton variant="ghost" size="small" @click="goBack">
        Back
      </BaseButton>
    </div>

    <!-- Main Content -->
    <BaseCard variant="glass" class="main-card">
      <h2 class="section-title">Section Title</h2>
      <p class="body-text">Content goes here...</p>
    </BaseCard>
  </div>
</template>

<style scoped>
.page-view {
  min-height: 100vh;
  padding: var(--space-2xl);
}

.header {
  max-width: var(--max-width-lg);
  margin: 0 auto var(--space-2xl);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.brand-title {
  font-family: var(--font-heading);
  font-size: var(--text-3xl);
  background: var(--gradient-gold);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.main-card {
  max-width: var(--max-width-lg);
  margin: 0 auto;
  animation: fadeInUp 0.6s var(--ease-smooth);
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.section-title {
  font-family: var(--font-heading);
  font-size: var(--text-2xl);
  color: var(--text-primary);
  margin-bottom: var(--space-xl);
}

.body-text {
  color: var(--text-secondary);
  line-height: var(--leading-normal);
}

/* Responsive */
@media (max-width: 768px) {
  .page-view {
    padding: var(--space-lg);
  }

  .header {
    flex-direction: column;
    gap: var(--space-md);
    text-align: center;
  }
}
</style>
```

### Form Pattern
```vue
<script setup lang="ts">
import { ref } from 'vue'
import BaseCard from '@/components/BaseCard.vue'
import BaseInput from '@/components/BaseInput.vue'
import BaseButton from '@/components/BaseButton.vue'
import BaseAlert from '@/components/BaseAlert.vue'

const formData = ref({
  name: '',
  email: '',
  message: ''
})

const loading = ref(false)
const success = ref(false)
const error = ref('')

async function handleSubmit() {
  loading.value = true
  try {
    // Your API call here
    success.value = true
  } catch (err) {
    error.value = err.message
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="form-container">
    <BaseCard variant="glass-intense" class="form-card">
      <h2 class="form-title">Contact Us</h2>

      <BaseAlert v-if="success" type="success">
        Message sent successfully!
      </BaseAlert>

      <BaseAlert v-if="error" type="error">
        {{ error }}
      </BaseAlert>

      <form @submit.prevent="handleSubmit">
        <BaseInput
          v-model="formData.name"
          label="Name"
          placeholder="Your name"
          required
        />

        <BaseInput
          v-model="formData.email"
          type="email"
          label="Email"
          placeholder="your@email.com"
          required
        />

        <BaseInput
          v-model="formData.message"
          type="textarea"
          label="Message"
          placeholder="Your message..."
          :rows="5"
          required
        />

        <BaseButton
          type="submit"
          variant="primary"
          size="large"
          full-width
          :disabled="loading"
        >
          {{ loading ? 'Sending...' : 'Send Message' }}
        </BaseButton>
      </form>
    </BaseCard>
  </div>
</template>

<style scoped>
.form-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--space-xl);
}

.form-card {
  max-width: 500px;
  width: 100%;
  animation: fadeInUp 0.6s var(--ease-smooth);
}

.form-title {
  font-family: var(--font-heading);
  font-size: var(--text-3xl);
  text-align: center;
  color: var(--text-primary);
  margin-bottom: var(--space-3xl);
  background: var(--gradient-gold);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

form {
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
}
</style>
```

### Grid Pattern (Cards)
```vue
<template>
  <div class="grid-container">
    <div class="grid">
      <BaseCard
        v-for="item in items"
        :key="item.id"
        variant="glass"
        hoverable
        class="grid-item"
      >
        <h3 class="item-title">{{ item.title }}</h3>
        <p class="item-description">{{ item.description }}</p>
      </BaseCard>
    </div>
  </div>
</template>

<style scoped>
.grid-container {
  max-width: var(--max-width-2xl);
  margin: 0 auto;
  padding: var(--space-2xl);
}

.grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: var(--space-2xl);
}

.grid-item {
  animation: fadeInUp 0.6s var(--ease-smooth);
  animation-fill-mode: both;
}

/* Stagger animations */
.grid-item:nth-child(1) { animation-delay: 0.1s; }
.grid-item:nth-child(2) { animation-delay: 0.2s; }
.grid-item:nth-child(3) { animation-delay: 0.3s; }

.item-title {
  font-family: var(--font-heading);
  font-size: var(--text-xl);
  color: var(--text-primary);
  margin-bottom: var(--space-md);
}

.item-description {
  color: var(--text-secondary);
  line-height: var(--leading-normal);
}

/* Responsive */
@media (max-width: 768px) {
  .grid {
    grid-template-columns: 1fr;
    gap: var(--space-xl);
  }
}
</style>
```

---

## Quick Reference

### Most Used CSS Variables
```css
/* Colors */
--bg-secondary          /* Card backgrounds */
--text-primary          /* Main text */
--text-secondary        /* Body text */
--gold-primary          /* Accents, buttons */
--border-color          /* Dividers */

/* Spacing */
--space-md              /* 12px - tight spacing */
--space-lg              /* 16px - standard spacing */
--space-xl              /* 24px - section spacing */
--space-2xl             /* 32px - large gaps */

/* Typography */
--font-heading          /* Playfair Display */
--font-body             /* Inter */
--text-base             /* 16px - default */
--text-xl               /* 20px - headings */

/* Layout */
--radius-md             /* 10px - buttons, inputs */
--radius-lg             /* 14px - cards */
--shadow-lg             /* Standard card shadow */
--transition-base       /* 250ms smooth */
```

### Component Import Shorthand
```vue
<script setup>
import BaseButton from '@/components/BaseButton.vue'
import BaseCard from '@/components/BaseCard.vue'
import BaseAlert from '@/components/BaseAlert.vue'
import BaseInput from '@/components/BaseInput.vue'
</script>
```

---

## Tips & Best Practices

1. **Consistency is Key** - Always use the design system variables
2. **Mobile First** - Design for mobile, then add desktop enhancements
3. **Accessibility** - Test with keyboard navigation and screen readers
4. **Performance** - Lazy load images and components when possible
5. **Dark Theme Only** - Don't add light mode support unless explicitly needed
6. **Gold Sparingly** - Use gold accents strategically, not everywhere
7. **Test Contrast** - Ensure text is readable (WCAG AA minimum)
8. **Smooth Transitions** - Keep animations subtle and purposeful
9. **Glass Effect** - Use backdrop blur for premium feel
10. **Trust Building** - Clear CTAs, visible security indicators, professional polish

---

## Getting Help

If you're unsure about a design decision:
1. Look at existing views (`LoginView`, `DashboardView`, etc.) for patterns
2. Check the `theme.css` file for available variables
3. Review this guide for component examples
4. Maintain the "quiet luxury" aesthetic - when in doubt, be subtle

**Remember:** The goal is premium, trustworthy, and elegant — not flashy or gimmicky.
