<template>
  <div class="restaurant-search-view">
    <div class="container">
      <!-- Header -->
      <div class="header">
        <h1 class="title">{{ $t('restaurantSearch.title') }}</h1>
        <p class="subtitle">
          {{ $t('restaurantSearch.subtitle') }}
        </p>
      </div>

      <!-- Search Input -->
      <div class="search-wrapper">
        <RestaurantAutocomplete
          v-model="selectedRestaurant"
          label=""
          :placeholder="$t('restaurantSearch.searchPlaceholder')"
          autofocus
          @select="handleRestaurantSelect"
          @dropdownOpen="isAutocompleteOpen = $event"
        />
      </div>

      <!-- Quick Overview Stats -->
      <RestaurantQuickOverview
        v-if="selectedRestaurant && placeDetails && !isAutocompleteOpen"
        :place-details="placeDetails"
        :menu-data="menuData"
        :competitor-data="competitorData"
        :social-media-data="socialMediaData"
      />

      <!-- Restaurant Details Card -->
      <RestaurantDetailsCard
        v-if="selectedRestaurant && !isAutocompleteOpen"
        :restaurant="selectedRestaurant"
        :place-details="placeDetails"
        :loading-details="loadingDetails"
        :social-media-data="socialMediaData"
        :loading-social-media="loadingSocialMedia"
        :social-media-error="socialMediaError"
        v-model:selected-photo-indices="selectedPhotoIndices"
        v-model:upload-files="uploadFiles"
        @upload-error="uploadError = $event"
      />

<<<<<<< Updated upstream
      <!-- Brand DNA Card -->
      <BrandDNACard
        v-if="selectedRestaurant && !isAutocompleteOpen"
        :brand-d-n-a="brandDNA"
        :loading="loadingBrandDNA"
        :error="brandDNAError"
        :website-url="placeDetails?.website"
      />

      <!-- Reviews Section -->
      <ReviewsSection
        v-if="placeDetails && placeDetails.reviews && placeDetails.reviews.length > 0 && !isAutocompleteOpen"
        :reviews="placeDetails.reviews"
        v-model:current-page="reviewsPage"
        :per-page="reviewsPerPage"
      />

      <!-- Competitors Section -->
      <CompetitorsSection
        v-if="selectedRestaurant && !isAutocompleteOpen"
        :competitor-data="competitorData"
        :loading="loadingCompetitors"
        :error="competitorError"
        v-model:current-page="competitorsPage"
        :per-page="competitorsPerPage"
      />

      <!-- Menu Section -->
      <MenuSection
        v-if="selectedRestaurant && !isAutocompleteOpen"
        :menu-data="menuData"
        :loading="loadingMenu"
        :error="menuError"
        v-model:current-page="menuPage"
        :per-page="menuItemsPerPage"
      />

      <!-- Save Actions Alerts -->
      <div v-if="selectedRestaurant && !isAutocompleteOpen" class="actions-section">
        <BaseAlert v-if="saveSuccess" type="success">
          {{ saveSuccessMessage }}
        </BaseAlert>

        <BaseAlert v-if="saveError" type="error">
          {{ saveError }}
        </BaseAlert>
      </div>
    </div>

    <!-- Sticky CTA Button -->
    <StickyCTA
      v-if="selectedRestaurant && placeDetails && !isAutocompleteOpen"
      :visible="true"
      :disabled="savingRestaurant || loadingDetails || loadingMenu || loadingCompetitors || loadingSocialMedia"
      :loading="savingRestaurant"
      :saved="isSaved"
      :restaurant-name="selectedRestaurant.name"
      @back="clearSelection"
      @continue="saveAndContinue"
    />
