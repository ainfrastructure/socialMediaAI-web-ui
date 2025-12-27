/**
 * Centralized Video Prompt Modifiers Configuration
 *
 * IMPORTANT NOTE: Enhanced video-specific style modifiers have been moved to:
 * → /src/config/videoStyleModifiers.ts
 *
 * The new system uses cinematography-focused language and improved prompt structure.
 * For video generation in Easy Mode, use getVideoStyleInstruction() from videoStyleModifiers.ts.
 *
 * This file contains legacy prompt modifiers for backward compatibility and Advanced Mode.
 * Organized by post type: single dish, combo (2 dishes), and weekly menu.
 *
 * Usage:
 * - Import the helper functions (getVideoSinglePrompt, getVideoComboPrompt, getVideoWeeklyPrompt)
 * - Pass the style/layout key to get the corresponding prompt modifier
 *
 * Note: These prompts are appended to the base prompt to guide video generation style.
 */

// Video prompt modifiers for SINGLE dish posts
export const VIDEO_SINGLE_PROMPTS: Record<string, string> = {
  behindTheScenes: `CRITICAL: You MUST recreate the EXACT dish from the reference image. This is NOT optional.

MANDATORY REQUIREMENTS:
1. COPY EVERY SINGLE INGREDIENT visible in the reference - if you see lettuce, include lettuce. If you see sauce, include sauce. If you see pickles, include pickles. NOTHING can be removed or changed.
2. COPY the EXACT arrangement and stacking order of all components
3. COPY the EXACT proportions and quantities of each ingredient
4. The video must show the SAME dish, not a different dish

Cinematic behind-the-scenes video of this exact dish being prepared. Show cooking with steam, sizzling, motion. Kitchen background blurred. The final plated dish must be IDENTICAL to the reference image.`,

  cleanStrict: `CRITICAL: You MUST recreate the EXACT dish from the reference image. This is NOT optional.

MANDATORY REQUIREMENTS:
1. COPY EVERY SINGLE INGREDIENT visible in the reference - if you see lettuce, include lettuce. If you see sauce, include sauce. If you see pickles, include pickles. NOTHING can be removed or changed.
2. COPY the EXACT arrangement and stacking order of all components
3. COPY the EXACT proportions and quantities of each ingredient
4. The video must show the SAME dish, not a different dish

Professional studio video showing the exact dish from the reference. Add subtle camera movement - slow push-in or orbit. Clean background, professional lighting. The dish must be IDENTICAL to the reference image.`,

  zoomIn: `CRITICAL: You MUST recreate the EXACT dish from the reference image. This is NOT optional.

MANDATORY REQUIREMENTS:
1. COPY EVERY SINGLE INGREDIENT visible in the reference - if you see lettuce, include lettuce. If you see sauce, include sauce. If you see pickles, include pickles. NOTHING can be removed or changed.
2. COPY the EXACT arrangement and stacking order of all components
3. COPY the EXACT proportions and quantities of each ingredient
4. The video must show the SAME dish, not a different dish

Slow camera zoom revealing texture details of the exact dish from the reference - steam rising, sauce glistening. The dish must be IDENTICAL to the reference image.`,

  oneBite: `CRITICAL: You MUST recreate the EXACT dish from the reference image. This is NOT optional.

MANDATORY REQUIREMENTS:
1. COPY EVERY SINGLE INGREDIENT visible in the reference - if you see lettuce, include lettuce. If you see sauce, include sauce. If you see pickles, include pickles. NOTHING can be removed or changed.
2. COPY the EXACT arrangement and stacking order of all components
3. COPY the EXACT proportions and quantities of each ingredient
4. The video must show the SAME dish, not a different dish

Video showing a utensil entering frame and lifting a bite from the exact dish shown in the reference. The dish must be IDENTICAL to the reference image before and during the bite.`,

  studioShot: `CRITICAL: You MUST recreate the EXACT dish from the reference image. This is NOT optional.

MANDATORY REQUIREMENTS:
1. COPY EVERY SINGLE INGREDIENT visible in the reference - if you see lettuce, include lettuce. If you see sauce, include sauce. If you see pickles, include pickles. NOTHING can be removed or changed.
2. COPY the EXACT arrangement and stacking order of all components
3. COPY the EXACT proportions and quantities of each ingredient
4. The video must show the SAME dish, not a different dish

360-degree slow orbit around the exact dish from the reference. Professional lighting. The dish must be IDENTICAL to the reference image from all angles.`,

  infographic: `CRITICAL: You MUST recreate the EXACT dish from the reference image. This is NOT optional.

MANDATORY REQUIREMENTS:
1. COPY EVERY SINGLE INGREDIENT visible in the reference - if you see lettuce, include lettuce. If you see sauce, include sauce. If you see pickles, include pickles. NOTHING can be removed or changed.
2. COPY the EXACT arrangement and stacking order of all components
3. COPY the EXACT proportions and quantities of each ingredient
4. The video must show the SAME dish, not a different dish

Dynamic video showing this exact dish being assembled - ingredients come together into the final presentation. The assembled dish must be IDENTICAL to the reference image.`,

  placeOnTable: `CRITICAL: You MUST recreate the EXACT dish from the reference image. This is NOT optional.

MANDATORY REQUIREMENTS:
1. COPY EVERY SINGLE INGREDIENT visible in the reference - if you see lettuce, include lettuce. If you see sauce, include sauce. If you see pickles, include pickles. NOTHING can be removed or changed.
2. COPY the EXACT arrangement and stacking order of all components
3. COPY the EXACT proportions and quantities of each ingredient
4. The video must show the SAME dish, not a different dish

Video showing hands placing the exact dish from the reference onto a table. The dish must be IDENTICAL to the reference image.`,

  custom: '', // User provides their own prompt
}

