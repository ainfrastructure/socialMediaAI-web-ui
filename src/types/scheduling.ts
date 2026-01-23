export interface AccountSelection {
  accountId: string
  postType: 'feed' | 'story' | 'reel' | 'carousel'
  carouselItems?: CarouselItem[]
  carouselCaption?: string
  carouselHashtags?: string[]
}

export interface CarouselItem {
  mediaUrl: string
  contentType: 'image' | 'video'
  file?: File
  previewUrl?: string
}

export type PlatformAccountSelections = {
  facebook?: AccountSelection[]
  instagram?: AccountSelection[]
  tiktok?: string[]
  twitter?: string[]
  linkedin?: string[]
}