=======
              <div v-if="placeDetails.opening_hours?.open_now !== undefined" class="stat-item">
                <div class="stat-icon">{{ placeDetails.opening_hours.open_now ? '🟢' : '🔴' }}</div>
                <div class="stat-content">
                  <div class="stat-label">Status</div>
                  <div class="stat-value">{{ placeDetails.opening_hours.open_now ? 'Open Now' : 'Closed' }}</div>
                </div>
              </div>

              <div v-if="menuData?.items" class="stat-item">
                <div class="stat-icon">📋</div>
                <div class="stat-content">
                  <div class="stat-label">Menu Items</div>
                  <div class="stat-value">
                    {{ menuData.items.length }}
                    <span class="stat-subtext">({{ menuData.platform }})</span>
                  </div>
                </div>
              </div>

              <div v-if="competitorData?.totalFound" class="stat-item">
                <div class="stat-icon">🏪</div>
                <div class="stat-content">
                  <div class="stat-label">Competitors</div>
                  <div class="stat-value">
                    {{ competitorData.totalFound }}
                    <span class="stat-subtext">({{ competitorData.radiusKm }}km)</span>
                  </div>
                </div>
              </div>

              <div v-if="placeDetails.reviews" class="stat-item">
                <div class="stat-icon">💬</div>
                <div class="stat-content">
                  <div class="stat-label">Reviews</div>
                  <div class="stat-value">{{ placeDetails.reviews.length }}</div>
                </div>
              </div>

              <div v-if="socialMediaData && socialMediaData.searchDetails.totalFound > 0" class="stat-item">
                <div class="stat-icon">🌐</div>
                <div class="stat-content">
                  <div class="stat-label">Social Media</div>
                  <div class="stat-value">{{ socialMediaData.searchDetails.totalFound }} profiles</div>
                </div>
              </div>
            </div>
        </BaseCard>
      </div>

      <!-- Main Tabbed Card -->
      <BaseCard v-if="selectedRestaurant && placeDetails" variant="glass-intense" class="main-tabbed-card">
        <div class="restaurant-header">
          <div class="restaurant-header-content">
            <h2 class="restaurant-name">{{ selectedRestaurant.name }}</h2>
            <p class="restaurant-address">{{ selectedRestaurant.address }}</p>
          </div>
        </div>

        <!-- Tab Navigation -->
        <BaseTabNav v-model="activeTab" :tabs="tabs" />

        <!-- Tab Content -->
        <div class="tab-content">
          <!-- About Tab -->
          <div v-if="activeTab === 'about'" class="tab-panel about-panel">
            <!-- Brand Identity -->
            <div v-if="placeDetails?.website && (loadingBrandDNA || brandDNA)" class="section-block brand-identity-block">
              <h3 class="section-title">Brand Identity</h3>

              <div v-if="loadingBrandDNA" class="loading-text">
                Analyzing brand identity...
              </div>

              <div v-else-if="brandDNA" class="brand-identity-content">
                <div class="brand-identity-grid">
                  <!-- Logo -->
                  <div v-if="brandDNA.logo_url" class="brand-logo-section">
                    <img
                      :src="brandDNA.logo_url"
                      :alt="brandDNA.brand_name || 'Restaurant logo'"
                      class="brand-logo"
                      @error="handleLogoError"
                    />
                  </div>

                  <!-- Brand Details -->
                  <div class="brand-details">
                    <div v-if="brandDNA.brand_name" class="brand-detail-row">
                      <span class="detail-label">Name</span>
                      <span class="detail-value">{{ brandDNA.brand_name }}</span>
                    </div>

                    <div v-if="brandDNA.font_style" class="brand-detail-row">
                      <span class="detail-label">Typography</span>
                      <span class="detail-value font-style">{{ brandDNA.font_style }}</span>
                    </div>

                    <div v-if="brandDNA.primary_color || brandDNA.secondary_color || brandDNA.additional_colors?.length" class="brand-detail-row">
                      <span class="detail-label">Colors</span>
                      <div class="detail-value">
                        <div class="color-palette">
                          <div
                            v-if="brandDNA.primary_color"
                            class="color-chip"
                            :style="{ backgroundColor: brandDNA.primary_color }"
                            :title="brandDNA.primary_color"
                          />
                          <div
                            v-if="brandDNA.secondary_color"
                            class="color-chip"
                            :style="{ backgroundColor: brandDNA.secondary_color }"
                            :title="brandDNA.secondary_color"
                          />
                          <div
                            v-for="(color, index) in brandDNA.additional_colors?.slice(0, 3)"
                            :key="index"
                            class="color-chip"
                            :style="{ backgroundColor: color }"
                            :title="color"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Opening Hours -->
            <div class="section-block">
              <h3 class="section-title">Opening Hours</h3>
              <div v-if="loadingDetails" class="loading-text">
                Loading hours...
              </div>
              <div v-else-if="placeDetails.opening_hours" class="opening-hours">
                <div v-if="placeDetails.opening_hours.open_now !== undefined" class="status-badge" :class="{ 'open': placeDetails.opening_hours.open_now, 'closed': !placeDetails.opening_hours.open_now }">
                  {{ placeDetails.opening_hours.open_now ? '🟢 Open Now' : '🔴 Closed' }}
                </div>
                <div v-if="placeDetails.opening_hours.weekday_text && placeDetails.opening_hours.weekday_text.length > 0" class="hours-list">
                  <div
                    v-for="(day, index) in placeDetails.opening_hours.weekday_text"
                    :key="index"
                    class="hours-item"
                  >
                    {{ day }}
                  </div>
                </div>
              </div>
              <div v-else class="no-hours">
                Hours not available
              </div>
            </div>

            <!-- Contact Information & Links -->
            <div class="section-block">
              <h3 class="section-title">Contact & Links</h3>
              <div class="info-grid">
                <div v-if="placeDetails.rating" class="info-item">
                  <span class="info-icon">⭐</span>
                  <div class="info-content">
                    <span class="info-value">{{ placeDetails.rating }} / 5</span>
                    <span v-if="placeDetails.user_ratings_total" class="info-meta">
                      {{ placeDetails.user_ratings_total }} reviews
                    </span>
                  </div>
                </div>

                <div v-if="placeDetails.phone_number" class="info-item">
                  <span class="info-icon">📞</span>
                  <div class="info-content">
                    <a :href="`tel:${placeDetails.phone_number}`" class="info-link">{{ placeDetails.phone_number }}</a>
                  </div>
                </div>

                <div v-if="placeDetails.website" class="info-item">
                  <span class="info-icon">🌐</span>
                  <div class="info-content">
                    <a :href="placeDetails.website" target="_blank" rel="noopener noreferrer" class="info-link">
                      Visit Website
                    </a>
                  </div>
                </div>
              </div>

              <!-- Social Media Links -->
              <div v-if="!loadingSocialMedia && socialMediaData && socialMediaData.searchDetails.totalFound > 0" class="social-section">
                <h4 class="subsection-title">Social Media</h4>
                <div class="social-media-links">
                  <a
                    v-if="socialMediaData.socialMedia.facebook"
                    :href="socialMediaData.socialMedia.facebook"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="social-link facebook"
                    title="Facebook"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                    </svg>
                  </a>
                  <a
                    v-if="socialMediaData.socialMedia.instagram"
                    :href="socialMediaData.socialMedia.instagram"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="social-link instagram"
                    title="Instagram"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                    </svg>
                  </a>
                  <a
                    v-if="socialMediaData.socialMedia.twitter"
                    :href="socialMediaData.socialMedia.twitter"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="social-link twitter"
                    title="Twitter/X"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                    </svg>
                  </a>
                  <a
                    v-if="socialMediaData.socialMedia.youtube"
                    :href="socialMediaData.socialMedia.youtube"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="social-link youtube"
                    title="YouTube"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                    </svg>
                  </a>
                  <a
                    v-if="socialMediaData.socialMedia.tiktok"
                    :href="socialMediaData.socialMedia.tiktok"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="social-link tiktok"
                    title="TikTok"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
                    </svg>
                  </a>
                </div>
              </div>
            </div>

            <!-- Type Tags -->
            <div v-if="selectedRestaurant.types && selectedRestaurant.types.length > 0" class="section-block">
              <h3 class="section-title">Categories</h3>
              <div class="type-tags">
                <span
                  v-for="type in selectedRestaurant.types.slice(0, 5)"
                  :key="type"
                  class="type-tag"
                >
                  {{ formatType(type) }}
                </span>
              </div>
            </div>
          </div>

          <!-- Competitors Tab -->
          <div v-if="activeTab === 'competitors'" class="tab-panel competitors-panel">
            <div v-if="loadingCompetitors" class="loading-state">
              <div class="spinner"></div>
              <p>Finding nearby competitors...</p>
            </div>

            <BaseAlert v-else-if="competitorError" type="info">
              {{ competitorError }}
            </BaseAlert>

            <div v-else-if="competitorData && competitorData.competitors.length > 0">
              <div class="competitors-info">
                <p class="competitors-description">
                  Found {{ competitorData.totalFound }} similar restaurant{{ competitorData.totalFound === 1 ? '' : 's' }} near <strong>{{ competitorData.searchCenter.name }}</strong>
                </p>
              </div>

              <div class="competitors-list">
                <div
                  v-for="(competitor, index) in paginatedCompetitors"
                  :key="competitor.place_id"
                  class="competitor-item"
                >
                  <div class="competitor-number">{{ (competitorsPage - 1) * competitorsPerPage + index + 1 }}</div>
                  <div class="competitor-details">
                    <div class="competitor-header">
                      <h3 class="competitor-name">{{ competitor.name }}</h3>
                      <span class="competitor-distance">{{ competitor.distance }} km</span>
                    </div>
                    <p class="competitor-address">{{ competitor.address }}</p>
                    <div class="competitor-meta">
                      <div v-if="competitor.rating" class="competitor-rating">
                        ⭐ {{ competitor.rating }}
                        <span v-if="competitor.user_ratings_total" class="rating-count">
                          ({{ competitor.user_ratings_total }})
                        </span>
                      </div>
                      <div v-if="competitor.types && competitor.types.length > 0" class="competitor-types">
                        <span
                          v-for="type in competitor.types.slice(0, 3)"
                          :key="type"
                          class="type-tag-small"
                        >
                          {{ formatType(type) }}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <BasePagination
                v-if="competitorsTotalPages > 1"
                v-model:current-page="competitorsPage"
                :total-pages="competitorsTotalPages"
                :total-items="competitorData.competitors.length"
              />
            </div>

            <div v-else class="empty-state">
              <p>Select a restaurant to find nearby competitors</p>
            </div>
          </div>

          <!-- Menu Tab -->
          <div v-if="activeTab === 'menu'" class="tab-panel menu-panel">
            <div v-if="loadingMenu" class="loading-state">
              <div class="spinner"></div>
              <p>Searching for menu on Wolt and Foodora...</p>
            </div>

            <BaseAlert v-else-if="menuError" type="warning">
              {{ menuError }}
            </BaseAlert>

            <div v-else-if="menuData && menuData.items.length > 0">
              <div class="menu-info">
                <p class="menu-source">
                  Found {{ menuData.items.length }} items from
                  <a :href="menuData.url" target="_blank" rel="noopener noreferrer" class="menu-link">
                    {{ menuData.platform === 'wolt' ? 'Wolt' : 'Foodora' }}
                  </a>
                </p>
              </div>

              <div class="menu-items">
                <MenuItemCard
                  v-for="(item, index) in paginatedMenuItems"
                  :key="index"
                  :item="item"
                />
              </div>

              <BasePagination
                v-if="menuTotalPages > 1"
                v-model:current-page="menuPage"
                :total-pages="menuTotalPages"
                :total-items="menuData.items.length"
              />
            </div>

            <div v-else class="empty-state">
              <p>Select a restaurant to view its menu</p>
            </div>
          </div>
        </div>

        <!-- Save Actions -->
        <div class="actions-section">
          <BaseAlert v-if="saveSuccess" type="success">
            {{ saveSuccessMessage }}
          </BaseAlert>

          <BaseAlert v-if="saveError" type="error">
            {{ saveError }}
          </BaseAlert>
        </div>
      </BaseCard>

    </div>

    <!-- Sticky CTA Button -->
    <div v-if="selectedRestaurant && placeDetails" class="sticky-cta">
      <div class="sticky-cta-content">
        <button class="back-button" @click="clearSelection" aria-label="Back to search">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M19 12H5M12 19l-7-7 7-7"/>
          </svg>
        </button>
        <BaseButton
          variant="primary"
          size="large"
          class="continue-button"
          :disabled="savingRestaurant || loadingDetails || loadingMenu || loadingCompetitors || loadingSocialMedia"
          @click="saveAndContinue"
        >
          {{ savingRestaurant ? 'Saving...' : isSaved ? 'Continue to Content Creation →' : 'Save & Continue to Content Creation →' }}
        </BaseButton>
      </div>
    </div>
