import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import LoginView from '../views/LoginView.vue'
import PlansView from '../views/PlansView.vue'
import AuthCallbackView from '../views/AuthCallbackView.vue'
import ResetPasswordView from '../views/ResetPasswordView.vue'
import RestaurantSearchView from '../views/RestaurantSearchView.vue'
import SavedRestaurantsView from '../views/SavedRestaurantsView.vue'
import PlaygroundView from '../views/PlaygroundView.vue'
import SchedulerView from '../views/SchedulerView.vue'
import FavoritesView from '../views/FavoritesView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      redirect: '/playground',
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
      path: '/saved-restaurants',
      name: 'saved-restaurants',
      component: SavedRestaurantsView,
      meta: { requiresAuth: true },
    },
    {
      path: '/playground',
      name: 'playground',
      component: PlaygroundView,
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
    next('/playground')
    return
  }

  next()
})

export default router
