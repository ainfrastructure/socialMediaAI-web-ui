<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useBusinessesStore } from '@/stores/businesses'
import { useRestaurantsStore } from "@/stores/restaurants"
import type { Business } from '@/services/businessService'
import type { SavedRestaurant } from "@/services/restaurantService"
import { getBusinessTypeLabel } from '@/utils/businessTypes'
import BaseButton from './BaseButton.vue'
import MaterialIcon from './MaterialIcon.vue'
import BusinessFormModal from './BusinessFormModal.vue'
import ViewRestaurantModal from "./ViewRestaurantModal.vue"

const { t } = useI18n()
const businessesStore = useBusinessesStore()
const restaurantsStore = useRestaurantsStore()

const showCreateModal = ref(false)
const showEditModal = ref(false)
const selectedBusiness = ref<Business | null>(null)
const showRestaurantModal = ref(false)
const selectedRestaurant = ref<SavedRestaurant | null>(null)
const restaurantModalTab = ref<"details" | "images">("details")

onMounted(async () => {
  if (!businessesStore.businesses.length) {
    await businessesStore.fetchBusinesses()
  }
})

onMounted(async () => {
  if (!restaurantsStore.restaurants.length) {
    await restaurantsStore.fetchRestaurants()
  }
})

function handleEdit(business: Business) {
  selectedBusiness.value = business
  showEditModal.value = true
}

function handleCloseEdit() {
  selectedBusiness.value = null
}

function getRestaurantsForBusiness(businessId: string): SavedRestaurant[] {
  return restaurantsStore.restaurants.filter(
    restaurant =>
      restaurant.business_id === businessId ||
      (!restaurant.business_id && restaurant.id === businessId)
  )
}

function openRestaurantModal(restaurant: SavedRestaurant, initialTab: "details" | "images") {
  selectedRestaurant.value = restaurant
  restaurantModalTab.value = initialTab
  showRestaurantModal.value = true
}

async function ensureRestaurantForBusiness(business: Business): Promise<SavedRestaurant | null> {
  const restaurants = getRestaurantsForBusiness(business.id)
  if (restaurants.length) return restaurants[0]

  const fallbackAddress = (business.address || '').trim() || 'Unknown address'

  const created = await restaurantsStore.createManualRestaurant({
    name: business.name,
    address: fallbackAddress,
    phone_number: business.phone_number || undefined,
    website: business.website || undefined,
    business_id: business.id,
  })

  if (!created) {
    await restaurantsStore.fetchRestaurants()
    const fallback = getRestaurantsForBusiness(business.id)[0] || null
    if (fallback) return fallback
    selectedBusiness.value = business
    showEditModal.value = true
    alert('Could not create a location for this business yet. Please add an address and try again.')
    return null
  }

  await restaurantsStore.fetchRestaurants()
  if (!business.address) {
    alert('We created a location with a placeholder address. Please update the address in Edit.')
  }
  return created
}

async function openBusinessDetails(business: Business) {
  const restaurant = await ensureRestaurantForBusiness(business)
  if (!restaurant) return
  openRestaurantModal(restaurant, "details")
}

async function openBusinessImages(business: Business) {
  const restaurant = await ensureRestaurantForBusiness(business)
  if (!restaurant) return
  openRestaurantModal(restaurant, "images")
}

async function handleRestaurantUpdated() {
  await Promise.all([
    restaurantsStore.fetchRestaurants(),
    businessesStore.fetchBusinesses()
  ])
  // Sync selectedRestaurant with fresh store data
  if (selectedRestaurant.value) {
    const freshRestaurant = restaurantsStore.restaurants.find(
      r => r.id === selectedRestaurant.value!.id
    )
    if (freshRestaurant) {
      selectedRestaurant.value = freshRestaurant
    }
  }
}

function handleRestaurantModalClose() {
  selectedRestaurant.value = null
}

async function confirmDelete(business: Business) {
  if (confirm(`Delete "${business.name}"? This cannot be undone.`)) {
    await businessesStore.deleteBusiness(business.id)
  }
}

async function handleSaved() {
  showCreateModal.value = false
  showEditModal.value = false
  await Promise.all([
    businessesStore.fetchBusinesses(),
    restaurantsStore.fetchRestaurants()
  ])
}
</script>

