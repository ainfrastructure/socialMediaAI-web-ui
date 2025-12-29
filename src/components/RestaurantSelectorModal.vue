<script setup lang="ts">
import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import type { SavedRestaurant } from '@/services/restaurantService'
import BaseModal from './BaseModal.vue'
import BaseButton from './BaseButton.vue'
import AddRestaurantModal from './AddRestaurantModal.vue'
import ConfirmModal from './ConfirmModal.vue'

interface Props {
  modelValue: boolean
  restaurants: SavedRestaurant[]
  currentId?: string
  showAddButton?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  showAddButton: true
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'select', restaurant: SavedRestaurant): void
  (e: 'restaurant-added'): void
  (e: 'delete', restaurant: SavedRestaurant): void
}>()

const { t } = useI18n()

const showAddModal = ref(false)
const showDeleteConfirm = ref(false)
const restaurantToDelete = ref<SavedRestaurant | null>(null)

const isOpen = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

function close() {
  isOpen.value = false
}

function selectRestaurant(restaurant: SavedRestaurant) {
  emit('select', restaurant)
  close()
}

function handleAddNew() {
  showAddModal.value = true
}

function handleRestaurantAdded(_restaurant: any) {
  emit('restaurant-added')
}

function handleDeleteClick(event: Event, restaurant: SavedRestaurant) {
  event.stopPropagation()
  restaurantToDelete.value = restaurant
  showDeleteConfirm.value = true
}

function confirmDelete() {
  if (restaurantToDelete.value) {
    emit('delete', restaurantToDelete.value)
  }
  showDeleteConfirm.value = false
  restaurantToDelete.value = null
}

function cancelDelete() {
  showDeleteConfirm.value = false
  restaurantToDelete.value = null
}
</script>

<template>
  <BaseModal
    :model-value="isOpen"
    size="sm"
    :title="t('restaurantSelector.title')"
    :show-close-button="true"
    @update:model-value="(val: boolean) => isOpen = val"
    @close="close"
  >
    <div class="restaurants-list">
      <div
        v-for="restaurant in restaurants"
        :key="restaurant.id"
        :class="['restaurant-item', { selected: restaurant.id === currentId }]"
        @click="selectRestaurant(restaurant)"
      >
        <div v-if="restaurant.brand_dna?.logo_url" class="item-logo">
          <img :src="restaurant.brand_dna.logo_url" :alt="restaurant.name" />
        </div>
        <div v-else class="item-logo placeholder">
          <span class="placeholder-icon">🏪</span>
        </div>

        <div class="item-info">
          <h4 class="item-name">{{ restaurant.name }}</h4>
          <p class="item-address">{{ restaurant.address }}</p>
          <div v-if="restaurant.menu?.items?.length" class="item-meta">
            {{ t('restaurantSelector.menuItems', { count: restaurant.menu.items.length }) }}
          </div>
        </div>

        <div class="item-actions">
          <span v-if="restaurant.id === currentId" class="check-icon">✓</span>
          <button
            class="delete-btn"
            @click="handleDeleteClick($event, restaurant)"
            :title="t('restaurantSelector.delete')"
          >
            <span class="delete-icon">×</span>
          </button>
        </div>
      </div>
    </div>

    <template v-if="props.showAddButton" #footer>
      <BaseButton variant="secondary" full-width @click="handleAddNew">
        {{ t('restaurantSelector.addNew') }}
      </BaseButton>
    </template>
  </BaseModal>

  <!-- Add Restaurant Modal -->
  <AddRestaurantModal
    v-model="showAddModal"
    :saved-restaurants="restaurants"
    @restaurant-added="handleRestaurantAdded"
  />

  <!-- Delete Confirmation Modal -->
  <ConfirmModal
    v-model="showDeleteConfirm"
    :title="t('restaurantSelector.deleteTitle', 'Remove Restaurant')"
    :message="t('restaurantSelector.confirmDelete', { name: restaurantToDelete?.name || '' })"
    :confirm-text="t('common.delete', 'Delete')"
    :cancel-text="t('common.cancel', 'Cancel')"
    type="danger"
    :auto-close-seconds="0"
    @confirm="confirmDelete"
    @cancel="cancelDelete"
  />
</template>

<style scoped>
.restaurants-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
  max-height: 400px;
  overflow-y: auto;
  padding-right: var(--space-sm);
}

.restaurant-item {
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

.restaurant-item:hover {
  background: rgba(255, 255, 255, 0.8);
  border-color: rgba(15, 61, 46, 0.3);
  transform: translateX(4px);
}

.restaurant-item.selected {
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

.restaurant-item:hover .delete-btn {
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
.restaurants-list::-webkit-scrollbar {
  width: 6px;
}

.restaurants-list::-webkit-scrollbar-track {
  background: transparent;
}

.restaurants-list::-webkit-scrollbar-thumb {
  background: rgba(15, 61, 46, 0.3);
  border-radius: var(--radius-full);
}

.restaurants-list::-webkit-scrollbar-thumb:hover {
  background: rgba(15, 61, 46, 0.5);
}

/* Responsive */
@media (max-width: 768px) {
  .restaurant-item {
    padding: var(--space-md);
    gap: var(--space-md);
  }

  .item-logo {
    width: 48px;
    height: 48px;
  }
}
</style>
