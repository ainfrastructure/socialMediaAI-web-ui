<template>
  <div class="post-preview-card">
    <!-- Header -->
    <div class="preview-header">
      <h4 class="preview-title">{{ title }}</h4>
      <BaseButton
        v-if="!isEditing && editable"
        variant="secondary"
        size="small"
        @click="startEditing"
      >
        edit Edit Content
      </BaseButton>
    </div>

    <!-- Large Centered Preview Section -->
    <div v-if="!isEditing" class="preview-container">
      <!-- Media Container with Golden Border -->
      <div class="preview-image-container">
        <video
          v-if="videoUrl"
          :src="videoUrl"
          controls
          autoplay
          muted
          loop
          preload="metadata"
          playsinline
          class="preview-video-display"
        />
        <img
          v-else-if="imageUrl"
          :src="imageUrl"
          alt="Post preview"
          class="preview-image-display"
        />
      </div>

      <!-- Caption Below Video -->
      <div v-if="postText" class="preview-caption">
        {{ postText }}
      </div>
    </div>

    <!-- Edit Section -->
    <div v-if="isEditing" class="edit-section">
      <div class="edit-field">
        <label class="edit-label">Post Text</label>
        <textarea
          v-model="editedText"
          class="edit-textarea"
          rows="4"
          placeholder="Enter post text..."
        ></textarea>
      </div>

      <div class="edit-field">
        <label class="edit-label">Hashtags</label>
        <div class="hashtag-editor">
          <div class="hashtag-tags">
            <span
              v-for="(tag, idx) in editedHashtags"
              :key="idx"
              class="hashtag-tag"
            >
              {{ tag }}
              <button @click="removeHashtag(idx)" class="remove-tag">&times;</button>
            </span>
          </div>
          <input
            v-model="newHashtag"
            @keydown.enter.prevent="addHashtag"
            @keydown.,.prevent="addHashtag"
            placeholder="Add hashtag and press Enter..."
            class="hashtag-input"
          />
        </div>
      </div>

      <div class="edit-actions">
        <BaseButton
          variant="ghost"
          size="small"
          @click="cancelEditing"
        >
          Cancel
        </BaseButton>
        <BaseButton
          variant="primary"
          size="small"
          @click="saveEdits"
        >
          Save Changes
        </BaseButton>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import BaseButton from './BaseButton.vue'

interface Props {
  title?: string
  imageUrl?: string
  videoUrl?: string
  postText?: string
  hashtags?: string[]
  editable?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  title: 'Selected Post:',
  editable: true,
  hashtags: () => []
})

const emit = defineEmits<{
  (e: 'update:postText', value: string): void
  (e: 'update:hashtags', value: string[]): void
}>()

const isEditing = ref(false)
const editedText = ref(props.postText || '')
const editedHashtags = ref<string[]>([...props.hashtags])
const newHashtag = ref('')

watch(() => props.postText, (newVal) => {
  if (!isEditing.value) {
    editedText.value = newVal || ''
  }
})

watch(() => props.hashtags, (newVal) => {
  if (!isEditing.value) {
    editedHashtags.value = [...newVal]
  }
})

function startEditing() {
  editedText.value = props.postText || ''
  editedHashtags.value = [...props.hashtags]
  isEditing.value = true
}

function cancelEditing() {
  isEditing.value = false
  editedText.value = props.postText || ''
  editedHashtags.value = [...props.hashtags]
  newHashtag.value = ''
}

function saveEdits() {
  emit('update:postText', editedText.value)
  emit('update:hashtags', editedHashtags.value)
  isEditing.value = false
  newHashtag.value = ''
}

function addHashtag() {
  if (newHashtag.value.trim()) {
    let tag = newHashtag.value.trim()
    if (!tag.startsWith('#')) {
      tag = '#' + tag
    }
    if (!editedHashtags.value.includes(tag)) {
      editedHashtags.value.push(tag)
    }
    newHashtag.value = ''
  }
}

function removeHashtag(index: number) {
  editedHashtags.value.splice(index, 1)
}
</script>

<style scoped>
.post-preview-card {
  margin-bottom: var(--space-2xl);
}

.preview-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--space-md);
}

.preview-title {
  font-family: var(--font-heading);
  font-size: var(--text-lg);
  color: var(--text-primary);
  margin: 0;
}

/* Large Centered Preview - matches EasyModeCreation.vue */
.preview-container {
  display: flex;
  flex-direction: column;
  gap: var(--space-lg);
}

.preview-image-container {
  width: 100%;
  min-height: 400px;
  border-radius: var(--radius-lg);
  overflow: hidden;
  border: 2px solid var(--gold-primary);
  box-shadow: var(--glow-gold-md);
  background: var(--bg-tertiary);
  display: flex;
  align-items: center;
  justify-content: center;
}

.preview-video-display {
  width: 100%;
  max-height: 600px;
  display: block;
  background: var(--bg-tertiary);
}

.preview-image-display {
  width: 100%;
  height: auto;
  display: block;
}

.preview-caption {
  color: var(--text-primary);
  font-size: var(--text-base);
  line-height: var(--leading-relaxed);
  white-space: pre-wrap;
  word-break: break-word;
  padding: var(--space-md);
  background: var(--bg-elevated);
  border-radius: var(--radius-md);
  border: 1px solid var(--border-color);
}

/* Edit Section Styles */
.edit-section {
  display: flex;
  flex-direction: column;
  gap: var(--space-lg);
  padding: var(--space-lg);
  background: var(--bg-tertiary);
  border-radius: var(--radius-lg);
}

.edit-field {
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
}

.edit-label {
  font-size: var(--text-sm);
  font-weight: var(--font-medium);
  color: var(--text-primary);
}

.edit-textarea {
  width: 100%;
  padding: var(--space-md);
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  color: var(--text-primary);
  font-family: var(--font-body);
  font-size: var(--text-base);
  resize: vertical;
  min-height: 100px;
}

.edit-textarea:focus {
  outline: none;
  border-color: var(--gold-primary);
}

.hashtag-editor {
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
}

.hashtag-tags {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-xs);
}

.hashtag-tag {
  display: inline-flex;
  align-items: center;
  gap: var(--space-xs);
  padding: var(--space-xs) var(--space-sm);
  background: var(--gold-primary);
  color: var(--text-on-gold);
  border-radius: var(--radius-sm);
  font-size: var(--text-sm);
}

.remove-tag {
  background: none;
  border: none;
  color: var(--text-on-gold);
  font-size: var(--text-lg);
  cursor: pointer;
  padding: 0;
  line-height: 1;
  opacity: 0.8;
  transition: opacity 0.2s;
}

.remove-tag:hover {
  opacity: 1;
}

.hashtag-input {
  width: 100%;
  padding: var(--space-md);
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  color: var(--text-primary);
  font-family: var(--font-body);
  font-size: var(--text-base);
}

.hashtag-input:focus {
  outline: none;
  border-color: var(--gold-primary);
}

.edit-actions {
  display: flex;
  justify-content: flex-end;
  gap: var(--space-md);
  padding-top: var(--space-md);
  border-top: 1px solid var(--border-color);
}

/* Responsive */
@media (max-width: 640px) {
  .preview-image-container {
    min-height: 300px;
  }

  .preview-video-display {
    max-height: 400px;
  }

  .preview-caption {
    font-size: var(--text-sm);
  }
}
</style>
