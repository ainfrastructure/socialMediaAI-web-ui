<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useBusinessesStore } from '@/stores/businesses'
import type { SavedBusiness } from '@/services/businessService'
import BaseCard from './BaseCard.vue'
import BaseButton from './BaseButton.vue'
import CreateBusinessModal from './CreateBusinessModal.vue'
import ViewBusinessModal from './ViewBusinessModal.vue'

const { t } = useI18n()
const businessesStore = useBusinessesStore()

const showCreateModal = ref(false)
const showViewModal = ref(false)
const selectedBusiness = ref<SavedBusiness | null>(null)

onMounted(async () => {
  if (!businessesStore.businesses.length) {
    await businessesStore.fetchBusinesses()
  }
})

function viewBusiness(business: SavedBusiness) {
  selectedBusiness.value = business
  showViewModal.value = true
}

function editBusiness(business: SavedBusiness) {
  selectedBusiness.value = business
  showViewModal.value = true
}

async function confirmDelete(business: SavedBusiness) {
  const businessId = business.place_id || business.id
  if (confirm(t('businessManagement.deleteConfirmMessage', { name: business.name }))) {
    await businessesStore.deleteBusiness(businessId)
  }
}

async function handleBusinessCreated() {
  showCreateModal.value = false
  await businessesStore.fetchBusinesses()
}

async function handleBusinessUpdated() {
  console.log('Business updated, refreshing list...')

  // Force a fresh fetch from the API
  await businessesStore.fetchBusinesses()

  console.log('Businesses fetched:', businessesStore.businesses.length)

  // Update the selectedBusiness ref with fresh data from store
  if (selectedBusiness.value) {
    const businessId = selectedBusiness.value.place_id || selectedBusiness.value.id
    console.log('Looking for business with ID:', businessId)

    const updatedBusiness = businessesStore.businesses.find(
      r => (r.place_id || r.id) === businessId
    )

    if (updatedBusiness) {
      console.log('Found updated business:', updatedBusiness.name, 'Logo:', updatedBusiness.brand_dna?.logo_url)
      selectedBusiness.value = updatedBusiness
    } else {
      console.warn('Business not found in store after update')
    }
  }
}

function handleModalClose() {
  selectedBusiness.value = null
}
</script>

<template>
  <BaseCard variant="glass" class="section-card">
    <div class="section-header">
      <h2 class="section-title">{{ $t('profile.manageBusinesses') }}</h2>
      <BaseButton @click="showCreateModal = true" variant="primary" size="small">
        {{ $t('businessManagement.addBusiness') }}
      </BaseButton>
    </div>

    <!-- Loading State -->
    <div v-if="businessesStore.loading && !businessesStore.businesses.length" class="loading-state">
      {{ $t('common.loading') }}
    </div>

    <!-- Empty State -->
    <div v-else-if="!businessesStore.businesses.length" class="empty-state">
      <div class="empty-icon">🏪</div>
      <h3>{{ $t('businessManagement.noBusinesses') }}</h3>
      <p>{{ $t('businessManagement.noBusinessesHint') }}</p>
      <BaseButton @click="showCreateModal = true" variant="primary">
        {{ $t('businessManagement.addFirstBusiness') }}
      </BaseButton>
    </div>

    <!-- Businesses Grid -->
    <div v-else class="businesses-grid">
      <div
        v-for="business in businessesStore.businesses"
        :key="business.id"
        class="business-card"
        @click="viewBusiness(business)"
      >
        <!-- Logo -->
        <div class="business-logo">
          <img v-if="business.brand_dna?.logo_url" :src="business.brand_dna.logo_url" alt="Logo" />
          <div v-else class="logo-placeholder">
            {{ business.name.charAt(0).toUpperCase() }}
          </div>
        </div>

        <!-- Info -->
        <div class="business-info">
          <h3>{{ business.name }}</h3>
          <p>{{ business.address }}</p>

          <!-- Badges -->
          <div class="badges">
            <span v-if="business.is_manual" class="badge badge-manual">
              {{ $t('businessManagement.manualEntry') }}
            </span>
            <span v-else class="badge badge-places">
              {{ $t('businessManagement.googlePlaces') }}
            </span>
            <span v-if="business.uploaded_images?.length" class="badge badge-images">
              {{ $t('businessManagement.imagesCount', { count: business.uploaded_images.length }) }}
            </span>
          </div>
        </div>

        <!-- Actions -->
        <div class="business-actions" @click.stop>
          <BaseButton @click="editBusiness(business)" size="small" variant="ghost">
            {{ $t('common.edit') }}
          </BaseButton>
          <BaseButton @click="confirmDelete(business)" size="small" variant="danger">
            {{ $t('common.delete') }}
          </BaseButton>
        </div>
      </div>
    </div>

    <!-- Modals -->
    <Teleport to="body">
      <CreateBusinessModal
        v-model="showCreateModal"
        @created="handleBusinessCreated"
      />
      <ViewBusinessModal
        v-if="selectedBusiness"
        v-model="showViewModal"
        :business="selectedBusiness"
        @updated="handleBusinessUpdated"
        @update:model-value="handleModalClose"
      />
    </Teleport>
  </BaseCard>