>>>>>>> Stashed changes

    <!-- Progress Modal -->
    <ProgressModal
      v-model="showProgressModal"
      :title="$t('restaurantSearch.savingRestaurant')"
      :progress="progressPercentage"
      :current-message="progressMessage"
      :steps="progressSteps"
      :current-step-index="currentProgressStep"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import BaseAlert from '../components/BaseAlert.vue'
<<<<<<< Updated upstream
import RestaurantAutocomplete from '../components/RestaurantAutocomplete.vue'
import RestaurantQuickOverview from '../components/RestaurantQuickOverview.vue'
import RestaurantDetailsCard from '../components/RestaurantDetailsCard.vue'
import BrandDNACard from '../components/BrandDNACard.vue'
import ReviewsSection from '../components/ReviewsSection.vue'
import CompetitorsSection from '../components/CompetitorsSection.vue'
import MenuSection from '../components/MenuSection.vue'
import StickyCTA from '../components/StickyCTA.vue'
=======
import BasePagination from '../components/BasePagination.vue'
import BaseTabNav from '../components/BaseTabNav.vue'
import RestaurantAutocomplete from '../components/RestaurantAutocomplete.vue'
import MenuItemCard from '../components/MenuItemCard.vue'
>>>>>>> Stashed changes
import ProgressModal from '../components/ProgressModal.vue'
import type { RestaurantSuggestion, PlaceDetails, CompetitorSearchResponse } from '../services/placesService'
import { placesService } from '../services/placesService'
import { menuService, type MenuData } from '../services/menuService'
import { socialMediaService, type SocialMediaSearchResult } from '../services/socialMediaService'
import { restaurantService } from '../services/restaurantService'
import { api } from '../services/api'

const router = useRouter()
const { t } = useI18n()

// Restaurant data
const selectedRestaurant = ref<RestaurantSuggestion | null>(null)
const placeDetails = ref<PlaceDetails | null>(null)
const loadingDetails = ref(false)
const menuData = ref<MenuData | null>(null)
const loadingMenu = ref(false)
const menuError = ref<string | null>(null)
const competitorData = ref<CompetitorSearchResponse | null>(null)
const loadingCompetitors = ref(false)
const competitorError = ref<string | null>(null)
const socialMediaData = ref<SocialMediaSearchResult | null>(null)
const loadingSocialMedia = ref(false)
const socialMediaError = ref<string | null>(null)
const brandDNA = ref<any | null>(null)
const loadingBrandDNA = ref(false)
const brandDNAError = ref<string | null>(null)

// Save to database state
const savingRestaurant = ref(false)
const saveError = ref<string | null>(null)
const saveSuccess = ref(false)
const saveSuccessMessage = ref<string>(t('restaurantSearch.restaurantSaved'))
const isSaved = ref(false)

<<<<<<< Updated upstream
// Image selection and upload
const selectedPhotoIndices = ref<number[]>([])
const uploadFiles = ref<File[]>([])
const uploadingImages = ref(false)
const uploadError = ref<string | null>(null)

// Autocomplete dropdown state
const isAutocompleteOpen = ref(false)
=======
// Tab navigation
const activeTab = ref<'about' | 'competitors' | 'menu'>('about')
const tabs = [
  { id: 'about', label: 'About', icon: 'ℹ️' },
  { id: 'competitors', label: 'Competitors', icon: '🏪' },
  { id: 'menu', label: 'Menu', icon: '📋' }
]
>>>>>>> Stashed changes

// Progress modal state
const showProgressModal = ref(false)
const progressPercentage = ref(0)
const progressMessage = ref('')
const progressSteps = ref<string[]>([
  t('restaurantSearch.savingData'),
  t('restaurantSearch.processingImages'),
  t('restaurantSearch.analyzingMenu'),
  t('restaurantSearch.finalizingSetup')
])
const currentProgressStep = ref(0)

// Pagination
const reviewsPage = ref(1)
const reviewsPerPage = 3
const menuPage = ref(1)
const menuItemsPerPage = 9
const competitorsPage = ref(1)
const competitorsPerPage = 5

