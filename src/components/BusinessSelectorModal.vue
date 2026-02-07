<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import BaseModal from './BaseModal.vue'
import BaseButton from './BaseButton.vue'
import type { Business } from '@/services/businessService'
import { getBusinessTypeLabel } from '@/utils/businessTypes'

interface Props {
  modelValue: boolean
  businesses: Business[]
  currentId?: string
  showManageButton?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  showManageButton: true
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'select', business: Business): void
}>()

const router = useRouter()

const isOpen = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

function close() {
  isOpen.value = false
}

function selectBusiness(business: Business) {
  emit('select', business)
  close()
}

function handleManageBusinesses() {
  close()
  router.push('/businesses')
}
</script>

<template>
  <BaseModal
    :model-value="isOpen"
    size="sm"
    title="Select a business"
    :show-close-button="true"
    @update:model-value="(val: boolean) => isOpen = val"
    @close="close"
  >
    <div class="business-list">
      <div
        v-for="business in businesses"
        :key="business.id"
        :class="['business-item', { selected: business.id === currentId }]"
        @click="selectBusiness(business)"
      >
        <div class="item-logo">
          <img
            v-if="business.logo_url || business.brand_dna?.logo_url"
            :src="business.logo_url || business.brand_dna?.logo_url"
            :alt="business.name"
          />
          <div v-else class="logo-placeholder">
            {{ business.name.charAt(0).toUpperCase() }}
          </div>
        </div>

        <div class="item-info">
          <h4 class="item-name">{{ business.name }}</h4>
          <p class="item-meta">{{ getBusinessTypeLabel(business.business_type) }}</p>
          <p v-if="business.address" class="item-address">{{ business.address }}</p>
        </div>

        <div class="item-actions">
          <span v-if="business.id === currentId" class="check-icon">✓</span>
        </div>
      </div>
    </div>

    <template v-if="props.showManageButton" #footer>
      <div class="modal-footer">
        <BaseButton variant="secondary" @click="handleManageBusinesses">
          Manage businesses
        </BaseButton>
      </div>
    </template>
  </BaseModal>
</template>

<style scoped>
.business-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
  max-height: 400px;
  overflow-y: auto;
  padding-right: var(--space-sm);
}

.business-item {
  display: flex;
  align-items: center;
  gap: var(--space-lg);
  padding: var(--space-lg);
  background: var(--bg-tertiary);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all 0.2s ease;
}

.business-item:hover {
  background: var(--bg-quaternary);
  border-color: rgba(255, 255, 255, 0.18);
  transform: translateX(4px);
}

.business-item.selected {
  background: rgba(197, 164, 102, 0.14);
  border-color: rgba(197, 164, 102, 0.45);
}

.item-logo {
  width: 56px;
  height: 56px;
  border-radius: var(--radius-md);
  overflow: hidden;
  flex-shrink: 0;
  background: var(--bg-tertiary);
  display: flex;
  align-items: center;
  justify-content: center;
}

.item-logo img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.logo-placeholder {
  font-size: var(--text-xl);
  color: var(--text-secondary);
  font-weight: var(--font-semibold);
}

.item-info {
  flex: 1;
  min-width: 0;
}

.item-name {
  font-size: var(--text-base);
  font-weight: var(--font-semibold);
  color: var(--text-primary);
  margin-bottom: var(--space-xs);
}

.item-meta {
  font-size: var(--text-xs);
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.04em;
  margin-bottom: var(--space-xs);
}

.item-address {
  font-size: var(--text-sm);
  color: var(--text-secondary);
}

.item-actions {
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--gold-primary);
  font-weight: var(--font-semibold);
}

.check-icon {
  font-size: var(--text-lg);
}

.modal-footer {
  display: flex;
  justify-content: center;
  align-items: center;
}
</style>
