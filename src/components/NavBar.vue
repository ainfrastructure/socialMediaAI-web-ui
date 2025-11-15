<template>
  <nav class="navbar">
    <div class="navbar-container">
      <!-- Logo/Brand -->
      <router-link to="/dashboard" class="brand">
        <img src="../assets/socialchef_logo.svg" alt="SocialChef Logo" class="brand-logo" />
        <span class="brand-text">SocialChef</span>
      </router-link>

      <!-- Navigation Links -->
      <div class="nav-links">
        <router-link to="/playground" class="nav-link" active-class="active">
          Cook Up
        </router-link>

        <router-link to="/favorites" class="nav-link" active-class="active">
          Posts
        </router-link>

        <router-link to="/scheduler" class="nav-link" active-class="active">
          Calendar
        </router-link>
      </div>

      <!-- User Menu -->
      <div class="user-menu">
        <BurgerMenu v-if="authStore.user" />
        <router-link v-else to="/login" class="nav-link login-link">
          Login
        </router-link>
      </div>
    </div>
  </nav>
</template>

<script setup lang="ts">
import { useAuthStore } from '../stores/auth'
import BurgerMenu from './BurgerMenu.vue'

const authStore = useAuthStore()
</script>

<style scoped>
.navbar {
  position: sticky;
  top: 0;
  z-index: 100;
  background: rgba(10, 10, 10, 0.85);
  border-bottom: 1px solid rgba(212, 175, 55, 0.15);
  backdrop-filter: blur(20px);
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.4);
}

.navbar-container {
  max-width: var(--max-width-2xl);
  margin: 0 auto;
  padding: var(--space-lg) var(--space-2xl);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-3xl);
}

/* Brand */
.brand {
  display: flex;
  align-items: center;
  gap: var(--space-md);
  text-decoration: none;
  transition: var(--transition-base);
  position: relative;
}

.brand-logo {
  height: 40px;
  width: auto;
  transition: var(--transition-base);
}

.brand::after {
  content: '';
  position: absolute;
  bottom: -4px;
  left: 0;
  width: 0;
  height: 2px;
  background: var(--gradient-gold);
  transition: width 0.3s ease;
}

.brand:hover::after {
  width: 100%;
}

.brand-text {
  font-family: var(--font-heading);
  font-size: var(--text-2xl);
  font-weight: var(--font-bold);
  background: var(--gradient-gold);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  letter-spacing: 0.02em;
}

/* Navigation Links */
.nav-links {
  display: flex;
  align-items: center;
  gap: var(--space-xs);
  flex: 1;
  justify-content: center;
}

.nav-link {
  position: relative;
  padding: var(--space-md) var(--space-xl);
  text-decoration: none;
  color: var(--text-secondary);
  font-family: var(--font-body);
  font-size: var(--text-base);
  font-weight: var(--font-semibold);
  transition: var(--transition-base);
  letter-spacing: 0.02em;
  white-space: nowrap;
}

.nav-link::before {
  content: '';
  position: absolute;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 0;
  height: 2px;
  background: var(--gradient-gold);
  transition: width 0.3s ease;
}

.nav-link:hover {
  color: var(--gold-light);
}

.nav-link:hover::before {
  width: 60%;
}

.nav-link.active {
  color: var(--gold-primary);
}

.nav-link.active::before {
  width: 80%;
}

/* User Menu */
.user-menu {
  display: flex;
  align-items: center;
  gap: var(--space-lg);
}

.login-link {
  padding: var(--space-md) var(--space-xl);
  border-radius: var(--radius-full);
  border: 1px solid rgba(212, 175, 55, 0.3);
  color: var(--gold-primary);
  font-weight: var(--font-semibold);
  letter-spacing: 0.05em;
  text-transform: uppercase;
}

.login-link:hover {
  background: var(--gradient-gold);
  color: var(--text-on-gold);
  border-color: transparent;
  box-shadow: 0 4px 12px rgba(212, 175, 55, 0.3);
  transform: translateY(-1px);
}

.login-link::before {
  display: none;
}

/* Responsive */
@media (max-width: 1024px) {
  .nav-links {
    gap: 0;
  }

  .nav-link {
    padding: var(--space-md) var(--space-lg);
    font-size: var(--text-sm);
  }
}

@media (max-width: 768px) {
  .navbar-container {
    padding: var(--space-md) var(--space-lg);
    gap: var(--space-lg);
  }

  .brand-logo {
    height: 32px;
  }

  .brand-text {
    font-size: var(--text-xl);
  }

  .nav-links {
    gap: 0;
  }

  .nav-link {
    padding: var(--space-sm) var(--space-md);
    font-size: 0.65rem;
  }

  .login-link {
    padding: var(--space-sm) var(--space-md);
    font-size: 0.65rem;
  }
}

/* Reduce motion */
@media (prefers-reduced-motion: reduce) {
  .brand::after,
  .nav-link::before,
  .login-link {
    transition: none;
  }
}
</style>
