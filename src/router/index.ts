import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import LoginView from '../views/LoginView.vue'
import DashboardView from '../views/DashboardView.vue'
import PlansView from '../views/PlansView.vue'
import AuthCallbackView from '../views/AuthCallbackView.vue'
import ResetPasswordView from '../views/ResetPasswordView.vue'
import PlaygroundView from '../views/PlaygroundView.vue'
import ConnectAccountsView from '../views/ConnectAccountsView.vue'
import FacebookCallbackView from '../views/FacebookCallbackView.vue'
import TestPostView from '../views/TestPostView.vue'
import SchedulerView from '../views/SchedulerView.vue'
import PostsView from '../views/PostsView.vue'
import ProfileView from '../views/ProfileView.vue'
import OnboardingView from '../views/OnboardingView.vue'
import ContentHubView from '../views/ContentHubView.vue'
import ContentCreateView from '../views/ContentCreateView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  scrollBehavior(to, _from, savedPosition) {
    return new Promise((resolve) => {
      // If there's a saved position (browser back/forward), use it
      if (savedPosition) {
        setTimeout(() => {
          resolve(savedPosition)
        }, 100)
        return
      }

      // If navigating to a hash anchor, scroll to it
      if (to.hash) {
        setTimeout(() => {
          resolve({
            el: to.hash,
            behavior: 'smooth',
          })
        }, 100)
        return
      }

      // Otherwise, scroll to top
      // Use setTimeout to ensure DOM is ready
      setTimeout(() => {
        resolve({ top: 0, left: 0, behavior: 'smooth' })
      }, 0)
    })
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
      path: '/onboarding',
      name: 'onboarding',
      component: OnboardingView,
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
      path: '/content',
      name: 'content',
      component: ContentHubView,
      meta: { requiresAuth: true },
    },
    {
      path: '/content/create',
      name: 'content-create',
      component: ContentCreateView,
      meta: { requiresAuth: true },
    },
    {
      path: '/cook-up',
      redirect: '/content',
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
      path: '/posts',
      redirect: '/content',
    },
    {
      path: '/profile',
      name: 'profile',
      component: ProfileView,
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
