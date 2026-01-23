<script setup lang="ts">
interface Props {
  platform: 'facebook' | 'instagram' | 'tiktok' | 'twitter' | 'linkedin' | 'youtube' | 'pinterest' | 'wolt'
  size?: number
  showBackground?: boolean
}

withDefaults(defineProps<Props>(), {
  size: 24,
  showBackground: true
})

const platformBackgrounds: Record<string, string> = {
  facebook: 'linear-gradient(135deg, #1877f2, #0d5dbf)',
  instagram: 'linear-gradient(135deg, #f58529, #dd2a7b, #8134af, #515bd4)',
  tiktok: 'linear-gradient(135deg, #000000, #25f4ee)',
  twitter: '#000000',
  linkedin: '#0a66c2',
  youtube: '#ff0000',
  pinterest: '#E60023',
  wolt: 'linear-gradient(135deg, #009de0, #0077b3)'
}
</script>

<template>
  <div
    class="platform-logo"
    :class="{ 'with-background': showBackground }"
    :style="showBackground ? { background: platformBackgrounds[platform], width: `${size}px`, height: `${size}px` } : {}"
  >
    <!-- Facebook -->
    <svg v-if="platform === 'facebook'" :width="showBackground ? size * 0.55 : size" :height="showBackground ? size * 0.55 : size" viewBox="0 0 320 512" fill="white">
      <path d="M80 299.3V512H196V299.3h86.5l18-97.8H196V166.9c0-51.7 20.3-71.5 72.7-71.5c16.3 0 29.4 .4 37 1.2V7.9C291.4 4 256.4 0 236.2 0C129.3 0 80 50.5 80 159.4v42.1H14v97.8H80z"/>
    </svg>

    <!-- Instagram -->
    <svg v-else-if="platform === 'instagram'" :width="showBackground ? size * 0.55 : size" :height="showBackground ? size * 0.55 : size" viewBox="0 0 448 512" fill="white">
      <path d="M224.1 141c-63.6 0-114.9 51.3-114.9 114.9s51.3 114.9 114.9 114.9S339 319.5 339 255.9 287.7 141 224.1 141zm0 189.6c-41.1 0-74.7-33.5-74.7-74.7s33.5-74.7 74.7-74.7 74.7 33.5 74.7 74.7-33.6 74.7-74.7 74.7zm146.4-194.3c0 14.9-12 26.8-26.8 26.8-14.9 0-26.8-12-26.8-26.8s12-26.8 26.8-26.8 26.8 12 26.8 26.8zm76.1 27.2c-1.7-35.9-9.9-67.7-36.2-93.9-26.2-26.2-58-34.4-93.9-36.2-37-2.1-147.9-2.1-184.9 0-35.8 1.7-67.6 9.9-93.9 36.1s-34.4 58-36.2 93.9c-2.1 37-2.1 147.9 0 184.9 1.7 35.9 9.9 67.7 36.2 93.9s58 34.4 93.9 36.2c37 2.1 147.9 2.1 184.9 0 35.9-1.7 67.7-9.9 93.9-36.2 26.2-26.2 34.4-58 36.2-93.9 2.1-37 2.1-147.8 0-184.8zM398.8 388c-7.8 19.6-22.9 34.7-42.6 42.6-29.5 11.7-99.5 9-132.1 9s-102.7 2.6-132.1-9c-19.6-7.8-34.7-22.9-42.6-42.6-11.7-29.5-9-99.5-9-132.1s-2.6-102.7 9-132.1c7.8-19.6 22.9-34.7 42.6-42.6 29.5-11.7 99.5-9 132.1-9s102.7-2.6 132.1 9c19.6 7.8 34.7 22.9 42.6 42.6 11.7 29.5 9 99.5 9 132.1s2.7 102.7-9 132.1z"/>
    </svg>

    <!-- TikTok -->
    <svg v-else-if="platform === 'tiktok'" :width="showBackground ? size * 0.55 : size" :height="showBackground ? size * 0.55 : size" viewBox="0 0 448 512" fill="white">
      <path d="M448 209.9a210.1 210.1 0 0 1 -122.8-39.3V349.4A162.6 162.6 0 1 1 185 188.3V278.2a74.6 74.6 0 1 0 52.2 71.2V0l88 0a121.2 121.2 0 0 0 1.9 22.2h0A122.2 122.2 0 0 0 381 102.4a121.4 121.4 0 0 0 67 20.1z"/>
    </svg>

    <!-- Twitter/X -->
    <svg v-else-if="platform === 'twitter'" :width="showBackground ? size * 0.55 : size" :height="showBackground ? size * 0.55 : size" viewBox="0 0 512 512" fill="white">
      <path d="M389.2 48h70.6L305.6 224.2 487 464H345L233.7 318.6 106.5 464H35.8L200.7 275.5 26.8 48H172.4L272.9 180.9 389.2 48zM364.4 421.8h39.1L151.1 88h-42L364.4 421.8z"/>
    </svg>

    <!-- LinkedIn -->
    <svg v-else-if="platform === 'linkedin'" :width="showBackground ? size * 0.55 : size" :height="showBackground ? size * 0.55 : size" viewBox="0 0 448 512" fill="white">
      <path d="M100.3 448H7.4V148.9h92.9zM53.8 108.1C24.1 108.1 0 83.5 0 53.8a53.8 53.8 0 0 1 107.6 0c0 29.7-24.1 54.3-53.8 54.3zM447.9 448h-92.7V302.4c0-34.7-.7-79.2-48.3-79.2-48.3 0-55.7 37.7-55.7 76.7V448h-92.8V148.9h89.1v40.8h1.3c12.4-23.5 42.7-48.3 87.9-48.3 94 0 111.3 61.9 111.3 142.3V448z"/>
    </svg>

    <!-- YouTube -->
    <svg v-else-if="platform === 'youtube'" :width="showBackground ? size * 0.55 : size" :height="showBackground ? size * 0.55 : size" viewBox="0 0 576 512" fill="white">
      <path d="M549.7 124.1c-6.3-23.7-24.8-42.3-48.3-48.6C458.8 64 288 64 288 64S117.2 64 74.6 75.5c-23.5 6.3-42 24.9-48.3 48.6-11.4 42.9-11.4 132.3-11.4 132.3s0 89.4 11.4 132.3c6.3 23.7 24.8 41.5 48.3 47.8C117.2 448 288 448 288 448s170.8 0 213.4-11.5c23.5-6.3 42-24.2 48.3-47.8 11.4-42.9 11.4-132.3 11.4-132.3s0-89.4-11.4-132.3zm-317.5 213.5V175.2l142.7 81.2-142.7 81.2z"/>
    </svg>

    <!-- Pinterest -->
    <svg v-else-if="platform === 'pinterest'" :width="showBackground ? size * 0.55 : size" :height="showBackground ? size * 0.55 : size" viewBox="0 0 496 512" fill="white">
      <path d="M496 256c0 137-111 248-248 248-25.6 0-50.2-3.9-73.4-11.1 10.1-16.5 25.2-43.5 30.8-65 3-11.6 15.4-59 15.4-59 8.1 15.4 31.7 28.5 56.8 28.5 74.8 0 128.7-68.8 128.7-154.3 0-81.9-66.9-143.2-152.9-143.2-107 0-163.9 71.8-163.9 150.1 0 36.4 19.4 81.7 50.3 96.1 4.7 2.2 7.2 1.2 8.3-3.3 .8-3.4 5-20.3 6.9-28.1 .6-2.5 .3-4.7-1.7-7.1-10.1-12.5-18.3-35.3-18.3-56.6 0-54.7 41.4-107.6 112-107.6 60.9 0 103.6 41.5 103.6 100.9 0 67.1-33.9 113.6-78 113.6-24.3 0-42.6-20.1-36.7-44.8 7-29.5 20.5-61.3 20.5-82.6 0-19-10.2-34.9-31.4-34.9-24.9 0-44.9 25.7-44.9 60.2 0 22 7.4 36.8 7.4 36.8s-24.5 103.8-29 123.2c-5 21.4-3 51.6-.9 71.2C65.4 450.9 0 361.1 0 256 0 119 111 8 248 8s248 111 248 248z"/>
    </svg>

    <!-- Wolt -->
    <svg v-else-if="platform === 'wolt'" :width="showBackground ? size * 0.55 : size" :height="showBackground ? size * 0.55 : size" viewBox="0 0 448 512" fill="white">
      <path d="M50.7 58.5L0 160H208V32H93.7C75.5 32 58.9 42.3 50.7 58.5zM240 160H448L397.3 58.5C389.1 42.3 372.5 32 354.3 32H240V160zm208 32H0V416c0 35.3 28.7 64 64 64H384c35.3 0 64-28.7 64-64V192z"/>
    </svg>
  </div>
</template>

<style scoped>
.platform-logo {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.platform-logo.with-background {
  border-radius: 50%;
}

.platform-logo svg {
  display: block;
}
</style>
