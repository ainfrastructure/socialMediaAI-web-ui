<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useBrandsStore } from '@/stores/brands'
import type { Brand } from '@/services/brandService'
import { getBrandTypeLabel } from '@/utils/businessTypes'
import BaseButton from './BaseButton.vue'
import MaterialIcon from './MaterialIcon.vue'
import BrandFormModal from './BrandFormModal.vue'
import ViewBrandModal from "./ViewBrandModal.vue"

const { t } = useI18n()
const brandsStore = useBrandsStore()

const showCreateModal = ref(false)
const showEditModal = ref(false)
const selectedBrand = ref<Brand | null>(null)
const showBrandModal = ref(false)
const brandModalTab = ref<"details" | "images">("details")

onMounted(async () => {
  if (!brandsStore.brands.length) {
    await brandsStore.fetchBrands()
  }
})

function handleEdit(brand: Brand) {
  selectedBrand.value = brand
  showEditModal.value = true
}

function handleCloseEdit() {
  selectedBrand.value = null
}

function getBrandsForBusiness(brandId: string): Brand[] {
  return brandsStore.brands.filter(
    restaurant =>
      restaurant.brand_id === brandId ||
      (!restaurant.brand_id && restaurant.id === brandId)
  )
}

function openBrandModal(brand: Brand, initialTab: "details" | "images") {
  selectedBrand.value = brand
  brandModalTab.value = initialTab
  showBrandModal.value = true
}

async function ensureBrandForBusiness(brand: Brand): Promise<Brand | null> {
  const restaurants = getBrandsForBusiness(brand.id)
  if (restaurants.length) return restaurants[0]

  const fallbackAddress = (brand.address || '').trim() || 'Unknown address'

  const created = await brandsStore.createBrand({
    name: brand.name,
    address: fallbackAddress,
    phone_number: brand.phone_number || undefined,
    website: brand.website || undefined,
    brand_id: brand.id,
  })

  if (!created) {
    await brandsStore.fetchBrands()
    const fallback = getBrandsForBusiness(brand.id)[0] || null
    if (fallback) return fallback
    selectedBrand.value = brand
    showEditModal.value = true
    alert('Could not create a location for this brand yet. Please add an address and try again.')
    return null
  }

  await brandsStore.fetchBrands()
  if (!brand.address) {
    alert('We created a location with a placeholder address. Please update the address in Edit.')
  }
  return created
}

async function openBusinessDetails(brand: Brand) {
  const restaurant = await ensureBrandForBusiness(brand)
  if (!restaurant) return
  openBrandModal(restaurant, "details")
}

async function openBusinessImages(brand: Brand) {
  const restaurant = await ensureBrandForBusiness(brand)
  if (!restaurant) return
  openBrandModal(restaurant, "images")
}

async function handleBrandUpdated() {
  await Promise.all([
    brandsStore.fetchBrands(),
    brandsStore.fetchBrands()
  ])
  // Sync selectedBrand with fresh store data
  if (selectedBrand.value) {
    const freshBrand = brandsStore.brands.find(
      r => r.id === selectedBrand.value!.id
    )
    if (freshBrand) {
      selectedBrand.value = freshBrand
    }
  }
}

function handleBrandModalClose() {
  selectedBrand.value = null
}

async function confirmDelete(brand: Brand) {
  if (confirm(`Delete "${brand.name}"? This cannot be undone.`)) {
    await brandsStore.deleteBrand(brand.id)
  }
}

async function handleSaved() {
  showCreateModal.value = false
  showEditModal.value = false
  await Promise.all([
    brandsStore.fetchBrands(),
    brandsStore.fetchBrands()
  ])
}
</script>

