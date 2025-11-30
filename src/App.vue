<script setup lang="ts">
import { RouterView, useRoute } from 'vue-router'
import { computed } from 'vue'
import GradientBackground from './components/GradientBackground.vue'
import NavBar from './components/NavBar.vue'

const route = useRoute()

// Show navbar on authenticated pages (hide on guest/landing pages)
const showNavbar = computed(() => {
  const guestRoutes = ['/', '/login', '/auth/callback', '/auth/reset-password']
  return !guestRoutes.includes(route.path)
})
</script>

<template>
  <GradientBackground />
  <NavBar v-if="showNavbar" />
  <RouterView />
</template>

<style>
/* Import Premium Dark Theme */
@import './assets/theme.css';
@import './assets/fonts.css';

/* Global Reset */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

/* Dark Theme Base Styles */
html {
  background: var(--bg-primary);
}

body {
  font-family: var(--font-body);
  line-height: var(--leading-normal);
  color: var(--text-primary);
  background: var(--bg-primary);
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

#app {
  min-height: 100vh;
  position: relative;
}

/* Headings with Premium Font */
h1, h2, h3, h4, h5, h6 {
  font-family: var(--font-heading);
  font-weight: var(--font-semibold);
  color: var(--text-primary);
  line-height: var(--leading-tight);
}

/* Links */
a {
  color: var(--gold-primary);
  text-decoration: none;
  transition: var(--transition-fast);
}

a:hover {
  color: var(--gold-light);
}

/* Focus visible for accessibility */
:focus-visible {
  outline: 2px solid var(--gold-primary);
  outline-offset: 2px;
}
</style>
