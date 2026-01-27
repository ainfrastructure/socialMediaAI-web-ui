<script setup lang="ts">
import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import type { SavedBusiness } from '@/services/businessService'
import BaseModal from './BaseModal.vue'
import BaseButton from './BaseButton.vue'
import AddBusinessModal from './AddBusinessModal.vue'
import CreateBusinessModal from './CreateBusinessModal.vue'
import ConfirmModal from './ConfirmModal.vue'

interface Props {
  modelValue: boolean
  businesses: SavedBusiness[]
  currentId?: string
  showAddButton?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  showAddButton: true
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'select', business: SavedBusiness): void
  (e: 'business-added'): void
  (e: 'delete', business: SavedBusiness): void
}>()

const { t } = useI18n()
const router = useRouter()

const showAddModal = ref(false)
const showCreateModal = ref(false)
const showDeleteConfirm = ref(false)
const businessToDelete = ref<SavedBusiness | null>(null)

const isOpen = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

function close() {
  isOpen.value = false
}

function selectBusiness(business: SavedBusiness) {
  emit('select', business)
  close()
}

function handleAddNew() {
  showAddModal.value = true
}

function handleManageBusinesses() {
  close()
  router.push('/businesses')
}

function handleBusinessAdded(_business: any) {
  emit('business-added')
}

function handleSwitchToManual() {
  showAddModal.value = false
  showCreateModal.value = true
}

function handleBusinessCreated() {
  showCreateModal.value = false
  emit('business-added')
}

function handleDeleteClick(event: Event, business: SavedBusiness) {
  event.stopPropagation()
  businessToDelete.value = business
  showDeleteConfirm.value = true
}

function confirmDelete() {
  if (businessToDelete.value) {
    emit('delete', businessToDelete.value)
  }
  showDeleteConfirm.value = false
  businessToDelete.value = null
}

function cancelDelete() {
  showDeleteConfirm.value = false
  businessToDelete.value = null
}
</script>

<template>
  <BaseModal
    :model-value="isOpen"
    size="sm"
    :title="t('businessSelector.title')"
    :show-close-button="true"
    @update:model-value="(val: boolean) => isOpen = val"
    @close="close"
  >
    <div class="businesses-list">
      <div
        v-for="business in businesses"
        :key="business.id"
        :class="['business-item', { selected: business.id === currentId }]"
        @click="selectBusiness(business)"
      >
        <div v-if="business.brand_dna?.logo_url" class="item-logo">
          <img :src="business.brand_dna.logo_url" :alt="business.name" />
        </div>
        <div v-else class="item-logo placeholder">
          <span class="placeholder-icon">🏪</span>
        </div>

        <div class="item-info">
          <h4 class="item-name">{{ business.name }}</h4>
          <p class="item-address">{{ business.address }}</p>
          <div v-if="business.menu?.items?.length" class="item-meta">
            {{ t('businessSelector.menuItems', { count: business.menu.items.length }) }}
          </div>
        </div>

        <div class="item-actions">
          <span v-if="business.id === currentId" class="check-icon">✓</span>
          <button
            class="delete-btn"
            @click="handleDeleteClick($event, business)"
            :title="t('businessSelector.delete')"
          >
            <span class="delete-icon">×</span>
          </button>
        </div>
      </div>
    </div>

    <template v-if="props.showAddButton" #footer>
      <div class="modal-footer">
        <button class="manage-link" @click="handleManageBusinesses">
          {{ $t('profile.manageBusinesses') }}
        </button>
        <BaseButton variant="secondary" @click="handleAddNew" fullWidth>
          {{ t('businessSelector.addNew') }}
        </BaseButton>
      </div>
    </template>
  </BaseModal>

  <!-- Add Business Modal -->
  <AddBusinessModal
    v-model="showAddModal"
    :saved-businesses="businesses"
    @business-added="handleBusinessAdded"
    @switch-to-manual="handleSwitchToManual"
  />

  <!-- Create Business Modal -->
  <CreateBusinessModal
    v-model="showCreateModal"
    @created="handleBusinessCreated"
  />

  <!-- Delete Confirmation Modal -->
  <ConfirmModal
    v-model="showDeleteConfirm"
    :title="t('businessSelector.deleteTitle', 'Remove Business')"
    :message="t('businessSelector.confirmDelete', { name: businessToDelete?.name || '' })"
    :confirm-text="t('common.delete', 'Delete')"
    :cancel-text="t('common.cancel', 'Cancel')"
    type="danger"
    :auto-close-seconds="0"
    @confirm="confirmDelete"
    @cancel="cancelDelete"
  />