// Video prompt modifiers for COMBO posts (2 dishes)
export const VIDEO_COMBO_PROMPTS: Record<string, string> = {
  behindTheScenes: `CRITICAL: This is a COMBO post featuring EXACTLY 2 dishes. Both must be visible and equally prominent.

MANDATORY REQUIREMENTS:
1. Show BOTH dishes clearly - neither should be hidden or obscured
2. Each dish must match its reference image EXACTLY (all ingredients, plating, portions)
3. Arrange the 2 dishes side-by-side or in a complementary composition
4. Maintain equal visual weight for both items
5. The video must showcase this as a bundle/combo offer

Cinematic behind-the-scenes video showing BOTH dishes being prepared together. Steam, motion, kitchen background. Both dishes must be IDENTICAL to their reference images.`,

  cleanStrict: `CRITICAL: This is a COMBO post featuring EXACTLY 2 dishes. Both must be visible and equally prominent.

MANDATORY REQUIREMENTS:
1. Show BOTH dishes clearly - neither should be hidden or obscured
2. Each dish must match its reference image EXACTLY (all ingredients, plating, portions)
3. Arrange the 2 dishes side-by-side or in a complementary composition
4. Maintain equal visual weight for both items
5. The video must showcase this as a bundle/combo offer

Professional studio video showing BOTH dishes together. Subtle camera movement captures both items. Clean background, professional lighting. Both dishes must be IDENTICAL to their reference images.`,

  zoomIn: `CRITICAL: This is a COMBO post featuring EXACTLY 2 dishes. Both must be visible and equally prominent.

MANDATORY REQUIREMENTS:
1. Show BOTH dishes clearly - neither should be hidden or obscured
2. Each dish must match its reference image EXACTLY (all ingredients, plating, portions)
3. Arrange the 2 dishes side-by-side or in a complementary composition
4. Maintain equal visual weight for both items
5. The video must showcase this as a bundle/combo offer

Camera slowly reveals BOTH dishes together, showcasing textures and details of each. Both dishes must be IDENTICAL to their reference images.`,

  oneBite: `CRITICAL: This is a COMBO post featuring EXACTLY 2 dishes. Both must be visible and equally prominent.

MANDATORY REQUIREMENTS:
1. Show BOTH dishes clearly - neither should be hidden or obscured
2. Each dish must match its reference image EXACTLY (all ingredients, plating, portions)
3. Arrange the 2 dishes side-by-side or in a complementary composition
4. Maintain equal visual weight for both items
5. The video must showcase this as a bundle/combo offer

Video showing utensils taking bites from BOTH dishes, showcasing the combo. Both dishes visible throughout. Both dishes must be IDENTICAL to their reference images.`,

  studioShot: `CRITICAL: This is a COMBO post featuring EXACTLY 2 dishes. Both must be visible and equally prominent.

MANDATORY REQUIREMENTS:
1. Show BOTH dishes clearly - neither should be hidden or obscured
2. Each dish must match its reference image EXACTLY (all ingredients, plating, portions)
3. Arrange the 2 dishes side-by-side or in a complementary composition
4. Maintain equal visual weight for both items
5. The video must showcase this as a bundle/combo offer

360-degree orbit showing BOTH dishes together from all angles. Professional lighting. Both dishes must be IDENTICAL to their reference images.`,

  infographic: `CRITICAL: This is a COMBO post featuring EXACTLY 2 dishes. Both must be visible and equally prominent.

MANDATORY REQUIREMENTS:
1. Show BOTH dishes clearly - neither should be hidden or obscured
2. Each dish must match its reference image EXACTLY (all ingredients, plating, portions)
3. Arrange the 2 dishes side-by-side or in a complementary composition
4. Maintain equal visual weight for both items
5. The video must showcase this as a bundle/combo offer

Dynamic video showing BOTH dishes being assembled side-by-side. Ingredients come together for both items. Both dishes must be IDENTICAL to their reference images.`,

  custom: '', // User provides their own prompt
}