// Scroll to top when pagination changes
const scrollToTop = () => {
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

watch(reviewsPage, scrollToTop)
watch(menuPage, scrollToTop)
watch(competitorsPage, scrollToTop)

// Restaurant selection handler
const handleRestaurantSelect = async (restaurant: RestaurantSuggestion) => {
  // Clear previous data
  menuData.value = null
  menuError.value = null
  placeDetails.value = null
  competitorData.value = null
  competitorError.value = null
  socialMediaData.value = null
  socialMediaError.value = null
  brandDNA.value = null
  brandDNAError.value = null
  saveError.value = null
  saveSuccess.value = false
  isSaved.value = false
  reviewsPage.value = 1
  menuPage.value = 1
  competitorsPage.value = 1
  activeTab.value = 'about' // Reset to first tab

  // Fetch place details first to get website
  await fetchPlaceDetails(restaurant.place_id)

  // Then fetch everything else in parallel (including brand DNA if website exists)
  const promises = [
    fetchMenu(restaurant.place_id, restaurant.name),
    fetchCompetitors(restaurant.place_id),
    fetchSocialMedia(restaurant.place_id)
  ]

  // Add brand DNA analysis if website is available
  const website = placeDetails.value?.website
  if (website) {
    promises.push(fetchBrandDNA(website, restaurant.place_id))
  }

  await Promise.all(promises)
}

const fetchPlaceDetails = async (placeId: string) => {
  try {
    loadingDetails.value = true
    const details = await placesService.getPlaceDetails(placeId)
    placeDetails.value = details
  } catch (error: any) {
    // Don't show error to user, just log it
    console.error('Failed to fetch place details:', error)
  } finally {
    loadingDetails.value = false
  }
}

const fetchMenu = async (placeId: string, restaurantName: string) => {
  try {
    loadingMenu.value = true
    menuError.value = null

    const data = await menuService.getRestaurantMenu(placeId, restaurantName)
    menuData.value = data

    if (!data || data.items.length === 0) {
      menuError.value = t('restaurantSearch.noMenuFound')
    }
  } catch (error: any) {
    menuError.value = error.message || t('restaurantSearch.menuNotAvailable')
  } finally {
    loadingMenu.value = false
  }
}

const fetchCompetitors = async (placeId: string) => {
  try {
    loadingCompetitors.value = true
    competitorError.value = null

    const data = await placesService.findCompetitors(placeId, 1) // 1 km radius
    competitorData.value = data

    if (!data || data.competitors.length === 0) {
      competitorError.value = t('restaurantSearch.noCompetitorsFound', { radius: 1 })
    }
  } catch (error: any) {
    competitorError.value = error.message || t('restaurantSearch.noCompetitorsFound', { radius: 1 })
  } finally {
    loadingCompetitors.value = false
  }
}

const fetchSocialMedia = async (placeId: string) => {
  try {
    loadingSocialMedia.value = true
    socialMediaError.value = null

    const data = await socialMediaService.getSocialMediaByPlaceId(placeId)
    socialMediaData.value = data

    if (!data || data.searchDetails.totalFound === 0) {
      socialMediaError.value = t('restaurantSearch.noSocialMediaFound')
    }
  } catch (error: any) {
    socialMediaError.value = error.message || t('restaurantSearch.noSocialMediaFound')
  } finally {
    loadingSocialMedia.value = false
  }
}

const fetchBrandDNA = async (website: string, placeId?: string) => {
  try {
    loadingBrandDNA.value = true
    brandDNAError.value = null

    const response = await api.analyzeBrandDNA(website, placeId)

    if (response.success && (response as any).brandDNA) {
      brandDNA.value = (response as any).brandDNA
    } else {
      brandDNAError.value = 'Could not extract brand DNA'
    }
  } catch (error: any) {
    brandDNAError.value = error.message || 'Failed to analyze brand DNA'
  } finally {
    loadingBrandDNA.value = false
  }
}

const clearSelection = () => {
  selectedRestaurant.value = null
  placeDetails.value = null
  menuData.value = null
  menuError.value = null
  competitorData.value = null
  competitorError.value = null
  socialMediaData.value = null
  socialMediaError.value = null
  brandDNA.value = null
  brandDNAError.value = null
  saveError.value = null
  saveSuccess.value = false
  isSaved.value = false
  reviewsPage.value = 1
  menuPage.value = 1
  competitorsPage.value = 1
  activeTab.value = 'about'

  // Scroll to top and focus search field
  window.scrollTo({ top: 0, behavior: 'smooth' })

  // Focus the search input after a short delay to allow for DOM update
  setTimeout(() => {
    const searchInput = document.querySelector('.autocomplete-container input') as HTMLInputElement
    if (searchInput) {
      searchInput.focus()
    }
  }, 300)
}

const saveToDatabase = async () => {
  if (!selectedRestaurant.value || !placeDetails.value) {
    saveError.value = 'Missing restaurant data'
    return
  }

  try {
    savingRestaurant.value = true
    saveError.value = null
    saveSuccess.value = false

    // Prepare restaurant data for saving
    const reviews = placeDetails.value.reviews ? placeDetails.value.reviews.slice(0, 5) : null

    const restaurantData = {
      place_id: selectedRestaurant.value.place_id,
      name: selectedRestaurant.value.name,
      address: selectedRestaurant.value.address,
      location: placeDetails.value.location || null,
      phone_number: placeDetails.value.phone_number || null,
      website: placeDetails.value.website || null,
      rating: placeDetails.value.rating || null,
      user_ratings_total: placeDetails.value.user_ratings_total || null,
      types: selectedRestaurant.value.types || placeDetails.value.types || null,
      opening_hours: placeDetails.value.opening_hours || null,
      reviews,
      competitors: competitorData.value?.competitors || null,
      competitor_analysis: competitorData.value ? {
        totalFound: competitorData.value.totalFound,
        radiusKm: competitorData.value.radiusKm,
        searchCenter: competitorData.value.searchCenter
      } : null,
      menu: menuData.value || null,
      social_media: socialMediaData.value?.socialMedia || null,
      brand_dna: brandDNA.value || null,
      photos: placeDetails.value.photos ? {
        photos: placeDetails.value.photos,
        photoUrls: placeDetails.value.photoUrls
      } : null,
    }

    const result = await restaurantService.saveRestaurant(restaurantData)

    if (result.success) {
<<<<<<< Updated upstream
      saveSuccessMessage.value = result.message || t('restaurantSearch.restaurantSaved')

      // If there are files to upload, upload them now
      if (uploadFiles.value.length > 0) {
        try {
          uploadingImages.value = true
          uploadError.value = null

          const uploadResult = await restaurantService.uploadRestaurantImages(
            selectedRestaurant.value.place_id,
            uploadFiles.value
          )

          if (uploadResult.count > 0) {
            saveSuccessMessage.value = `${saveSuccessMessage.value} ${t('restaurantSearch.imagesUploaded', { count: uploadResult.count })}`
          }

          uploadFiles.value = []
        } catch (uploadErr: any) {
          uploadError.value = uploadErr.message || t('restaurantSearch.failedToUpload')
        } finally {
          uploadingImages.value = false
        }
      }

=======
      // Set success message from backend
      saveSuccessMessage.value = result.message || 'Restaurant saved to database successfully!'
>>>>>>> Stashed changes
      saveSuccess.value = true
      isSaved.value = true
    } else {
      if (result.error && result.error.includes('already saved')) {
        saveError.value = t('restaurantSearch.restaurantAlreadySaved')
        isSaved.value = true
      } else {
        saveError.value = result.error || t('restaurantSearch.failedToSave')
      }
    }
  } catch (error: any) {
    saveError.value = error.message || t('restaurantSearch.failedToSave')
  } finally {
    savingRestaurant.value = false
  }
}

const simulateProgress = async () => {
  progressPercentage.value = 0
  currentProgressStep.value = 0

  const steps = [
    { step: 0, message: t('restaurantSearch.savingData'), delay: 800, progress: 25 },
    { step: 1, message: t('restaurantSearch.processingImages'), delay: 1200, progress: 50 },
    { step: 2, message: t('restaurantSearch.analyzingMenu'), delay: 1000, progress: 75 },
    { step: 3, message: t('restaurantSearch.finalizingSetup'), delay: 800, progress: 100 }
  ]

  for (const stepConfig of steps) {
    currentProgressStep.value = stepConfig.step
    progressMessage.value = stepConfig.message

    const targetProgress = stepConfig.progress
    const currentProgress = progressPercentage.value
    const increment = (targetProgress - currentProgress) / 10

    for (let i = 0; i < 10; i++) {
      await new Promise(resolve => setTimeout(resolve, stepConfig.delay / 10))
      progressPercentage.value = Math.min(currentProgress + (increment * (i + 1)), targetProgress)
    }
  }
}

const saveAndContinue = async () => {
  if (isSaved.value) {
    // Already saved, show quick animation then navigate
    showProgressModal.value = true
    progressMessage.value = t('restaurantSearch.redirecting')
    progressPercentage.value = 100
    currentProgressStep.value = 3

    await new Promise(resolve => setTimeout(resolve, 800))

    showProgressModal.value = false

    router.push({
      name: 'playground',
      query: { restaurant: selectedRestaurant.value?.place_id }
    })
  } else {
    // Show progress modal
    showProgressModal.value = true

    // Start fake progress animation
    const progressPromise = simulateProgress()

    // Save to database (real operation)
    await saveToDatabase()

    // Wait for progress animation to complete
    await progressPromise

    // Keep modal visible for a moment at 100%
    await new Promise(resolve => setTimeout(resolve, 500))

    // Hide modal
    showProgressModal.value = false

    // Only navigate if save was successful
    if (isSaved.value) {
      router.push({
        name: 'playground',
        query: { restaurant: selectedRestaurant.value?.place_id }
      })
    }
  }
}
</script>

<style scoped>
.restaurant-search-view {
  min-height: 100vh;
  padding: var(--space-3xl) var(--space-2xl);
  background: var(--bg-primary);
}

.container {
  max-width: var(--max-width-lg);
  margin: 0 auto;
  padding-bottom: 120px; /* Space for sticky CTA button */
  display: flex;
  flex-direction: column;
  gap: var(--space-2xl); /* Add spacing between all sections */
}

.header {
  text-align: center;
  margin-bottom: var(--space-3xl);
  animation: fadeInUp 0.6s var(--ease-smooth);
}

.title {
  font-family: var(--font-heading);
  font-size: var(--text-4xl);
  font-weight: var(--font-bold);
  margin: 0 0 var(--space-lg) 0;
  background: var(--gradient-gold);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.subtitle {
  font-size: var(--text-lg);
  color: var(--text-secondary);
  margin: 0;
  line-height: var(--leading-normal);
<<<<<<< Updated upstream
  max-width: 600px;
=======
}

/* Search Wrapper - Pill Style */
.search-wrapper {
  margin-bottom: var(--space-3xl);
  animation: fadeInUp 0.6s var(--ease-smooth);
  animation-delay: 0.1s;
  animation-fill-mode: both;
}

.search-wrapper :deep(.autocomplete-container input) {
  background: transparent;
  border: none;
  border-bottom: 2px solid var(--gold-primary);
  border-radius: 0;
  padding: var(--space-lg) 0;
  font-size: var(--text-xl);
  color: var(--gold-primary);
  text-align: center;
  transition: var(--transition-base);
}

.search-wrapper :deep(.autocomplete-container input::placeholder) {
  color: rgba(212, 175, 55, 0.5);
}

.search-wrapper :deep(.autocomplete-container input:focus) {
  border-bottom-color: var(--gold-light);
  outline: none;
}

.search-wrapper :deep(.autocomplete-container label) {
  display: none;
}

/* Quick Overview */
.quick-overview-section {
  margin-bottom: var(--space-2xl);
  animation: fadeInUp 0.6s var(--ease-smooth);
  animation-delay: 0.15s;
  animation-fill-mode: both;
}

/* Main Tabbed Card */
.main-tabbed-card {
  margin-bottom: var(--space-2xl);
  animation: fadeInUp 0.6s var(--ease-smooth);
  animation-delay: 0.2s;
  animation-fill-mode: both;
}

.restaurant-header {
  padding-bottom: var(--space-2xl);
  margin-bottom: var(--space-2xl);
  border-bottom: 1px solid rgba(212, 175, 55, 0.1);
}

.restaurant-header-content {
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
}

.restaurant-name {
  font-family: var(--font-heading);
  font-size: var(--text-3xl);
  font-weight: var(--font-bold);
  color: var(--text-primary);
  margin: 0;
}

.restaurant-address {
  font-size: var(--text-lg);
  color: var(--text-secondary);
  margin: 0;
}

/* Tab Content */
.tab-content {
  margin-top: var(--space-2xl);
}

.tab-panel {
  animation: fadeIn 0.3s var(--ease-smooth);
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.section-block {
  padding: var(--space-2xl);
  background: rgba(0, 0, 0, 0.2);
  border: 1px solid rgba(212, 175, 55, 0.1);
  border-radius: var(--radius-lg);
  margin-bottom: var(--space-xl);
}

.section-block:last-child {
  margin-bottom: 0;
}

.section-title {
  font-family: var(--font-heading);
  font-size: var(--text-xl);
  font-weight: var(--font-semibold);
  color: var(--text-primary);
  margin: 0 0 var(--space-lg) 0;
  padding-bottom: var(--space-md);
  border-bottom: 1px solid rgba(212, 175, 55, 0.15);
}

.brand-subsection {
  margin-top: var(--space-xl);
}

.subsection-label {
  font-size: var(--text-sm);
  font-weight: var(--font-semibold);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--text-secondary);
  margin: 0 0 var(--space-md) 0;
}

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--space-4xl);
  gap: var(--space-lg);
}

