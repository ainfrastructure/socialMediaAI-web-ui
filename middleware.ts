import { next, rewrite } from '@vercel/edge'

const BOT_AGENTS = /googlebot|bingbot|yandexbot|duckduckbot|slurp|baiduspider|facebookexternalhit|twitterbot|linkedinbot|embedly|quora link preview|showyoubot|outbrain|pinterest|applebot|gptbot|oai-searchbot|claudebot|perplexitybot|anthropic-ai/i

export default function middleware(request: Request) {
  const url = new URL(request.url)

  // Only rewrite the landing page for search engine crawlers
  if (url.pathname === '/' || url.pathname === '') {
    const userAgent = request.headers.get('user-agent') || ''
    if (BOT_AGENTS.test(userAgent)) {
      return rewrite(new URL('/landing.html', request.url))
    }
  }

  return next()
}

export const config = {
  matcher: '/',
}
