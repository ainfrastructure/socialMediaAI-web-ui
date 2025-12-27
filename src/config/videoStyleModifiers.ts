/**
 * Video-Specific Style Modifiers
 *
 * Enhanced cinematography definitions for video generation.
 * Separate from image modifiers to use proper video/motion terminology
 * instead of static photography language.
 */

export interface VideoStyleModifier {
  id: string
  cinematography: string // Camera work and technique
  cameraMovement: string // Specific movements
  pacing: string // Temporal rhythm
  lighting: string // Light behavior and dynamics
  temporalProgression: string // How video evolves over time
  atmosphere: string // Overall mood and feel
  fidelityNote: string // Brief reference image note
}

export const VIDEO_STYLE_MODIFIERS: Record<string, VideoStyleModifier> = {
  behindTheScenes: {
    id: 'behindTheScenes',
    cinematography:
      'Dynamic handheld camera work with intentional movement. Natural shake and reframing captures energy of active kitchen. Shallow focus with rack-focus transitions between cooking action and finished dish.',

    cameraMovement:
      'Starts wide on kitchen activity, pushes in to close-up of cooking process (sizzling, steaming), then reveals finished plated dish. Subtle whip-pans between ingredients and final presentation.',

    pacing: 'Energetic, quick transitions between preparation steps. Fast-paced with bursts of activity.',

    lighting:
      'Warm practical kitchen lighting with natural shadows. Steam creates atmospheric diffusion. Light catches glistening surfaces and rising steam.',

    temporalProgression:
      'Opens with raw ingredients or cooking action → transitions through preparation stages with motion and heat → concludes with fully plated dish',

    atmosphere:
      'Authentic kitchen energy - alive, warm, bustling. Conveys craft and expertise.',

    fidelityNote: 'Final plated dish matches reference image composition and ingredients.'
  },

  cleanStrict: {
    id: 'cleanStrict',
    cinematography:
      'Locked-off tripod shot with minimal camera movement. Professional studio setup with controlled lighting. Smooth, deliberate camera motion if any (slow push-in or gentle rotation).',

    cameraMovement:
      'Static framing or slow motorized push-in to reveal dish details. No handheld shake. Perfect stability throughout.',

    pacing: 'Calm, deliberate, measured. Allows viewer to appreciate details without rush.',

    lighting:
      'Three-point studio lighting setup. Clean key light with soft fill. Controlled shadows. Highlights textures without harsh contrast.',

    temporalProgression:
      'Dish revealed gradually through controlled camera movement or lighting changes → final reveal matches reference exactly',

    atmosphere:
      'Professional, polished, restaurant-quality presentation. Clean and inviting.',

    fidelityNote: 'Dish composition and plating exactly match reference image.'
  },

  zoomIn: {
    id: 'zoomIn',
    cinematography:
      'Smooth motorized zoom or dolly push-in. Starts wide establishing shot, progressively tightens to extreme macro detail. Reveals texture layers as camera approaches.',

    cameraMovement:
      'Slow, deliberate forward movement. Consistent speed throughout. Final frame: extreme close-up of most appetizing detail (glistening sauce, crispy texture, steam).',

    pacing: 'Languid, contemplative. One continuous motion without cuts.',

    lighting:
      'Studio key light with controlled fill. As camera zooms, light reveals micro-textures: moisture, sheen, steam particles catching backlight.',

    temporalProgression:
      'Wide shot showing full dish context → continuous forward motion revealing increasing detail → ends at macro scale showing texture invisible to naked eye',

    atmosphere: 'Seductive, intimate, sensory. Invites viewer into the details.',

    fidelityNote: 'Dish composition matches reference throughout zoom progression.'
  },

  oneBite: {
    id: 'oneBite',
    cinematography:
      'Focused framing on the dish with anticipation of interaction. Camera locked or gently drifting. Shallow depth of field isolates subject.',

    cameraMovement:
      'Static or slow drift around dish. Camera follows utensil motion as it enters frame, selects a perfect bite, lifts it toward viewer.',

    pacing: 'Deliberate, anticipatory build-up. Pause at perfect moment when bite is lifted.',

    lighting:
      'Natural or warm practical lighting. Backlight catches steam. Light shifts subtly as utensil moves through frame.',

    temporalProgression:
      'Pristine dish displayed → utensil enters frame → perfect bite selected and lifted → moment of anticipation before tasting',

    atmosphere: 'Inviting, tempting, interactive. Viewer imagines the taste and texture.',

    fidelityNote: 'Dish matches reference before bite is taken.'
  },

  studioShot: {
    id: 'studioShot',
    cinematography:
      'Controlled 360-degree slow orbit or turntable rotation. Professional studio lighting rig. Camera or subject rotates revealing all angles.',

    cameraMovement:
      'Smooth circular motion around dish (camera orbiting OR dish on turntable). Consistent rotation speed. Shows dish from multiple perspectives.',

    pacing:
      'Smooth, hypnotic rotation. Meditative quality as dish reveals itself from all sides.',

    lighting:
      'Professional multi-light setup. Key, fill, rim lights create dimension. Highlights shift and play across surfaces as angle changes.',

    temporalProgression:
      'Front view → side profiles → back view → return to front, completing full 360° rotation',

    atmosphere: 'Premium, professional, gallery-quality presentation. Editorial sophistication.',

    fidelityNote: 'Dish matches reference from all viewing angles.'
  },

  infographic: {
    id: 'infographic',
    cinematography:
      'Clean top-down or 45-degree view. Organized spatial layout. Camera static or slow pullback revealing assembly process.',

    cameraMovement:
      'Overhead locked shot OR slow pullback as components assemble. Reveals construction from ingredients to finished dish.',

    pacing: 'Methodical, step-by-step rhythm. Each ingredient appears deliberately.',

    lighting:
      'Bright, even, shadowless lighting. Clinical clarity. Each component clearly visible.',

    temporalProgression:
      'Deconstructed ingredients arranged → components brought together in sequence → final assembled dish matches reference',

    atmosphere: 'Educational, systematic, satisfying construction. ASMR assembly quality.',

    fidelityNote: 'Final assembled dish matches reference composition.'
  },

  placeOnTable: {
    id: 'placeOnTable',
    cinematography:
      'Eye-level or slightly elevated view of table surface. Camera static, anticipating arrival of dish. Hands enter frame carrying plate.',

    cameraMovement:
      'Locked camera. All motion comes from hands placing dish. Slight settle or adjustment after placement.',

    pacing: 'Calm arrival. Moment of presentation. Brief pause after placement to appreciate.',

    lighting:
      'Natural restaurant or dining lighting. Warm, inviting ambiance. Light catches dish as it settles into position.',

    temporalProgression:
      'Empty table or table setting → hands enter frame carrying dish → gentle placement → slight adjustment → final reveal',

    atmosphere:
      'Welcoming, service moment, restaurant experience. Anticipation of enjoying.',

    fidelityNote: 'Placed dish matches reference image.'
  }
}

/**
 * Get complete style instruction by combining all style elements
 */
export function getVideoStyleInstruction(styleId: string): string {
  const style = VIDEO_STYLE_MODIFIERS[styleId]
  if (!style) return ''

  return `${style.cinematography} ${style.cameraMovement} ${style.pacing} ${style.lighting} ${style.temporalProgression} ${style.atmosphere}`
}

/**
 * Get fidelity note for a specific style
 */
export function getVideoFidelityNote(styleId: string): string {
  const style = VIDEO_STYLE_MODIFIERS[styleId]
  return style?.fidelityNote || 'Final dish matches reference image composition and ingredients.'
}