.loading-state p {
  color: var(--text-secondary);
  margin: 0;
}

.empty-state {
  text-align: center;
  padding: var(--space-4xl);
  color: var(--text-secondary);
}

.empty-state p {
  margin: 0;
}

/* Brand Identity - Elegant Design */
.brand-identity-block {
  background: linear-gradient(135deg, rgba(212, 175, 55, 0.05), rgba(0, 0, 0, 0.2));
}

.brand-identity-content {
  margin-top: var(--space-lg);
}

.brand-identity-grid {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: var(--space-2xl);
  align-items: start;
}

.brand-logo-section {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--space-lg);
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(212, 175, 55, 0.1);
  border-radius: var(--radius-md);
  min-width: 120px;
}

.brand-logo {
  max-width: 100px;
  max-height: 100px;
  object-fit: contain;
}

.brand-details {
  display: flex;
  flex-direction: column;
  gap: var(--space-lg);
}

.brand-detail-row {
  display: flex;
  align-items: center;
  gap: var(--space-xl);
  padding-bottom: var(--space-lg);
  border-bottom: 1px solid rgba(212, 175, 55, 0.08);
}

.brand-detail-row:last-child {
  border-bottom: none;
  padding-bottom: 0;
}

.detail-label {
  font-size: var(--text-sm);
  font-weight: var(--font-semibold);
  color: var(--text-secondary);
  min-width: 100px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.detail-value {
  font-size: var(--text-base);
  font-weight: var(--font-medium);
  color: var(--text-primary);
  flex: 1;
}

.detail-value.font-style {
  font-style: italic;
  color: var(--gold-primary);
}

.color-palette {
  display: flex;
  gap: var(--space-sm);
  align-items: center;
}

.color-chip {
  width: 32px;
  height: 32px;
  border-radius: var(--radius-sm);
  border: 2px solid rgba(255, 255, 255, 0.1);
  cursor: pointer;
  transition: var(--transition-base);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.color-chip:hover {
  transform: scale(1.1);
  border-color: var(--gold-primary);
}

/* Social Media in Contacts */
.social-section {
  margin-top: var(--space-xl);
  padding-top: var(--space-xl);
  border-top: 1px solid rgba(212, 175, 55, 0.1);
}

.subsection-title {
  font-size: var(--text-sm);
  font-weight: var(--font-semibold);
  color: var(--text-secondary);
  margin: 0 0 var(--space-md) 0;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.social-media-links {
  display: flex;
  gap: var(--space-sm);
  flex-wrap: wrap;
}

.social-link {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: var(--radius-sm);
  transition: all var(--transition-base);
  text-decoration: none;
  border: 1px solid;
}

.social-link svg {
  width: 18px;
  height: 18px;
}

.social-link.facebook {
  background: rgba(66, 103, 178, 0.08);
  border-color: rgba(66, 103, 178, 0.2);
  color: #4267B2;
}

.social-link.facebook:hover {
  background: rgba(66, 103, 178, 0.15);
  border-color: #4267B2;
  transform: translateY(-2px);
}

.social-link.instagram {
  background: rgba(225, 48, 108, 0.08);
  border-color: rgba(225, 48, 108, 0.2);
  color: #E1306C;
}

.social-link.instagram:hover {
  background: rgba(225, 48, 108, 0.15);
  border-color: #E1306C;
  transform: translateY(-2px);
}

.social-link.twitter {
  background: rgba(255, 255, 255, 0.05);
  border-color: rgba(255, 255, 255, 0.2);
  color: var(--text-primary);
}

.social-link.twitter:hover {
  background: rgba(255, 255, 255, 0.1);
  border-color: var(--text-primary);
  transform: translateY(-2px);
}

.social-link.youtube {
  background: rgba(255, 0, 0, 0.08);
  border-color: rgba(255, 0, 0, 0.2);
  color: #FF0000;
}

.social-link.youtube:hover {
  background: rgba(255, 0, 0, 0.15);
  border-color: #FF0000;
  transform: translateY(-2px);
}

.social-link.tiktok {
  background: rgba(0, 242, 234, 0.08);
  border-color: rgba(0, 242, 234, 0.2);
  color: #00F2EA;
}

.social-link.tiktok:hover {
  background: rgba(0, 242, 234, 0.15);
  border-color: #00F2EA;
  transform: translateY(-2px);
}

.type-tags {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-sm);
}

.type-tag {
  display: inline-block;
  padding: var(--space-xs) var(--space-md);
  background: var(--gold-subtle);
  border: 1px solid rgba(212, 175, 55, 0.3);
  border-radius: var(--radius-full);
  font-size: var(--text-xs);
  font-weight: var(--font-medium);
  color: var(--gold-primary);
  transition: var(--transition-base);
}

.type-tag:hover {
  background: rgba(212, 175, 55, 0.2);
  border-color: var(--gold-primary);
}

.loading-text {
  color: var(--text-secondary);
  font-size: var(--text-sm);
  font-style: italic;
}

.opening-hours {
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
}

.status-badge {
  display: inline-block;
  padding: var(--space-sm) var(--space-lg);
  border-radius: var(--radius-full);
  font-size: var(--text-sm);
  font-weight: var(--font-semibold);
  align-self: flex-start;
}

.status-badge.open {
  background: var(--success-bg);
  border: 1px solid var(--success-border);
  color: var(--success-text);
}

.status-badge.closed {
  background: var(--error-bg);
  border: 1px solid var(--error-border);
  color: var(--error-text);
}

.hours-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
}

.hours-item {
  font-size: var(--text-sm);
  color: var(--text-secondary);
  padding: var(--space-xs) 0;
}

.no-hours {
  color: var(--text-secondary);
  font-size: var(--text-sm);
  font-style: italic;
}

.website-link {
  color: var(--gold-primary);
  text-decoration: none;
  font-size: var(--text-base);
  transition: var(--transition-base);
  word-break: break-all;
}

.website-link:hover {
  text-decoration: underline;
  color: var(--gold-light);
}

.social-media-links {
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.social-link {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  border-radius: 50%;
  transition: all 0.3s ease;
  text-decoration: none;
  border: 2px solid;
}

.social-link svg {
  width: 20px;
  height: 20px;
}

.social-link.facebook {
  background: rgba(66, 103, 178, 0.1);
  border-color: rgba(66, 103, 178, 0.3);
  color: #4267B2;
}

.social-link.facebook:hover {
  background: rgba(66, 103, 178, 0.2);
  border-color: #4267B2;
  transform: translateY(-2px);
}

.social-link.instagram {
  background: rgba(225, 48, 108, 0.1);
  border-color: rgba(225, 48, 108, 0.3);
  color: #E1306C;
}

.social-link.instagram:hover {
  background: rgba(225, 48, 108, 0.2);
  border-color: #E1306C;
  transform: translateY(-2px);
}

.social-link.twitter {
  background: rgba(255, 255, 255, 0.1);
  border-color: rgba(255, 255, 255, 0.3);
  color: var(--text-primary);
}

.social-link.twitter:hover {
  background: rgba(255, 255, 255, 0.2);
  border-color: var(--text-primary);
  transform: translateY(-2px);
}

.social-link.youtube {
  background: rgba(255, 0, 0, 0.1);
  border-color: rgba(255, 0, 0, 0.3);
  color: #FF0000;
}

.social-link.youtube:hover {
  background: rgba(255, 0, 0, 0.2);
  border-color: #FF0000;
  transform: translateY(-2px);
}

.social-link.tiktok {
  background: rgba(0, 242, 234, 0.1);
  border-color: rgba(0, 242, 234, 0.3);
  color: #00F2EA;
}

.social-link.tiktok:hover {
  background: rgba(0, 242, 234, 0.2);
  border-color: #00F2EA;
  transform: translateY(-2px);
}

.no-social-media {
  color: var(--text-secondary);
  font-size: 0.875rem;
  font-style: italic;
}

/* Info Grid */
.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: var(--space-lg);
}

.info-item {
  display: flex;
  align-items: center;
  gap: var(--space-md);
  padding: var(--space-lg);
  background: rgba(0, 0, 0, 0.2);
  border: 1px solid rgba(212, 175, 55, 0.1);
  border-radius: var(--radius-md);
  transition: var(--transition-base);
}

.info-item:hover {
  background: rgba(0, 0, 0, 0.3);
  border-color: rgba(212, 175, 55, 0.3);
}

.info-icon {
  font-size: var(--text-2xl);
  flex-shrink: 0;
}

.info-content {
  display: flex;
  flex-direction: column;
  gap: var(--space-xs);
  flex: 1;
}

.info-value {
  font-size: var(--text-base);
  font-weight: var(--font-semibold);
  color: var(--text-primary);
}

.info-meta {
  font-size: var(--text-sm);
  color: var(--text-secondary);
}

.info-link {
  color: var(--gold-primary);
  text-decoration: none;
  font-size: var(--text-base);
  font-weight: var(--font-medium);
  transition: var(--transition-base);
}

.info-link:hover {
  color: var(--gold-light);
  text-decoration: underline;
}

/* Actions Section */
.actions-section {
  padding-top: var(--space-2xl);
  border-top: 1px solid rgba(212, 175, 55, 0.1);
}

.actions {
  display: flex;
  gap: var(--space-lg);
}

.actions button {
  flex: 1;
}

/* Reviews Section */
.reviews-card {
  margin-bottom: var(--space-2xl);
  animation: fadeInUp 0.6s var(--ease-smooth);
  animation-delay: 0.3s;
  animation-fill-mode: both;
}

.reviews-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--space-xl);
  padding-bottom: var(--space-lg);
  border-bottom: 1px solid rgba(212, 175, 55, 0.1);
}

