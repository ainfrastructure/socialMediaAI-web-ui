<template>
  <nav class="navbar">
    <div class="navbar-container">
      <!-- Logo/Brand -->
      <router-link to="/playground" class="brand">
        <span class="brand-icon">✨</span>
        <span class="brand-text">AI Marketing</span>
      </router-link>

      <!-- Navigation Links -->
      <div class="nav-links">
        <router-link to="/playground" class="nav-link" active-class="active">
          <span class="nav-icon">🎨</span>
          <span class="nav-text">Playground</span>
        </router-link>

        <router-link to="/restaurants" class="nav-link" active-class="active">
          <span class="nav-icon">🔍</span>
          <span class="nav-text">Search Restaurants</span>
        </router-link>

        <router-link to="/saved-restaurants" class="nav-link" active-class="active">
          <span class="nav-icon">⭐</span>
          <span class="nav-text">Saved Restaurants</span>
        </router-link>
      </div>

      <!-- User Menu -->
      <div class="user-menu">
        <div v-if="authStore.user" class="user-info">
          <span class="user-email">{{ authStore.user.email }}</span>
          <button @click="handleLogout" class="logout-btn">Logout</button>
        </div>
        <router-link v-else to="/login" class="nav-link">
          <span class="nav-text">Login</span>
        </router-link>
      </div>
    </div>
  </nav>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const router = useRouter()
const authStore = useAuthStore()

const handleLogout = async () => {
  await authStore.logout()
  router.push('/login')
}
</script>

<style scoped>
.navbar {
  position: sticky;
  top: 0;
  z-index: 100;
  background: var(--bg-secondary);
  border-bottom: var(--border-width) solid var(--border-color);
  backdrop-filter: blur(var(--blur-lg));
}

.navbar-container {
  max-width: var(--max-width-2xl);
  margin: 0 auto;
  padding: var(--space-lg) var(--space-2xl);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-2xl);
}

/* Brand */
.brand {
  display: flex;
  align-items: center;
  gap: var(--space-md);
  text-decoration: none;
  transition: var(--transition-base);
}

.brand:hover {
  transform: translateY(-1px);
}

.brand-icon {
  font-size: var(--text-2xl);
}

.brand-text {
  font-family: var(--font-heading);
  font-size: var(--text-xl);
  font-weight: var(--font-bold);
  background: var(--gradient-gold);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

/* Navigation Links */
.nav-links {
  display: flex;
  align-items: center;
  gap: var(--space-lg);
  flex: 1;
  justify-content: center;
}

.nav-link {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  padding: var(--space-md) var(--space-lg);
  border-radius: var(--radius-md);
  text-decoration: none;
  color: var(--text-secondary);
  font-family: var(--font-body);
  font-size: var(--text-sm);
  font-weight: var(--font-medium);
  transition: var(--transition-base);
  border: 1px solid transparent;
}

.nav-link:hover {
  color: var(--text-primary);
  background: var(--bg-elevated);
  border-color: var(--border-color);
}

.nav-link.active {
  color: var(--gold-primary);
  background: var(--gold-subtle);
  border-color: var(--gold-primary);
}

.nav-icon {
  font-size: var(--text-lg);
}

.nav-text {
  white-space: nowrap;
}

/* User Menu */
.user-menu {
  display: flex;
  align-items: center;
  gap: var(--space-md);
}

.user-info {
  display: flex;
  align-items: center;
  gap: var(--space-md);
}

.user-email {
  color: var(--text-muted);
  font-size: var(--text-sm);
  display: none;
}

.logout-btn {
  padding: var(--space-sm) var(--space-lg);
  border-radius: var(--radius-md);
  border: var(--border-width) solid var(--border-color);
  background: transparent;
  color: var(--text-secondary);
  font-family: var(--font-body);
  font-size: var(--text-sm);
  font-weight: var(--font-medium);
  cursor: pointer;
  transition: var(--transition-base);
}

.logout-btn:hover {
  color: var(--gold-primary);
  border-color: var(--gold-primary);
  background: var(--gold-subtle);
}

/* Responsive */
@media (min-width: 768px) {
  .user-email {
    display: block;
  }
}

@media (max-width: 768px) {
  .navbar-container {
    padding: var(--space-md) var(--space-lg);
    gap: var(--space-lg);
  }

  .nav-links {
    gap: var(--space-sm);
  }

  .nav-link {
    padding: var(--space-sm) var(--space-md);
  }

  .nav-text {
    display: none;
  }

  .nav-icon {
    font-size: var(--text-xl);
  }

  .brand-text {
    display: none;
  }
}

/* Reduce motion */
@media (prefers-reduced-motion: reduce) {
  .brand:hover,
  .nav-link {
    transform: none;
  }
}
</style>
