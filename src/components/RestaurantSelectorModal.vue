<script setup lang="ts">
import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import type { SavedRestaurant } from '@/services/restaurantService'
import BaseCard from './BaseCard.vue'
import BaseButton from './BaseButton.vue'
import AddRestaurantModal from './AddRestaurantModal.vue'

interface Props {
  modelValue: boolean
  restaurants: SavedRestaurant[]
  currentId?: string
}

const props = defineProps<Props>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'select', restaurant: SavedRestaurant): void
  (e: 'restaurant-added'): void
  (e: 'delete', restaurant: SavedRestaurant): void
}>()

const { t } = useI18n()

const showAddModal = ref(false)

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

function handleRestaurantAdded(restaurant: any) {
  // Emit event to parent to refresh restaurant list
  emit('restaurant-added')
}

function handleDelete(event: Event, restaurant: SavedRestaurant) {
  event.stopPropagation()
  if (confirm(t('restaurantSelector.confirmDelete', { name: restaurant.name }))) {
    emit('delete', restaurant)
  }
}
</script>

<template>
  <Teleport to="body">
    <Transition name="modal-fade">
      <div v-if="isOpen" class="modal-overlay" @click.self="close">
        <BaseCard variant="glass-intense" class="selector-modal">
          <div class="modal-header">
            <h2 class="modal-title">{{ t('restaurantSelector.title') }}</h2>
            <button class="close-btn" @click="close">&times;</button>
          </div>

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
                  @click="handleDelete($event, restaurant)"
                  :title="t('restaurantSelector.delete')"
                >
                  <span class="delete-icon">×</span>
                </button>
              </div>
            </div>
          </div>

          <div class="modal-footer">
            <BaseButton variant="secondary" full-width @click="handleAddNew">
              {{ t('restaurantSelector.addNew') }}
            </BaseButton>
          </div>
        </BaseCard>
      </div>
    </Transition>
  </Teleport>

  <!-- Add Restaurant Modal -->
  <AddRestaurantModal
    v-model="showAddModal"
    :saved-restaurants="restaurants"
    @restaurant-added="handleRestaurantAdded"
  />
</template>

<style scoped>
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.85);
  backdrop-filter: blur(var(--blur-md));
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--space-xl);
  z-index: 1000;
}

.selector-modal {
  max-width: 500px;
  width: 100%;
  max-height: 80vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  animation: slideUp 0.3s var(--ease-smooth);
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: var(--space-xl);
  border-bottom: 1px solid rgba(212, 175, 55, 0.2);
  margin-bottom: var(--space-lg);
}

.modal-title {
  font-family: var(--font-heading);
  font-size: var(--text-2xl);
  color: var(--gold-primary);
  margin: 0;
}

.close-btn {
  background: none;
  border: none;
  color: var(--text-secondary);
  font-size: 2rem;
  line-height: 1;
  cursor: pointer;
  padding: 0;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius-md);
  transition: all 0.2s ease;
}

.close-btn:hover {
  background: rgba(212, 175, 55, 0.1);
  color: var(--gold-primary);
}

.restaurants-list {
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
  max-height: 400px;
  padding-right: var(--space-sm);
}

.restaurant-item {
  display: flex;
  align-items: center;
  gap: var(--space-lg);
  padding: var(--space-lg);
  background: rgba(26, 26, 26, 0.6);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all 0.2s ease;
}

.restaurant-item:hover {
  background: rgba(26, 26, 26, 0.8);
  border-color: rgba(212, 175, 55, 0.3);
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
  background: rgba(212, 175, 55, 0.1);
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
  color: var(--text-on-gold);
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

.modal-footer {
  padding-top: var(--space-xl);
  border-top: 1px solid rgba(212, 175, 55, 0.2);
  margin-top: var(--space-lg);
}

/* Transition */
.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity 0.2s ease;
}

.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
}

/* Scrollbar styling */
.restaurants-list::-webkit-scrollbar {
  width: 6px;
}

.restaurants-list::-webkit-scrollbar-track {
  background: transparent;
}

.restaurants-list::-webkit-scrollbar-thumb {
  background: rgba(212, 175, 55, 0.3);
  border-radius: var(--radius-full);
}

.restaurants-list::-webkit-scrollbar-thumb:hover {
  background: rgba(212, 175, 55, 0.5);
}

/* Responsive */
@media (max-width: 768px) {
  .modal-overlay {
    padding: var(--space-lg);
  }

  .selector-modal {
    max-height: 90vh;
  }

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