</template>

<style scoped>
.section-card {
  animation: fadeInUp 0.6s var(--ease-smooth);
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--space-xl);
  padding-bottom: var(--space-lg);
  border-bottom: 1px solid rgba(15, 61, 46, 0.1);
}

.section-title {
  font-family: var(--font-heading);
  font-size: var(--text-2xl);
  color: var(--text-primary);
}

.loading-state,
.empty-state {
  padding: var(--space-3xl) var(--space-2xl);
  text-align: center;
}

.empty-icon {
  font-size: var(--text-5xl);
  margin-bottom: var(--space-lg);
}

.empty-state h3 {
  font-family: var(--font-heading);
  font-size: var(--text-xl);
  color: var(--text-primary);
  margin-bottom: var(--space-sm);
}

.empty-state p {
  color: var(--text-secondary);
  margin-bottom: var(--space-xl);
}

.businesses-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: var(--space-lg);
}

.business-card {
  background: transparent;
  border: none;
  border-radius: var(--radius-lg);
  padding: var(--space-lg);
  cursor: pointer;
  transition: var(--transition-base);
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
}

.business-card:hover {
  background: rgba(255, 255, 255, 0.1);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(15, 61, 46, 0.08);
}

.business-logo {
  width: 60px;
  height: 60px;
  border-radius: var(--radius-md);
  overflow: hidden;
  background: var(--bg-tertiary);
  display: flex;
  align-items: center;
  justify-content: center;
}

.business-logo img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.logo-placeholder {
  font-family: var(--font-heading);
  font-size: var(--text-2xl);
  font-weight: var(--font-bold);
  color: var(--gold-primary);
}

.business-info {
  flex: 1;
}

.business-info h3 {
  font-family: var(--font-heading);
  font-size: var(--text-lg);
  color: var(--text-primary);
  margin-bottom: var(--space-xs);
}

.business-info p {
  font-size: var(--text-sm);
  color: var(--text-secondary);
  margin-bottom: var(--space-md);
}

.badges {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-xs);
}

.badge {
  padding: var(--space-xs) var(--space-sm);
  border-radius: var(--radius-full);
  font-size: var(--text-xs);
  font-weight: var(--font-semibold);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.badge-manual {
  background: rgba(59, 130, 246, 0.2);
  color: #3b82f6;
  border: 1px solid rgba(59, 130, 246, 0.3);
}

.badge-places {
  background: rgba(15, 61, 46, 0.2);
  color: var(--gold-primary);
  border: 1px solid rgba(15, 61, 46, 0.3);
}

.badge-images {
  background: rgba(168, 85, 247, 0.2);
  color: #a855f7;
  border: 1px solid rgba(168, 85, 247, 0.3);
}

.business-actions {
  display: flex;
  gap: var(--space-sm);
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@media (max-width: 768px) {
  .section-header {
    flex-direction: column;
    align-items: flex-start;
    gap: var(--space-md);
  }

  .businesses-grid {
    grid-template-columns: 1fr;
  }

  .business-actions {
    flex-direction: column;
  }
}

@media (prefers-reduced-motion: reduce) {
  .section-card,
  .business-card {
    animation: none;
    transition: none;
  }
}
</style>
