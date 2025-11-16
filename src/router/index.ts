import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import LoginView from '../views/LoginView.vue'
import DashboardView from '../views/DashboardView.vue'
import PlansView from '../views/PlansView.vue'
import AuthCallbackView from '../views/AuthCallbackView.vue'
import ResetPasswordView from '../views/ResetPasswordView.vue'
import RestaurantSearchView from '../views/RestaurantSearchView.vue'
import PlaygroundView from '../views/PlaygroundView.vue'
import ConnectAccountsView from '../views/ConnectAccountsView.vue'
import FacebookCallbackView from '../views/FacebookCallbackView.vue'
import TestPostView from '../views/TestPostView.vue'
import SchedulerView from '../views/SchedulerView.vue'
import FavoritesView from '../views/FavoritesView.vue'
import ProfileView from '../views/ProfileView.vue'
import SavedRestaurantsView from '../views/SavedRestaurantsView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  scrollBehavior(to, _from, savedPosition) {
    // If there's a saved position (browser back/forward), use it
    if (savedPosition) {
      return savedPosition
    }
    // If navigating to a hash anchor, scroll to it
    if (to.hash) {
      return {
        el: to.hash,
        behavior: 'smooth',
      }
    }
    // Otherwise, scroll to top
    return { top: 0, behavior: 'smooth' }
  },
  routes: [
    {
      path: '/',
      redirect: '/dashboard',
    },
    {
      path: '/dashboard',
      name: 'dashboard',
      component: DashboardView,
      meta: { requiresAuth: true },
    },
    {
      path: '/login',
      name: 'login',
      component: LoginView,
      meta: { requiresGuest: true },
    },
    {
      path: '/auth/callback',
      name: 'auth-callback',
      component: AuthCallbackView,
    },
    {
      path: '/auth/facebook/callback',
      name: 'facebook-callback',
      component: FacebookCallbackView,
      meta: { requiresAuth: true },
    },
    {
      path: '/auth/reset-password',
      name: 'reset-password',
      component: ResetPasswordView,
    },
    {
      path: '/plans',
      name: 'plans',
      component: PlansView,
    },
    {
      path: '/restaurants',
      name: 'restaurants',
      component: RestaurantSearchView,
      meta: { requiresAuth: true },
    },
    {
      path: '/playground',
      name: 'playground',
      component: PlaygroundView,
      meta: { requiresAuth: true },
    },
    {
      path: '/connect-accounts',
      name: 'connect-accounts',
      component: ConnectAccountsView,
      meta: { requiresAuth: true },
    },
    {
      path: '/test-post',
      name: 'test-post',
      component: TestPostView,
      meta: { requiresAuth: true },
    },
    {
      path: '/scheduler',
      name: 'scheduler',
      component: SchedulerView,
      meta: { requiresAuth: true },
    },
    {
      path: '/favorites',
      name: 'favorites',
      component: FavoritesView,
      meta: { requiresAuth: true },
    },
    {
      path: '/profile',
      name: 'profile',
      component: ProfileView,
      meta: { requiresAuth: true },
    },
    {
      path: '/saved-restaurants',
      name: 'saved-restaurants',
      component: SavedRestaurantsView,
      meta: { requiresAuth: true },
    },
  ],
})

// Navigation guards
router.beforeEach(async (to, from, next) => {
  const authStore = useAuthStore()

  // Wait for auth state to be initialized
  await authStore.waitForInitialization()

  // Check if route requires authentication
  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    next('/login')
    return
  }

  // Check if route is for guests only (login/signup)
  if (to.meta.requiresGuest && authStore.isAuthenticated) {
    next('/dashboard')
    return
  }

  next()
})

export default router