<template>
  <div class="business-management">
    <!-- Section Header -->
    <div class="section-header">
      <div class="header-content">
        <h2 class="section-title">{{ t('businesses.title', 'Your Portfolio') }}</h2>
        <p class="section-subtitle">{{ t('businesses.subtitle', 'Manage and organize the businesses in your portfolio.') }}</p>
      </div>
      <BaseButton @click="showCreateModal = true" variant="primary" size="small">
        <MaterialIcon icon="add" size="sm" color="var(--text-on-gold)" />
        {{ t('businesses.addBusiness', 'Add Business') }}
      </BaseButton>
    </div>

    <!-- Loading -->
    <div v-if="businessesStore.loading && !businessesStore.businesses.length" class="loading-state">
      <MaterialIcon icon="hourglass_empty" size="xl" color="var(--text-muted)" />
      <p>{{ t('common.loading', 'Loading...') }}</p>
    </div>

    <!-- Empty State -->
    <div v-else-if="!businessesStore.businesses.length" class="empty-state">
      <div class="empty-icon-wrapper">
        <MaterialIcon icon="store" size="xl" color="var(--gold-primary)" />
      </div>
      <h3>{{ t('businesses.noBusiness', 'No businesses yet') }}</h3>
      <p>{{ t('businesses.addFirst', 'Add your first business to start connecting accounts.') }}</p>
      <BaseButton @click="showCreateModal = true" variant="primary">
        {{ t('businesses.addFirstBusiness', 'Add Your First Business') }}
      </BaseButton>
    </div>

    <!-- Business Grid -->
    <div v-else class="business-grid">
      <div
        v-for="(business, index) in businessesStore.businesses"
        :key="business.id"
        class="business-card"
        :style="{ animationDelay: `${index * 0.08}s` }"
        @click="openBusinessDetails(business)"
      >
        <!-- Card Accent Line -->
        <div class="card-accent"></div>

        <div class="card-content">
          <!-- Logo -->
          <div class="business-logo">
            <img
              v-if="business.logo_url || business.brand_dna?.logo_url"
              :src="business.logo_url || business.brand_dna?.logo_url"
              alt="Logo"
            />
            <span v-else class="logo-letter">
              {{ business.name.charAt(0).toUpperCase() }}
            </span>
          </div>

          <!-- Info -->
          <div class="business-details">
            <div class="name-row">
              <h3 class="business-name">{{ business.name }}</h3>
              <span v-if="business.is_default" class="default-badge">
                <MaterialIcon icon="star" size="xs" color="var(--bronze-primary)" />
                Default
              </span>
            </div>

            <span class="type-label">{{ getBusinessTypeLabel(business.business_type) }}</span>

            <p v-if="business.address" class="business-address">
              <MaterialIcon icon="location_on" size="xs" color="var(--text-muted)" />
              {{ business.address }}
            </p>
          </div>
        </div>

        <!-- Actions -->
        <div class="card-actions" @click.stop>
          <button class="action-btn" @click="openBusinessImages(business)" :title="t('businesses.photos', 'Photos')">
            <MaterialIcon icon="photo_library" size="sm" color="var(--text-secondary)" />
          </button>
          <button class="action-btn" @click="handleEdit(business)" :title="t('common.edit', 'Edit')">
            <MaterialIcon icon="edit" size="sm" color="var(--text-secondary)" />
          </button>
          <button class="action-btn action-btn--danger" @click="confirmDelete(business)" :title="t('common.delete', 'Delete')">
            <MaterialIcon icon="delete_outline" size="sm" color="var(--error-text)" />
          </button>
        </div>
      </div>
    </div>

    <Teleport to="body">
      <BusinessFormModal
        v-model="showCreateModal"
        @saved="handleSaved"
      />
      <BusinessFormModal
        v-if="selectedBusiness"
        v-model="showEditModal"
        :business="selectedBusiness"
        @saved="handleSaved"
        @update:model-value="handleCloseEdit"
      />
      <ViewRestaurantModal
        v-if="selectedRestaurant"
        v-model="showRestaurantModal"
        :restaurant="selectedRestaurant"
        :initial-tab="restaurantModalTab"
        @updated="handleRestaurantUpdated"
        @update:model-value="handleRestaurantModalClose"
      />
    </Teleport>
  </div>
</template>

<style scoped>
.business-management {
  animation: fadeIn 0.5s var(--ease-smooth);
}

/* ===== Header ===== */
.section-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  margin-bottom: var(--space-2xl);
  gap: var(--space-lg);
}

.section-title {
  font-family: var(--font-heading);
  font-size: var(--text-2xl);
  color: var(--text-primary);
  letter-spacing: -0.02em;
}