.reviews-title {
  font-family: var(--font-heading);
  font-size: var(--text-2xl);
  font-weight: var(--font-semibold);
  margin: 0;
  color: var(--text-primary);
}

.reviews-count {
  padding: var(--space-sm) var(--space-lg);
  background: var(--gold-subtle);
  border: 1px solid rgba(212, 175, 55, 0.3);
  border-radius: var(--radius-full);
  font-size: var(--text-sm);
  font-weight: var(--font-semibold);
  color: var(--gold-primary);
}

.reviews-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-xl);
  margin-bottom: var(--space-xl);
}

.review-item {
  padding: var(--space-xl);
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(212, 175, 55, 0.1);
  border-radius: var(--radius-lg);
  transition: var(--transition-base);
}

.review-item:hover {
  background: rgba(0, 0, 0, 0.4);
  border-color: rgba(212, 175, 55, 0.3);
  transform: translateY(-2px);
  box-shadow: var(--shadow-lg);
}

.review-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.review-author {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.author-photo {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid rgba(212, 175, 55, 0.3);
}

.author-photo-placeholder {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--accent-gold) 0%, #b8860b 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--background-primary);
  border: 2px solid rgba(212, 175, 55, 0.3);
}

.author-info {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.author-name {
  font-size: 1rem;
  font-weight: 600;
  color: var(--text-primary);
}

.review-time {
  font-size: 0.875rem;
  color: var(--text-secondary);
}

.review-rating {
  display: flex;
  gap: 0.25rem;
}

.star {
  font-size: 1.25rem;
  color: var(--text-secondary);
}

.star.filled {
  color: var(--accent-gold);
}

.review-text {
  font-size: 1rem;
  line-height: 1.6;
  color: var(--text-secondary);
  margin: 0;
  white-space: pre-wrap;
}

/* Pagination */
.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 1rem;
  padding-top: 1.5rem;
  border-top: 1px solid rgba(212, 175, 55, 0.1);
}

.pagination-btn {
  padding: 0.75rem 1.5rem;
  background: rgba(212, 175, 55, 0.1);
  border: 1px solid rgba(212, 175, 55, 0.3);
  border-radius: 8px;
  color: var(--accent-gold);
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.pagination-btn:hover:not(:disabled) {
  background: rgba(212, 175, 55, 0.2);
  border-color: rgba(212, 175, 55, 0.5);
  transform: translateY(-2px);
}

.pagination-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.pagination-info {
  font-size: 0.875rem;
  color: var(--text-secondary);
  font-weight: 500;
}

.info-card {
  animation: fadeInUp 0.6s var(--ease-smooth);
  animation-delay: 0.6s;
  animation-fill-mode: both;
}

.info-title {
  font-family: var(--font-heading);
  font-size: var(--text-xl);
  font-weight: var(--font-semibold);
  margin: 0 0 var(--space-lg) 0;
  color: var(--text-primary);
}

.info-list {
  margin: 0;
  padding-left: var(--space-2xl);
  color: var(--text-secondary);
  line-height: var(--leading-relaxed);
}

.info-list li {
  margin-bottom: var(--space-sm);
}

.info-list li:last-child {
  margin-bottom: 0;
}

/* Competitors Section */
.competitors-card {
  margin-bottom: var(--space-2xl);
  animation: fadeInUp 0.6s var(--ease-smooth);
  animation-delay: 0.4s;
  animation-fill-mode: both;
}

.competitors-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--space-xl);
  padding-bottom: var(--space-lg);
  border-bottom: 1px solid rgba(212, 175, 55, 0.1);
}

.competitors-title {
  font-family: var(--font-heading);
  font-size: var(--text-2xl);
  font-weight: var(--font-semibold);
  margin: 0;
  color: var(--text-primary);
}

.competitors-count {
  padding: var(--space-sm) var(--space-lg);
  background: var(--gold-subtle);
  border: 1px solid rgba(212, 175, 55, 0.3);
  border-radius: var(--radius-full);
  font-size: var(--text-sm);
  font-weight: var(--font-semibold);
  color: var(--gold-primary);
}

.competitors-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem;
  gap: 1rem;
}

.competitors-loading p {
  color: var(--text-secondary);
  margin: 0;
}

.competitors-content {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.competitors-info {
  padding: 1rem;
  background: rgba(212, 175, 55, 0.1);
  border: 1px solid rgba(212, 175, 55, 0.2);
  border-radius: 8px;
}

.competitors-description {
  margin: 0;
  font-size: 0.875rem;
  color: var(--text-secondary);
}

.competitors-description strong {
  color: var(--accent-gold);
  font-weight: 600;
}

.competitors-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.competitor-item {
  display: flex;
  gap: 1rem;
  padding: 1.5rem;
  background: rgba(0, 0, 0, 0.2);
  border: 1px solid rgba(212, 175, 55, 0.1);
  border-radius: 12px;
  transition: all 0.3s ease;
}

.competitor-item:hover {
  background: rgba(0, 0, 0, 0.3);
  border-color: rgba(212, 175, 55, 0.3);
  transform: translateY(-2px);
}

.competitor-number {
  flex-shrink: 0;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, var(--accent-gold) 0%, #b8860b 100%);
  border-radius: 50%;
  font-size: 0.875rem;
  font-weight: 700;
  color: var(--background-primary);
}

.competitor-details {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.competitor-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 1rem;
}

.competitor-name {
  margin: 0;
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--text-primary);
  flex: 1;
}

