<script setup lang="ts">
import { RouterView } from 'vue-router'
import GradientBackground from './components/GradientBackground.vue'
</script>

<template>
  <GradientBackground />
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
  overflow-x: hidden;
}

body {
  font-family: var(--font-body);
  line-height: var(--leading-normal);
  color: var(--text-primary);
  background: var(--bg-primary);
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  overflow-x: hidden;
  width: 100%;
  max-width: 100vw;
}

#app {
  min-height: 100vh;
  min-height: 100dvh;
  position: relative;
  overflow-x: hidden;
  width: 100%;
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
