/**
 * Prompt Helper Utilities
 *
 * Utilities for processing and transforming prompts between
 * image and video generation contexts.
 */

/**
 * Extract dish description from image prompt, removing photography-specific terminology
 *
 * Image prompts contain camera specs (f/2.8, shallow DOF, angles, lenses) that are
 * irrelevant for video generation. This function extracts just the dish description
 * and visual qualities while removing static photography language.
 *
 * @param imagePrompt - Full image generation prompt with photography terms
 * @returns Clean dish description suitable for video generation
 *
 * @example
 * Input: "A vibrant 45-degree angle shot of burger. f/2.8, shallow DOF, 8k"
 * Output: "A vibrant burger"
 */
export function extractDishDescription(imagePrompt: string): string {
  let cleaned = imagePrompt

  // Remove complete camera specification phrases (handle context to avoid fragments)
  cleaned = cleaned.replace(/,?\s*shot\s+with\s+a\s+\d+mm\s+lens\s+at\s+f\/\d+\.?\d*\s+with\s+shallow\s+DOF/gi, '')
  cleaned = cleaned.replace(/,?\s*shot\s+with\s+a\s+\d+mm\s+lens\s+at\s+f\/\d+\.?\d*/gi, '')
  cleaned = cleaned.replace(/,?\s*at\s+f\/\d+\.?\d*\s+with\s+shallow\s+DOF/gi, '')
  cleaned = cleaned.replace(/,?\s*with\s+a\s+\d+mm\s+lens/gi, '')
  cleaned = cleaned.replace(/,?\s*shot\s+on\s+\w+/gi, '')

  // Remove standalone camera specs
  cleaned = cleaned.replace(/,?\s*f\/\d+\.?\d*/gi, '')
  cleaned = cleaned.replace(/,?\s*shallow\s+DOF/gi, '')
  cleaned = cleaned.replace(/,?\s*\d+mm\s+lens/gi, '')

  // Remove resolution and quality terms
  cleaned = cleaned.replace(/,?\s*high-resolution\s+\d+k\s+image(\s+of)?/gi, '')
  cleaned = cleaned.replace(/,?\s*\d+k\s+(resolution|detail|image)/gi, '')
  cleaned = cleaned.replace(/,?\s*rendered\s+in\s+\d+k(\s+detail)?/gi, '')

  // Remove angle specifications with context
  cleaned = cleaned.replace(/,?\s*a\s+shallow\s+\d+-degree\s+angle\s+showcases/gi, ', showcasing')
  cleaned = cleaned.replace(/,?\s*\d+-degree\s+angle\s+shot(\s+of)?/gi, '')
  cleaned = cleaned.replace(/,?\s*\d+-degree\s+angle/gi, '')

  // Remove camera angle terms
  cleaned = cleaned.replace(/,?\s*close-up\s+(shot|view|angle)(\s+of)?/gi, '')
  cleaned = cleaned.replace(/,?\s*flat\s+lay(\s+of)?/gi, '')
  cleaned = cleaned.replace(/,?\s*overhead\s+(shot|view|angle)(\s+of)?/gi, '')
  cleaned = cleaned.replace(/,?\s*bird's\s+eye\s+(view|shot)(\s+of)?/gi, '')
  cleaned = cleaned.replace(/,?\s*eye-level\s+(shot|view|angle)(\s+of)?/gi, '')

  // Remove composition terms
  cleaned = cleaned.replace(/,?\s*rule\s+of\s+thirds/gi, '')
  cleaned = cleaned.replace(/,?\s*negative\s+space/gi, '')
  cleaned = cleaned.replace(/,?\s*centered\s+(composition|framing)?/gi, '')

  // Remove "shot" and "angle" when used as photography terms (but preserve in context)
  cleaned = cleaned.replace(/,?\s*\bangle\s+shot(\s+of)?/gi, '')
  cleaned = cleaned.replace(/,?\s*\bshot(\s+of)?/gi, '')

  // Remove static image specific effects
  cleaned = cleaned.replace(/,?\s*bokeh/gi, '')
  cleaned = cleaned.replace(/,?\s*vignette/gi, '')

  // Clean up leading articles if they start the string
  cleaned = cleaned.replace(/^a\s+,?\s*/i, '')
  cleaned = cleaned.replace(/^,\s*/i, '')

  // Clean up extra whitespace, commas, and punctuation
  cleaned = cleaned.replace(/\s*,\s*,\s*/g, ', ') // Double commas
  cleaned = cleaned.replace(/\s+/g, ' ') // Multiple spaces
  cleaned = cleaned.replace(/,\s+\./g, '.') // Comma before period
  cleaned = cleaned.replace(/\s+,/g, ',') // Space before comma
  cleaned = cleaned.replace(/^[,\s\.]+|[,\s]+$/g, '') // Leading/trailing punctuation

  // Ensure proper sentence structure
  cleaned = cleaned.trim()
  if (cleaned && !cleaned.match(/^[A-Z]/)) {
    cleaned = cleaned.charAt(0).toUpperCase() + cleaned.slice(1)
  }

  return cleaned
}