// Video prompt modifiers for WEEKLY MENU posts (5 or 7 dishes)
// Note: These use layout names instead of style names
export const VIDEO_WEEKLY_PROMPTS: Record<string, string> = {
  featuredGrid: `CRITICAL: This is a WEEKLY MENU post featuring multiple dishes for different days.

MANDATORY REQUIREMENTS:
1. Show multiple dishes in an appealing arrangement
2. Create a sense of variety and abundance across the week
3. Emphasize the weekly menu concept visually
4. Professional restaurant presentation

Video showcasing a week's worth of delicious dishes. Show one featured dish prominently with others visible around it in a grid. Professional kitchen setting with steam and motion. Conveys weekly variety and quality.`,

  calendarGrid: `CRITICAL: This is a WEEKLY MENU post featuring multiple dishes for different days.

MANDATORY REQUIREMENTS:
1. Show multiple dishes in an appealing arrangement
2. Create a sense of variety and abundance across the week
3. Emphasize the weekly menu concept visually
4. Professional restaurant presentation

Video panning across multiple dishes arranged in a calendar-style grid. Each dish represents a different day. Professional setting showcasing weekly variety.`,

  verticalStack: `CRITICAL: This is a WEEKLY MENU post featuring multiple dishes for different days.

MANDATORY REQUIREMENTS:
1. Show multiple dishes in an appealing arrangement
2. Create a sense of variety and abundance across the week
3. Emphasize the weekly menu concept visually
4. Professional restaurant presentation

Video revealing dishes stacked vertically or shown in sequence, one after another. Each dish represents a different day of the week. Professional presentation emphasizing variety.`,

  gridWithHeader: `CRITICAL: This is a WEEKLY MENU post featuring multiple dishes for different days.

MANDATORY REQUIREMENTS:
1. Show multiple dishes in an appealing arrangement
2. Create a sense of variety and abundance across the week
3. Emphasize the weekly menu concept visually
4. Professional restaurant presentation

Video showcasing dishes in a structured grid layout. Camera pans across the weekly offerings. Professional setting with excellent lighting highlighting each dish.`,

  custom: '', // User provides their own prompt
}

/**
 * Helper Functions
 * Use these to get prompts in a type-safe way
 */

export function getVideoSinglePrompt(style: string): string | undefined {
  return VIDEO_SINGLE_PROMPTS[style]
}

export function getVideoComboPrompt(style: string): string | undefined {
  return VIDEO_COMBO_PROMPTS[style]
}

export function getVideoWeeklyPrompt(layout: string): string | undefined {
  return VIDEO_WEEKLY_PROMPTS[layout]
}