.competitor-distance {
  flex-shrink: 0;
  padding: 0.25rem 0.75rem;
  background: rgba(212, 175, 55, 0.15);
  border: 1px solid rgba(212, 175, 55, 0.3);
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--accent-gold);
}

.competitor-address {
  margin: 0;
  font-size: 0.875rem;
  color: var(--text-secondary);
  line-height: 1.4;
}

.competitor-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  align-items: center;
  margin-top: 0.5rem;
}

.competitor-rating {
  font-size: 0.875rem;
  color: var(--text-primary);
  font-weight: 500;
}

.competitor-types {
  display: flex;
  flex-wrap: wrap;
  gap: 0.375rem;
}

.type-tag-small {
  display: inline-block;
  padding: 0.25rem 0.5rem;
  background: rgba(212, 175, 55, 0.1);
  border: 1px solid rgba(212, 175, 55, 0.2);
  border-radius: 12px;
  font-size: 0.625rem;
  font-weight: 500;
  color: var(--accent-gold);
  transition: all 0.2s ease;
}

.competitors-empty {
  text-align: center;
  padding: 3rem;
  color: var(--text-secondary);
}

.competitors-empty p {
  margin: 0;
}

/* Menu Section */
.menu-card {
  margin-bottom: var(--space-2xl);
  animation: fadeInUp 0.6s var(--ease-smooth);
  animation-delay: 0.5s;
  animation-fill-mode: both;
}

.menu-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--space-xl);
  padding-bottom: var(--space-lg);
  border-bottom: 1px solid rgba(212, 175, 55, 0.1);
}

.menu-title {
  font-family: var(--font-heading);
  font-size: var(--text-2xl);
  font-weight: var(--font-semibold);
  margin: 0;
  color: var(--text-primary);
}

.menu-platform-badge {
  padding: var(--space-sm) var(--space-lg);
  background: var(--gold-subtle);
  border: 1px solid rgba(212, 175, 55, 0.3);
  border-radius: var(--radius-full);
  font-size: var(--text-xs);
  font-weight: var(--font-bold);
  color: var(--gold-primary);
  letter-spacing: 0.05em;
  text-transform: uppercase;
}

.menu-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem;
  gap: 1rem;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 3px solid rgba(212, 175, 55, 0.2);
  border-top-color: var(--accent-gold);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.menu-loading p {
  color: var(--text-secondary);
  margin: 0;
}

.menu-content {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.menu-info {
  padding: 1rem;
  background: rgba(212, 175, 55, 0.1);
  border: 1px solid rgba(212, 175, 55, 0.2);
  border-radius: 8px;
}

.menu-source {
  margin: 0;
  font-size: 0.875rem;
  color: var(--text-secondary);
}

.menu-link {
  color: var(--accent-gold);
  text-decoration: none;
  font-weight: 600;
  transition: all 0.2s ease;
}

.menu-link:hover {
  text-decoration: underline;
  color: var(--text-primary);
}

.menu-items {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: var(--space-lg);
}

.menu-empty {
  text-align: center;
  padding: 3rem;
  color: var(--text-secondary);
}

.menu-empty p {
  margin: 0;
}

/* Brand DNA Section */
.brand-dna-card {
  margin-bottom: var(--space-2xl);
  animation: fadeInUp 0.6s var(--ease-smooth);
  animation-delay: 0.2s;
  animation-fill-mode: both;
}

.brand-dna-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--space-xl);
  padding-bottom: var(--space-lg);
  border-bottom: 1px solid rgba(212, 175, 55, 0.1);
}

.brand-dna-title {
  font-family: var(--font-heading);
  font-size: var(--text-2xl);
  font-weight: var(--font-semibold);
  margin: 0;
  color: var(--text-primary);
}

.brand-dna-badge {
  padding: var(--space-sm) var(--space-lg);
  background: var(--success-bg);
  border: 1px solid var(--success-border);
  border-radius: var(--radius-full);
  font-size: var(--text-sm);
  font-weight: var(--font-semibold);
  color: var(--success-text);
}

.brand-dna-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem;
  gap: 1rem;
}

.brand-dna-loading p {
  color: var(--text-secondary);
  margin: 0;
}

.brand-dna-content {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.brand-section {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.section-label {
  font-size: 0.875rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--text-secondary);
  margin: 0;
}

.brand-name-display {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0;
  padding: 1rem;
  background: rgba(212, 175, 55, 0.1);
  border: 1px solid rgba(212, 175, 55, 0.2);
  border-radius: 8px;
  text-align: center;
}

.colors-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 1rem;
}

.color-item {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  padding: 1rem;
  background: rgba(0, 0, 0, 0.2);
  border: 1px solid rgba(212, 175, 55, 0.1);
  border-radius: 12px;
  transition: all 0.3s ease;
}

.color-item:hover {
  background: rgba(0, 0, 0, 0.3);
  border-color: rgba(212, 175, 55, 0.3);
  transform: translateY(-2px);
}

.color-swatch {
  width: 100%;
  height: 80px;
  border-radius: 8px;
  border: 2px solid rgba(255, 255, 255, 0.1);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
}

.color-info {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.color-label {
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--text-secondary);
}

.color-value {
  font-family: 'Courier New', monospace;
  font-size: 0.875rem;
  color: var(--text-primary);
  font-weight: 600;
}

.font-display {
  display: flex;
  gap: 0.5rem;
}

.font-badge {
  padding: 0.75rem 1.5rem;
  background: rgba(212, 175, 55, 0.15);
  border: 1px solid rgba(212, 175, 55, 0.3);
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  color: var(--accent-gold);
  text-transform: capitalize;
}

.logo-display {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 1.5rem;
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(212, 175, 55, 0.15);
  border-radius: 12px;
}

.logo-image {
  max-width: 300px;
  max-height: 150px;
  object-fit: contain;
}

.brand-footer {
  padding-top: 1rem;
  border-top: 1px solid rgba(212, 175, 55, 0.1);
}

.analysis-note {
  font-size: 0.75rem;
  color: var(--text-secondary);
  font-style: italic;
}

.brand-dna-empty {
  text-align: center;
  padding: 3rem;
  color: var(--text-secondary);
}

.brand-dna-empty p {
  margin: 0;
}

/* Responsive Design */
@media (max-width: 768px) {
  .restaurant-search-view {
    padding: var(--space-2xl) var(--space-lg);
  }

  .header {
    margin-bottom: var(--space-3xl);
  }

  .title {
    font-size: var(--text-3xl);
  }

  .subtitle {
    font-size: var(--text-base);
  }

  .actions {
    flex-direction: column;
  }

  .actions button {
    width: 100%;
  }

  .colors-grid {
    grid-template-columns: 1fr;
  }

  .photos-grid {
    grid-template-columns: 1fr;
  }

  .reviews-header,
  .competitors-header,
  .menu-header,
  .brand-dna-header {
    flex-direction: column;
    align-items: flex-start;
    gap: var(--space-md);
  }

  .stats-grid {
    grid-template-columns: 1fr;
  }

  .info-grid {
    grid-template-columns: 1fr;
  }

  .restaurant-name {
    font-size: var(--text-2xl);
  }

  .restaurant-address {
    font-size: var(--text-base);
  }

  .brand-identity-grid {
    grid-template-columns: 1fr;
  }

  .brand-logo-section {
    justify-self: center;
  }

  .brand-detail-row {
    flex-direction: column;
    align-items: flex-start;
    gap: var(--space-sm);
  }

  .detail-label {
    min-width: auto;
  }
}

/* Photos Section */
.photos-section {
  flex-direction: column;
  align-items: flex-start;
}

.photos-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--space-lg);
  width: 100%;
  margin-top: var(--space-md);
}

.photo-item {
  position: relative;
  aspect-ratio: 1;
  border-radius: var(--radius-md);
  overflow: hidden;
  cursor: pointer;
  transition: var(--transition-base);
  background: var(--bg-tertiary);
}