<template>
  <div class="brand-management">
    <!-- Section Header -->
    <div class="section-header">
      <div class="header-content">
        <h2 class="section-title">{{ t('brands.title', 'Your Portfolio') }}</h2>
        <p class="section-subtitle">{{ t('brands.subtitle', 'Manage and organize the brands in your portfolio.') }}</p>
      </div>
      <BaseButton @click="showCreateModal = true" variant="primary" size="small">
        <MaterialIcon icon="add" size="sm" color="var(--text-on-gold)" />
        {{ t('brands.addBusiness', 'Add Business') }}
      </BaseButton>
    </div>

    <!-- Loading -->
    <div v-if="brandsStore.loading && !brandsStore.brands.length" class="loading-state">
      <MaterialIcon icon="hourglass_empty" size="xl" color="var(--text-muted)" />
      <p>{{ t('common.loading', 'Loading...') }}</p>
    </div>

    <!-- Empty State -->
    <div v-else-if="!brandsStore.brands.length" class="empty-state">
      <div class="empty-icon-wrapper">
        <MaterialIcon icon="store" size="xl" color="var(--gold-primary)" />
      </div>
      <h3>{{ t('brands.noBusiness', 'No brands yet') }}</h3>
      <p>{{ t('brands.addFirst', 'Add your first brand to start connecting accounts.') }}</p>
      <BaseButton @click="showCreateModal = true" variant="primary">
        {{ t('brands.addFirstBusiness', 'Add Your First Business') }}
      </BaseButton>
    </div>

    <!-- Business Grid -->
    <div v-else class="brand-grid">
      <div
        v-for="(brand, index) in brandsStore.brands"
        :key="brand.id"
        class="brand-card"
        :style="{ animationDelay: `${index * 0.08}s` }"
        @click="openBusinessDetails(brand)"
      >
        <!-- Card Accent Line -->
        <div class="card-accent"></div>

        <div class="card-content">
          <!-- Logo -->
          <div class="brand-logo">
            <img
              v-if="brand.logo_url || brand.brand_dna?.logo_url"
              :src="brand.logo_url || brand.brand_dna?.logo_url"
              alt="Logo"
            />
            <span v-else class="logo-letter">
              {{ brand.name.charAt(0).toUpperCase() }}
            </span>
          </div>

          <!-- Info -->
          <div class="brand-details">
            <div class="name-row">
              <h3 class="brand-name">{{ brand.name }}</h3>
              <span v-if="brand.is_default" class="default-badge">
                <MaterialIcon icon="star" size="xs" color="var(--bronze-primary)" />
                Default
              </span>
            </div>

            <span class="type-label">{{ getBrandTypeLabel(brand.business_type) }}</span>

            <p v-if="brand.address" class="brand-address">
              <MaterialIcon icon="location_on" size="xs" color="var(--text-muted)" />
              {{ brand.address }}
            </p>
          </div>
        </div>

        <!-- Actions -->
        <div class="card-actions" @click.stop>
          <button class="action-btn" @click="openBusinessImages(brand)" :title="t('brands.photos', 'Photos')">
            <MaterialIcon icon="photo_library" size="sm" color="var(--text-secondary)" />
          </button>
          <button class="action-btn" @click="handleEdit(brand)" :title="t('common.edit', 'Edit')">
            <MaterialIcon icon="edit" size="sm" color="var(--text-secondary)" />
          </button>
          <button class="action-btn action-btn--danger" @click="confirmDelete(brand)" :title="t('common.delete', 'Delete')">
            <MaterialIcon icon="delete_outline" size="sm" color="var(--error-text)" />
          </button>
        </div>
      </div>
    </div>

    <Teleport to="body">
      <BrandFormModal
        v-model="showCreateModal"
        @saved="handleSaved"
      />
      <BrandFormModal
        v-if="selectedBrand"
        v-model="showEditModal"
        :brand="selectedBrand"
        @saved="handleSaved"
        @update:model-value="handleCloseEdit"
      />
      <ViewBrandModal
        v-if="selectedBrand"
        v-model="showBrandModal"
        :brand="selectedBrand"
        :initial-tab="brandModalTab"
        @updated="handleBrandUpdated"
        @update:model-value="handleBrandModalClose"
      />
    </Teleport>
  </div>
</template>

<style scoped>
.brand-management {
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
.brand-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: var(--space-xl);
}

/* ===== Card ===== */
.brand-card {
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

.brand-card:hover {
  border-color: rgba(26, 77, 58, 0.3);
  box-shadow:
    var(--shadow-lg),
    0 0 0 1px rgba(26, 77, 58, 0.08),
    inset 0 1px 0 0 rgba(26, 77, 58, 0.1);
  transform: translateY(-3px);
}

.brand-card:hover .card-accent {
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

.brand-logo {
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

.brand-logo img {
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

.brand-details {
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

.brand-name {
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

.brand-address {
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

  .brand-grid {
    grid-template-columns: 1fr;
    gap: var(--space-lg);
  }
}

@media (prefers-reduced-motion: reduce) {
  .brand-management,
  .brand-card {
    animation: none;
  }

  .brand-card:hover {
    transform: none;
  }
}
</style>
