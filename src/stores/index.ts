// Barrel export for all Pinia stores
export { useAuthStore } from './auth'
export { useFacebookStore } from './facebook'
export { useInstagramStore } from './instagram'
export { useLocaleStore } from './locale'
export { usePreferencesStore } from './preferences'
export { usePostsStore } from './posts'
export { useRestaurantsStore } from './restaurants'
export { useGenerationStore } from './generation'

// Re-export types from stores
export type { ScheduledPost, PostFilters } from './posts'
export type { GeneratedPostContent, VideoOptions, StickerOptions, LogoOptions } from './generation'

// Re-export types from services
export type { SavedRestaurant } from '../services/restaurantService'