.section-subtitle {
  color: var(--text-muted);
  margin-top: var(--space-xs);
  font-size: var(--text-sm);
}

/* ===== Grid ===== */
.business-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: var(--space-xl);
}

/* ===== Card ===== */
.business-card {
  position: relative;
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-xl);
  padding: var(--space-xl);
  display: flex;
  flex-direction: column;
  gap: var(--space-lg);
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  overflow: hidden;
  animation: cardFadeIn 0.5s var(--ease-smooth) both;
}

.business-card:hover {
  border-color: rgba(26, 77, 58, 0.3);
  box-shadow:
    var(--shadow-lg),
    0 0 0 1px rgba(26, 77, 58, 0.08),
    inset 0 1px 0 0 rgba(26, 77, 58, 0.1);
  transform: translateY(-3px);
}

.business-card:hover .card-accent {
  opacity: 1;
  height: 3px;
}

/* Top accent line */
.card-accent {
  position: absolute;
  top: -1px;
  left: -1px;
  right: -1px;
  height: 0px;
  background: var(--gradient-gold);
  border-radius: var(--radius-xl) var(--radius-xl) 0 0;
  opacity: 0;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

/* ===== Card Content ===== */
.card-content {
  display: flex;
  gap: var(--space-lg);
  align-items: flex-start;
}

.business-logo {
  width: 56px;
  height: 56px;
  min-width: 56px;
  border-radius: var(--radius-lg);
  overflow: hidden;
  background: var(--bg-tertiary);
  border: 1px solid var(--border-color);
  display: flex;
  align-items: center;
  justify-content: center;
}

.business-logo img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.logo-letter {
  font-family: var(--font-heading);
  font-size: var(--text-xl);
  font-weight: var(--font-semibold);
  color: var(--gold-primary);
}

.business-details {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: var(--space-xs);
}

.name-row {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
}

.business-name {
  font-family: var(--font-heading);
  font-size: var(--text-lg);
  font-weight: var(--font-semibold);
  color: var(--text-primary);
  letter-spacing: -0.01em;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.default-badge {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  padding: 2px var(--space-sm);
  background: rgba(139, 90, 43, 0.1);
  border: 1px solid rgba(139, 90, 43, 0.2);
  border-radius: var(--radius-full);
  font-size: 0.65rem;
  font-weight: var(--font-semibold);
  color: var(--bronze-primary);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  white-space: nowrap;
}

.type-label {
  font-size: var(--text-xs);
  font-weight: var(--font-medium);
  color: var(--gold-primary);
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

.business-address {
  display: flex;
  align-items: center;
  gap: var(--space-xs);
  color: var(--text-muted);
  font-size: var(--text-sm);
  margin-top: var(--space-xs);
}

/* ===== Actions ===== */
.card-actions {
  display: flex;
  justify-content: flex-end;
  gap: var(--space-xs);
  padding-top: var(--space-md);
  border-top: 1px solid rgba(139, 90, 43, 0.08);
}

.action-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: var(--radius-md);
  border: none;
  background: transparent;
  cursor: pointer;
  transition: all 0.2s ease;
}

.action-btn:hover {
  background: var(--bg-tertiary);
}

.action-btn--danger:hover {
  background: var(--error-bg);
}

/* ===== Empty State ===== */
.loading-state,
.empty-state {
  padding: var(--space-5xl) var(--space-2xl);
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-md);
}

.empty-icon-wrapper {
  width: 72px;
  height: 72px;
  border-radius: var(--radius-xl);
  background: var(--gold-subtle);
  border: 1px solid rgba(26, 77, 58, 0.15);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: var(--space-md);
}

.empty-state h3 {
  font-family: var(--font-heading);
  font-size: var(--text-xl);
  color: var(--text-primary);
}

.empty-state p {
  color: var(--text-muted);
  font-size: var(--text-sm);
  margin-bottom: var(--space-lg);
}

.loading-state p {
  color: var(--text-muted);
}

/* ===== Animations ===== */
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes cardFadeIn {
  from {
    opacity: 0;
    transform: translateY(12px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* ===== Responsive ===== */
@media (max-width: 768px) {
  .section-header {
    flex-direction: column;
    align-items: flex-start;
  }

  .business-grid {
    grid-template-columns: 1fr;
    gap: var(--space-lg);
  }
}

@media (prefers-reduced-motion: reduce) {
  .business-management,
  .business-card {
    animation: none;
  }

  .business-card:hover {
    transform: none;
  }
}
</style>
