/**
 * SEO Content Brief Types
 *
 * Types for weekly SEO content briefs generated from Google Trends data.
 */

export interface TrendingKeyword {
  keyword: string
  searchVolume: number
  trendDirection: 'rising' | 'stable' | 'declining'
  relatedQueries: string[]
}

export interface ContentBrief {
  id: string
  title: string
  headline: string
  targetKeywords: {
    primary: string
    secondary: string[]
  }
  wordCountTarget: {
    min: number
    max: number
  }
  internalLinks: InternalLink[]
  outline: string[]
  status: 'draft' | 'in_progress' | 'completed' | 'archived'
  trendScore: number
  createdAt: string
  updatedAt: string
}

export interface InternalLink {
  anchor: string
  targetUrl: string
  relevance: 'high' | 'medium' | 'low'
}

export interface SEOBriefBatch {
  id: string
  generatedAt: string
  niche: string
  briefs: ContentBrief[]
  trendingKeywords: TrendingKeyword[]
  weekNumber: number
  year: number
}

export interface SEOBriefFilters {
  status?: ContentBrief['status']
  niche?: string
  weekNumber?: number
  year?: number
  page?: number
  limit?: number
}

export interface GenerateBriefsRequest {
  niche: string
  count?: number
  language?: string
}

export interface GenerateBriefsResponse {
  batch: SEOBriefBatch
  cached: boolean
}