.photo-item:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-lg);
}

.place-photo {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.photo-attribution {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  padding: var(--space-xs) var(--space-sm);
  background: linear-gradient(to top, rgba(0, 0, 0, 0.8), transparent);
  color: var(--text-primary);
  font-size: var(--text-xs);
  opacity: 0;
  transition: var(--transition-base);
}

.photo-item:hover .photo-attribution {
  opacity: 1;
}

/* Photo Modal */
.photo-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.9);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: var(--space-xl);
  animation: fadeIn 0.2s ease-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.photo-modal-content {
  position: relative;
  max-width: 90vw;
  max-height: 90vh;
  animation: scaleIn 0.3s ease-out;
}

@keyframes scaleIn {
  from {
    transform: scale(0.9);
    opacity: 0;
  }
  to {
    transform: scale(1);
    opacity: 1;
  }
}

.modal-photo {
  max-width: 100%;
  max-height: 90vh;
  width: auto;
  height: auto;
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-xl);
}

.close-button {
  position: absolute;
  top: -3rem;
  right: 0;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: var(--text-primary);
  font-size: 2rem;
  width: 3rem;
  height: 3rem;
  border-radius: var(--radius-full);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: var(--transition-base);
  backdrop-filter: blur(var(--blur-md));
}

.close-button:hover {
  background: var(--gold-primary);
  border-color: var(--gold-primary);
  color: var(--text-on-gold);
  transform: rotate(90deg);
}

/* Image selection and upload sections */
.photos-section {
  grid-column: 1 / -1;
}

.upload-section {
  grid-column: 1 / -1;
  margin-top: var(--space-lg);
}

.upload-alert {
  margin-top: var(--space-md);
}

/* Quick Stats Card */
.stats-card {
  margin-bottom: 2rem;
  padding: var(--space-2xl);
}

.stats-title {
  font-family: var(--font-display);
  font-size: var(--text-2xl);
  font-weight: 600;
  margin: 0 0 var(--space-xl) 0;
  color: var(--accent-gold);
  text-align: center;
}

/* Quick Overview Section - Inside Search Card */
.quick-overview-section {
  margin-top: var(--space-2xl);
  padding-top: var(--space-2xl);
  border-top: 1px solid rgba(212, 175, 55, 0.1);
  animation: fadeInUp 0.6s var(--ease-smooth);
}

.quick-overview-title {
  font-family: var(--font-heading);
  font-size: var(--text-2xl);
  font-weight: var(--font-semibold);
  margin: 0 0 var(--space-xl) 0;
  color: var(--text-primary);
  text-align: center;
}

.quick-review-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--space-lg);
  padding-bottom: var(--space-md);
  border-bottom: 1px solid rgba(212, 175, 55, 0.15);
}

.quick-review-title {
  font-family: var(--font-display);
  font-size: var(--text-lg);
  font-weight: 600;
  margin: 0;
  color: var(--text-primary);
}

.quick-review-rating {
  display: flex;
  gap: 0.25rem;
}

.quick-review-rating .star {
  font-size: 1.125rem;
  color: var(--text-secondary);
}

.quick-review-rating .star.filled {
  color: var(--accent-gold);
}

.quick-review-content {
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
}

.quick-review-author {
  display: flex;
  align-items: center;
  gap: var(--space-md);
}

.quick-author-photo {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid rgba(212, 175, 55, 0.3);
  flex-shrink: 0;
}

.quick-author-photo-placeholder {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--accent-gold) 0%, #b8860b 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1rem;
  font-weight: 700;
  color: var(--background-primary);
  border: 2px solid rgba(212, 175, 55, 0.3);
  flex-shrink: 0;
}

.quick-author-info {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  flex: 1;
  min-width: 0;
}

.quick-author-name {
  font-size: var(--text-base);
  font-weight: 600;
  color: var(--text-primary);
}

.quick-review-time {
  font-size: var(--text-xs);
  color: var(--text-secondary);
}

.quick-review-text {
  font-size: var(--text-sm);
  line-height: 1.6;
  color: var(--text-secondary);
  margin: 0;
  padding-left: 52px;
  white-space: pre-wrap;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: var(--space-lg);
}

.stat-item {
  display: flex;
  align-items: center;
  gap: var(--space-md);
  padding: var(--space-lg);
  background: rgba(0, 0, 0, 0.2);
  border: 1px solid rgba(212, 175, 55, 0.15);
  border-radius: var(--radius-lg);
  transition: var(--transition-base);
}

.stat-item:hover {
  background: rgba(0, 0, 0, 0.3);
  border-color: rgba(212, 175, 55, 0.3);
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}

.stat-icon {
  font-size: 2rem;
  line-height: 1;
  flex-shrink: 0;
}

.stat-content {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  flex: 1;
  min-width: 0;
}

.stat-label {
  font-size: var(--text-xs);
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--text-secondary);
}

.stat-value {
  font-size: var(--text-lg);
  font-weight: 700;
  color: var(--text-primary);
  line-height: 1.2;
}

.stat-subtext {
  font-size: var(--text-xs);
  font-weight: 500;
  color: var(--text-secondary);
  margin-left: 0.25rem;
}

/* Responsive stats grid */
@media (max-width: 768px) {
  .stats-grid {
    grid-template-columns: 1fr 1fr;
  }

  .stats-card {
    padding: var(--space-xl);
  }

  .quick-review-card {
    padding: var(--space-lg);
  }

  .quick-review-text {
    padding-left: 0;
  }
}

@media (max-width: 480px) {
  .stats-grid {
    grid-template-columns: 1fr;
  }

  .quick-review-header {
    flex-direction: column;
    align-items: flex-start;
    gap: var(--space-sm);
  }
}

/* Sticky CTA Button */
.sticky-cta {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: linear-gradient(to top, var(--bg-primary) 80%, transparent);
  backdrop-filter: blur(var(--blur-md));
  padding: var(--space-xl) var(--space-xl) var(--space-2xl);
  z-index: 100;
  animation: slideUp 0.4s var(--ease-smooth);
}

.sticky-cta-content {
  max-width: var(--max-width-lg);
>>>>>>> Stashed changes
  margin: 0 auto;
}

.search-wrapper {
  width: 100%;
  animation: fadeInUp 0.6s var(--ease-smooth) 0.1s both;
}

.search-wrapper :deep(input) {
  font-size: var(--text-2xl);
  font-weight: var(--font-medium);
  padding: var(--space-2xl) var(--space-3xl);
  height: auto;
  min-height: 80px;
  background: rgba(26, 26, 26, 0.95);
  border: 2px solid rgba(212, 175, 55, 0.3);
  box-shadow:
    0 8px 32px rgba(0, 0, 0, 0.4),
    0 0 24px rgba(212, 175, 55, 0.15),
    inset 0 1px 0 rgba(212, 175, 55, 0.1);
  transition: all var(--transition-base);
}

.search-wrapper :deep(input:focus) {
  border-color: var(--gold-primary);
  box-shadow:
    0 12px 40px rgba(0, 0, 0, 0.5),
    0 0 32px rgba(212, 175, 55, 0.25),
    inset 0 1px 0 rgba(212, 175, 55, 0.2);
  transform: translateY(-2px);
}

.search-wrapper :deep(input::placeholder) {
  color: var(--text-muted);
  font-weight: var(--font-normal);
}

.search-wrapper :deep(.autocomplete-dropdown) {
  font-size: var(--text-lg);
}

.actions-section {
  margin-top: var(--space-2xl);
  max-width: var(--max-width-lg);
  margin-left: auto;
  margin-right: auto;
}

.actions-section > * + * {
  margin-top: var(--space-md);
}

/* Animations */
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

/* Responsive */
@media (max-width: 768px) {
  .restaurant-search-view {
    padding: var(--space-2xl) var(--space-lg);
  }

  .title {
    font-size: var(--text-3xl);
  }

  .subtitle {
    font-size: var(--text-base);
  }

  .container {
    padding-bottom: 100px;
  }
}

/* Reduced motion */
@media (prefers-reduced-motion: reduce) {
  .header,
  .search-wrapper {
    animation: none;
  }
}
</style>
