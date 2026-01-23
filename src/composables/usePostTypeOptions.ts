import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

export interface PostTypeOption {
  value: 'feed' | 'story' | 'reel' | 'carousel'
  label: string
  icon: string
}

export function usePostTypeOptions(platform: 'facebook' | 'instagram') {
  const { t } = useI18n()

  return computed<PostTypeOption[]>(() => {
    const options = {
      facebook: [
        { value: 'feed' as const, label: t('postType.feed'), icon: 'article' },
        { value: 'story' as const, label: t('postType.story'), icon: 'auto_stories' },
        { value: 'reel' as const, label: t('postType.reel'), icon: 'play_circle' },
        { value: 'carousel' as const, label: t('postType.carousel'), icon: 'collections' }
      ],
      instagram: [
        { value: 'feed' as const, label: t('postType.feed'), icon: 'grid_on' },
        { value: 'story' as const, label: t('postType.story'), icon: 'auto_stories' },
        { value: 'reel' as const, label: t('postType.reel'), icon: 'play_circle' },
        { value: 'carousel' as const, label: t('postType.carousel'), icon: 'collections' }
      ]
    }
    return options[platform] || []
  })
}