</template>

<style scoped>
.businesses-list {
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
  background: rgba(255, 255, 255, 0.6);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all 0.2s ease;
}

.business-item:hover {
  background: rgba(255, 255, 255, 0.8);
  border-color: rgba(15, 61, 46, 0.3);
  transform: translateX(4px);
}

.business-item.selected {
  background: var(--gold-subtle);
  border-color: var(--gold-primary);
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

.item-logo.placeholder {
  background: rgba(15, 61, 46, 0.1);
}

.placeholder-icon {
  font-size: var(--text-2xl);
}

.item-info {
  flex: 1;
  min-width: 0;
}

.item-name {
  font-family: var(--font-heading);
  font-size: var(--text-lg);
  color: var(--text-primary);
  margin: 0 0 var(--space-xs) 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.item-address {
  font-size: var(--text-sm);
  color: var(--text-secondary);
  margin: 0 0 var(--space-xs) 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.item-meta {
  font-size: var(--text-xs);
  color: var(--text-muted);
}

.item-actions {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  flex-shrink: 0;
}

.check-icon {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--gold-primary);
  color: #ffffff;
  border-radius: var(--radius-full);
  font-weight: var(--font-bold);
  flex-shrink: 0;
}

.delete-btn {
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: 1px solid rgba(255, 100, 100, 0.3);
  border-radius: var(--radius-full);
  cursor: pointer;
  transition: all 0.2s ease;
  opacity: 0;
}

.business-item:hover .delete-btn {
  opacity: 1;
}

.delete-btn:hover {
  background: rgba(255, 100, 100, 0.2);
  border-color: rgba(255, 100, 100, 0.6);
}

.delete-icon {
  color: rgba(255, 100, 100, 0.8);
  font-size: var(--text-lg);
  line-height: 1;
}

.delete-btn:hover .delete-icon {
  color: #ff6464;
}

/* Scrollbar styling */
.businesses-list::-webkit-scrollbar {
  width: 6px;
}

.businesses-list::-webkit-scrollbar-track {
  background: transparent;
}

.businesses-list::-webkit-scrollbar-thumb {
  background: rgba(15, 61, 46, 0.3);
  border-radius: var(--radius-full);
}

.businesses-list::-webkit-scrollbar-thumb:hover {
  background: rgba(15, 61, 46, 0.5);
}

/* Modal Footer */
.modal-footer {
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
  width: 100%;
}

.manage-link {
  align-self: center;
  background: none;
  border: none;
  color: var(--gold-primary);
  font-family: var(--font-body);
  font-size: var(--text-sm);
  font-weight: var(--font-medium);
  cursor: pointer;
  padding: var(--space-xs) 0;
  transition: var(--transition-base);
  text-decoration: none;
  margin-bottom: var(--space-xs);
}

.manage-link:hover {
  text-decoration: underline;
  color: var(--gold-dark);
}


/* Responsive */
@media (max-width: 768px) {
  .business-item {
    padding: var(--space-md);
    gap: var(--space-md);
  }

  .item-logo {
    width: 48px;
    height: 48px;
  }
}

/* ===== DARK MODE OVERRIDES ===== */
:root[data-theme="dark"] .business-item {
  background: var(--bg-tertiary);
}

:root[data-theme="dark"] .business-item:hover {
  background: var(--bg-elevated);
  border-color: var(--accent-alpha-30);
}

:root[data-theme="dark"] .item-logo.placeholder {
  background: var(--accent-alpha-10);
}

:root[data-theme="dark"] .businesses-list::-webkit-scrollbar-thumb {
  background: var(--accent-alpha-30);
}

:root[data-theme="dark"] .businesses-list::-webkit-scrollbar-thumb:hover {
  background: var(--accent-alpha-50);
}
</style>
