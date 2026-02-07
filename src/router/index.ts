import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../stores/auth'

// Lazy load views for better code splitting
const LandingView = () => import('../views/LandingView.vue')
const LoginView = () => import('../views/LoginView.vue')
const DashboardView = () => import('../views/DashboardView.vue')
const PlansView = () => import('../views/PlansView.vue')
const AuthCallbackView = () => import('../views/AuthCallbackView.vue')
const ConnectAccountsView = () => import('../views/ConnectAccountsView.vue')
const FacebookCallbackView = () => import('../views/FacebookCallbackView.vue')
const InstagramCallbackView = () => import('../views/InstagramCallbackView.vue')
const TikTokCallbackView = () => import('../views/TikTokCallbackView.vue')
const TwitterCallbackView = () => import('../views/TwitterCallbackView.vue')
const LinkedInCallbackView = () => import('../views/LinkedInCallbackView.vue')
const TestPostView = () => import('../views/TestPostView.vue')
const SchedulerView = () => import('../views/SchedulerView.vue')
const ProfileView = () => import('../views/ProfileView.vue')
const BrandsView = () => import('../views/BrandsView.vue')
const PostsView = () => import('../views/PostsView.vue')
const PostsCreateView = () => import('../views/PostsCreateView.vue')
const PrivacyPolicyView = () => import('../views/PrivacyPolicyView.vue')
const TermsView = () => import('../views/TermsView.vue')
const DeleteAccountView = () => import('../views/DeleteAccountView.vue')
const GoodbyeView = () => import('../views/GoodbyeView.vue')
const AnalyticsView = () => import('../views/AnalyticsView.vue')
const ReferralLandingView = () => import('../views/ReferralLandingView.vue')

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
      name: 'landing',
      component: LandingView,
      // No requiresGuest - authenticated users can view landing page
    },
    {
      path: '/landing',
      redirect: '/',
    },
    {
      path: '/dashboard',
      name: 'dashboard',
      component: DashboardView,
      meta: { requiresAuth: true, requiresSubscription: true },
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
      path: '/auth/instagram/callback',
      name: 'instagram-callback',
      component: InstagramCallbackView,
      meta: { requiresAuth: true },
    },
    {
      path: '/auth/tiktok/callback',
      name: 'tiktok-callback',
      component: TikTokCallbackView,
      meta: { requiresAuth: true },
    },
    {
      path: '/auth/twitter/callback',
      name: 'twitter-callback',
      component: TwitterCallbackView,
      meta: { requiresAuth: true },
    },
    {
      path: '/auth/linkedin/callback',
      name: 'linkedin-callback',
      component: LinkedInCallbackView,
      meta: { requiresAuth: true },
    },
    {
      path: '/plans',
      name: 'plans',
      component: PlansView,
    },
    {
      path: '/posts',
      name: 'posts',
      component: PostsView,
      meta: { requiresAuth: true, requiresSubscription: true },
    },
    {
      path: '/posts/create',
      name: 'posts-create',
      component: PostsCreateView,
      meta: { requiresAuth: true, requiresSubscription: true },
    },
    {
      path: '/content',
      redirect: '/posts',
    },
    {
      path: '/content/create',
      redirect: '/posts/create',
    },
    {
      path: '/cook-up',
      redirect: '/posts',
    },
    {
      path: '/connect-accounts',
      name: 'connect-accounts',
      component: ConnectAccountsView,
      meta: { requiresAuth: true, requiresSubscription: true },
    },
    {
      path: '/test-post',
      name: 'test-post',
      component: TestPostView,
      meta: { requiresAuth: true, requiresSubscription: true },
    },
    {
      path: '/scheduler',
      name: 'scheduler',
      component: SchedulerView,
      meta: { requiresAuth: true, requiresSubscription: true },
    },
    {
      path: '/analytics',
      name: 'analytics',
      component: AnalyticsView,
      meta: { requiresAuth: true, requiresSubscription: true },
    },
    {
      path: '/profile',
      name: 'profile',
      component: ProfileView,
      meta: { requiresAuth: true },
    },
    {
      path: '/brands',
      name: 'brands',
      component: BrandsView,
      meta: { requiresAuth: true, requiresSubscription: true },
    },
    {
      path: '/privacy-policy',
      name: 'privacy-policy',
      component: PrivacyPolicyView,
    },
    {
      path: '/terms',
      name: 'terms',
      component: TermsView,
    },
    {
      path: '/delete-me',
      name: 'delete-account',
      component: DeleteAccountView,
      meta: { requiresAuth: true },
    },
    {
      path: '/goodbye',
      name: 'goodbye',
      component: GoodbyeView,
    },
    {
      path: '/join',
      name: 'referral-landing',
      component: ReferralLandingView,
      // Public route - no auth required
    },
    {
      path: '/invite',
      redirect: '/join',
    },
  ],
})

// Navigation guards
router.beforeEach(async (to, from, next) => {
  const authStore = useAuthStore()

  // Wait for auth initialization on protected, guest-only, or subscription-required routes
  if (to.meta.requiresAuth || to.meta.requiresGuest || to.meta.requiresSubscription) {
    await authStore.waitForInitialization()
  }

  // Check if route requires authentication
  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    next('/login')
    return
  }

  // Check if route requires subscription (only when authenticated)
  if (to.meta.requiresSubscription && authStore.isAuthenticated && !authStore.hasActiveSubscription) {
    next('/plans')
    return
  }

  // Check if route is for guests only (login/signup)
  if (to.meta.requiresGuest && authStore.isAuthenticated) {
    // Redirect based on subscription status
    if (authStore.hasActiveSubscription) {
      next('/dashboard')
    } else {
      next('/plans')
    }
    return
  }

  next()
})

export default router
