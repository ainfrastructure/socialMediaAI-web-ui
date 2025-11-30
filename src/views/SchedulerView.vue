<template>
  <div class="scheduler-view">
    <GradientBackground />

    <div class="container">
      <div class="header">
        <h1 class="title">{{ $t('scheduler.title') }}</h1>
        <p class="subtitle">{{ $t('scheduler.subtitle') }}</p>
      </div>

      <!-- Upcoming Posts Quick View (at top for visibility) -->
      <BaseCard v-if="upcomingPosts.length > 0" variant="glass" class="upcoming-posts-card">
        <div class="upcoming-header">
          <h3 class="upcoming-title">📅 Upcoming Posts</h3>
          <span class="upcoming-count">{{ upcomingPosts.length }} scheduled</span>
        </div>
        <div class="upcoming-list">
          <div
            v-for="post in upcomingPosts"
            :key="post.id"
            class="upcoming-item"
            @click="viewPostDetail(post)"
          >
            <div class="upcoming-date-badge">
              <span class="upcoming-date">{{ formatUpcomingDate(post.scheduled_date) }}</span>
              <span class="upcoming-time">{{ formatTime(post.scheduled_time) || 'No time' }}</span>
            </div>
            <div class="upcoming-thumb">
              <img
                v-if="post.content_type === 'image' && post.media_url"
                :src="getMediaUrl(post.media_url)"
                :alt="post.post_text || 'Post'"
                @error="handleImageError($event, post)"
              />
              <div v-else class="upcoming-thumb-placeholder">
                {{ getContentTypeEmoji(post.content_type) }}
              </div>
            </div>
            <div class="upcoming-content">
              <p class="upcoming-text">{{ truncateText(post.post_text || 'No caption', 60) }}</p>
              <div class="upcoming-meta">
                <span v-if="post.platform" :class="['upcoming-platform', `platform-${post.platform}`]">
                  {{ getPlatformIcon(post.platform) }} {{ post.platform }}
                </span>
                <span v-if="post.restaurant_name" class="upcoming-restaurant">🏪 {{ post.restaurant_name }}</span>
              </div>
            </div>
            <div class="upcoming-actions" @click.stop>
              <button class="upcoming-action-btn" @click="editScheduledPost(post)" title="Edit">✏️</button>
              <button class="upcoming-action-btn delete" @click="cancelPost(post.id)" title="Delete">🗑️</button>
            </div>
          </div>
        </div>
      </BaseCard>

      <!-- Calendar Grid (always rendered) -->
      <BaseCard variant="glass" class="calendar-card">
        <!-- Loading Overlay -->
        <div v-if="loading" class="loading-overlay">
          <div class="spinner"></div>
        </div>

        <!-- Filters Accordion -->
        <div class="filter-accordion">
          <button class="filter-toggle" @click="filtersExpanded = !filtersExpanded">
            <span class="filter-toggle-left">
              <span class="filter-icon">🔍</span>
              <span class="filter-label">Filters</span>
              <span v-if="activeFilterCount > 0" class="filter-badge">{{ activeFilterCount }}</span>
            </span>
            <span :class="['filter-arrow', { expanded: filtersExpanded }]">▼</span>
          </button>

          <div v-show="filtersExpanded" class="filter-content">
            <div class="inline-filters">
              <!-- Platform Filter -->
              <div ref="platformFilterRef" class="inline-filter-group" @mouseleave="platformFilterOpen = false">
                <button
                  class="inline-filter-btn"
                  @click.stop="platformFilterOpen = !platformFilterOpen; restaurantFilterOpen = false"
                >
                  <span class="inline-filter-icon">📱</span>
                  <span class="inline-filter-label">Platforms</span>
                  <span v-if="filters.platforms.length > 0" class="inline-filter-count">({{ filters.platforms.length }})</span>
                  <span :class="['inline-filter-arrow', { open: platformFilterOpen }]">▼</span>
                </button>
                <div v-show="platformFilterOpen" class="inline-filter-options" @click.stop>
                  <label class="filter-checkbox select-all">
                    <input
                      type="checkbox"
                      :checked="filters.platforms.length === availablePlatforms.length"
                      :indeterminate="filters.platforms.length > 0 && filters.platforms.length < availablePlatforms.length"
                      @change="toggleAllPlatforms"
                    />
                    <span class="checkbox-label">Select All</span>
                  </label>
                  <div class="filter-divider"></div>
                  <label
                    v-for="platform in availablePlatforms"
                    :key="platform.id"
                    class="filter-checkbox"
                  >
                    <input
                      type="checkbox"
                      :checked="filters.platforms.includes(platform.id)"
                      @change="togglePlatformFilter(platform.id)"
                    />
                    <span class="checkbox-icon">{{ platform.icon }}</span>
                    <span class="checkbox-label">{{ platform.name }}</span>
                  </label>
                </div>
              </div>

              <!-- Restaurant Filter -->
              <div ref="restaurantFilterRef" class="inline-filter-group" @mouseleave="restaurantFilterOpen = false">
                <button
                  class="inline-filter-btn"
                  @click.stop="restaurantFilterOpen = !restaurantFilterOpen; platformFilterOpen = false"
                >
                  <span class="inline-filter-icon">🏪</span>
                  <span class="inline-filter-label">Restaurants</span>
                  <span v-if="filters.restaurant_ids.length > 0" class="inline-filter-count">({{ filters.restaurant_ids.length }})</span>
                  <span :class="['inline-filter-arrow', { open: restaurantFilterOpen }]">▼</span>
                </button>
                <div v-show="restaurantFilterOpen" class="inline-filter-options" @click.stop>
                  <label class="filter-checkbox select-all">
                    <input
                      type="checkbox"
                      :checked="filters.restaurant_ids.length === restaurants.length"
                      :indeterminate="filters.restaurant_ids.length > 0 && filters.restaurant_ids.length < restaurants.length"
                      @change="toggleAllRestaurants"
                    />
                    <span class="checkbox-label">Select All</span>
                  </label>
                  <div class="filter-divider"></div>
                  <label
                    v-for="restaurant in restaurants"
                    :key="restaurant.id"
                    class="filter-checkbox"
                  >
                    <input
                      type="checkbox"
                      :checked="filters.restaurant_ids.includes(String(restaurant.id))"
                      @change="toggleRestaurantFilter(String(restaurant.id))"
                    />
                    <span class="checkbox-label">{{ restaurant.name }}</span>
                  </label>
                </div>
              </div>
            </div>

            <!-- Active Filters Tags -->
            <div v-if="activeFilterCount > 0" class="active-filter-tags">
              <span
                v-for="platformId in filters.platforms"
                :key="platformId"
                class="filter-tag"
              >
                {{ availablePlatforms.find(p => p.id === platformId)?.icon }}
                {{ availablePlatforms.find(p => p.id === platformId)?.name }}
                <button class="tag-remove" @click="removePlatformFilter(platformId)">×</button>
              </span>
              <span
                v-for="restaurantId in filters.restaurant_ids"
                :key="restaurantId"
                class="filter-tag"
              >
                🏪 {{ getRestaurantName(restaurantId) }}
                <button class="tag-remove" @click="removeRestaurantFilter(restaurantId)">×</button>
              </span>
              <button class="clear-all-btn" @click="resetFilters">Clear all</button>
            </div>
          </div>
        </div>

        <!-- Calendar Navigation - Streamlined -->
        <div class="calendar-header-new">
          <button
            class="nav-arrow"
            @click="previousPeriod"
            :title="`Previous ${viewMode}`"
          >
            <span class="arrow-icon">←</span>
            <span class="arrow-tooltip">Previous {{ viewMode }}</span>
          </button>

          <div class="calendar-center">
            <h2 class="current-month">{{ currentPeriodLabel }}</h2>
            <div class="view-mode-toggle">
              <div class="toggle-slider" :class="`position-${viewMode}`"></div>
              <button
                v-for="mode in ['month', 'week', 'day']"
                :key="mode"
                :class="['view-btn', { active: viewMode === mode }]"
                @click="viewMode = mode as 'month' | 'week' | 'day'"
              >
                {{ mode.charAt(0).toUpperCase() + mode.slice(1) }}
              </button>
            </div>
          </div>

          <button
            class="nav-arrow"
            @click="nextPeriod"
            :title="`Next ${viewMode}`"
          >
            <span class="arrow-icon">→</span>
            <span class="arrow-tooltip">Next {{ viewMode }}</span>
          </button>
        </div>

        <!-- Color Legend -->
        <div class="calendar-legend">
          <div class="legend-item">
            <div class="legend-dot legend-published"></div>
            <span>Published</span>
          </div>
          <div class="legend-item">
            <div class="legend-dot legend-scheduled"></div>
            <span>Scheduled</span>
          </div>
          <div class="legend-item">
            <div class="legend-dot legend-failed"></div>
            <span>Failed</span>
          </div>
        </div>
        <div :class="['calendar-grid', `view-${viewMode}`]">
          <!-- Day headers (only show for month and week views) -->
          <div
            v-if="viewMode !== 'day'"
            v-for="day in displayedWeekDays"
            :key="day"
            class="calendar-day-header"
          >
            {{ day }}
          </div>

          <!-- Calendar days -->
          <div
            v-for="(day, index) in displayedCalendarDays"
            :key="index"
            :class="[
              'calendar-day',
              {
                'other-month': day.isOtherMonth && viewMode === 'month' && !isPastDate(day.date),
                'past-date': isPastDate(day.date) && viewMode !== 'day',
                'future-date': !isPastDate(day.date) && !day.isToday && viewMode !== 'day',
                today: day.isToday,
                'has-posts': day.posts.length > 0,
                'day-view': viewMode === 'day',
              },
            ]"
            @click="selectDay(day)"
          >
            <div class="day-number">{{ viewMode === 'day' ? '' : day.day }}</div>

            <!-- Day View Header -->
            <div v-if="viewMode === 'day'" class="day-view-header">
              <h2 class="day-view-title">
                {{ formatSelectedDate(day) }}
                <span v-if="day.posts.length > 0" class="post-count">({{ day.posts.length }} {{ day.posts.length === 1 ? 'post' : 'posts' }})</span>
              </h2>
              <div class="day-view-actions">
                <BaseButton variant="primary" size="medium" @click.stop="openCreatePostWizard(day)">
                  ➕ Create Post
                </BaseButton>
              </div>
            </div>

            <!-- Holidays -->
            <div v-if="day.holidays && day.holidays.length > 0" class="day-holidays">
              <!-- Day View: Show all holidays with details -->
              <div v-if="viewMode === 'day'" class="day-view-holidays">
                <div v-for="holiday in day.holidays" :key="holiday.name" class="day-holiday-card">
                  <div class="holiday-card-icon">{{ getHolidayEmoji(holiday) }}</div>
                  <div class="holiday-card-info">
                    <h4 class="holiday-card-name">{{ holiday.name }}</h4>
                    <p v-if="holiday.description" class="holiday-card-desc">
                      {{ holiday.description }}
                    </p>
                  </div>
                </div>
              </div>

              <!-- Month/Week View: Show compact indicators -->
              <template v-else>
                <div
                  v-for="holiday in day.holidays.slice(0, 2)"
                  :key="holiday.name"
                  class="holiday-indicator"
                  :title="`${holiday.name}${holiday.religion ? ' (' + holiday.religion + ')' : ''}`"
                >
                  {{ getHolidayEmoji(holiday) }}
                  {{
                    holiday.name.length > 20 ? holiday.name.substring(0, 20) + '...' : holiday.name
                  }}
                </div>
                <span v-if="day.holidays.length > 2" class="more-holidays">
                  +{{ day.holidays.length - 2 }} {{ $t('scheduler.moreHolidays') }}
                </span>
              </template>
            </div>

            <div v-if="day.posts.length > 0" class="day-posts">
              <!-- Day View: Show detailed post cards -->
              <div v-if="viewMode === 'day'" class="day-view-posts">
                <div
                  v-for="post in paginatedDayPosts(day.posts)"
                  :key="post.id"
                  :class="['day-post-card', post.status ? `status-${post.status}` : '']"
                  @click.stop="viewPostDetail(post)"
                >
                  <!-- Thumbnail Section -->
                  <div class="post-card-thumbnail">
                    <img
                      v-if="post.content_type === 'image' && post.media_url"
                      :src="getMediaUrl(post.media_url)"
                      :alt="post.post_text || 'Post'"
                      class="post-thumb-img"
                      @error="handleImageError($event, post)"
                    />
                    <video
                      v-else-if="post.content_type === 'video' && post.media_url"
                      :src="getMediaUrl(post.media_url)"
                      class="post-thumb-img"
                      muted
                    ></video>
                    <div v-else class="post-thumb-placeholder">
                      <span class="thumb-icon">📸</span>
                    </div>
                  </div>

                  <!-- Time Section -->
                  <div class="post-card-time">
                    <div class="time-large">{{ formatTime(post.scheduled_time) || $t('scheduler.noTime') }}</div>
                    <div v-if="post.timezone" class="time-zone">{{ post.timezone }}</div>
                  </div>

                  <!-- Content Section -->
                  <div class="post-card-content">
                    <div class="post-card-header">
                      <span
                        v-if="post.platform"
                        :class="['post-card-platform', `platform-${post.platform}`]"
                      >
                        {{ post.platform }}
                      </span>
                      <span class="post-card-type">
                        {{ getContentTypeEmoji(post.content_type) }} {{ post.content_type }}
                      </span>
                      <span
                        v-if="post.status"
                        :class="['post-card-status', `status-${post.status}`]"
                      >
                        {{ post.status }}
                      </span>
                    </div>
                    <p v-if="post.post_text" class="post-card-text">
                      {{ truncateText(post.post_text, 150) }}
                    </p>
                    <div v-if="post.restaurant_name" class="post-card-restaurant">
                      🏪 {{ post.restaurant_name }}
                    </div>
                    <!-- Error Message (if failed) -->
                    <div v-if="post.status === 'failed' && post.error_message" class="post-card-error">
                      ⚠️ {{ truncateText(post.error_message, 80) }}
                    </div>
                    <div class="post-card-footer">
                      <span class="post-card-timing">{{ getTimeRemaining(post) }}</span>
                      <!-- View Post Link for Published Posts -->
                      <a
                        v-if="post.status === 'published' && post.platform_post_urls && Object.keys(post.platform_post_urls).length > 0"
                        :href="Object.values(post.platform_post_urls)[0] as string"
                        target="_blank"
                        rel="noopener noreferrer"
                        class="view-post-link"
                        @click.stop
                      >
                        🔗 View on {{ capitalizeFirst(Object.keys(post.platform_post_urls)[0]) }}
                      </a>
                      <!-- Fallback for old single-platform posts -->
                      <a
                        v-else-if="post.status === 'published' && post.platform_post_url"
                        :href="post.platform_post_url"
                        target="_blank"
                        rel="noopener noreferrer"
                        class="view-post-link"
                        @click.stop
                      >
                        🔗 View Post
                      </a>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Pagination Controls for Day View -->
              <div v-if="viewMode === 'day' && getTotalPages(day.posts) > 1" class="day-view-pagination">
                <button
                  class="pagination-btn"
                  :disabled="dayViewPage === 1"
                  @click.stop="dayViewPage--"
                >
                  ← Previous
                </button>
                <span class="pagination-info">
                  Page {{ dayViewPage }} of {{ getTotalPages(day.posts) }}
                </span>
                <button
                  class="pagination-btn"
                  :disabled="dayViewPage === getTotalPages(day.posts)"
                  @click.stop="dayViewPage++"
                >
                  Next →
                </button>
              </div>

              <!-- Month/Week View: Show compact indicators -->
              <template v-else>
                <div
                  v-for="post in day.posts.slice(0, 3)"
                  :key="post.id"
                  :class="['post-indicator', post.status ? `status-${post.status}` : `platform-${post.platform}`]"
                  :title="`${formatTime(post.scheduled_time) || $t('scheduler.noTime')} - ${post.post_text || $t('scheduler.scheduledPosts')}`"
                >
                  {{ getContentTypeEmoji(post.content_type) }}
                  <span class="post-time-mini">{{ formatTime(post.scheduled_time) }}</span>
                </div>
                <span v-if="day.posts.length > 3" class="more-posts">
                  +{{ day.posts.length - 3 }}
                </span>
              </template>
            </div>
          </div>
        </div>
      </BaseCard>

      <!-- Selected Day Detail -->
      <BaseCard
        v-if="selectedDayWithFilteredPosts && (selectedDayWithFilteredPosts.posts.length > 0 || selectedDayWithFilteredPosts.holidays?.length > 0)"
        variant="glass-intense"
        class="day-detail-card"
      >
        <div class="detail-header">
          <h3 class="detail-title">
            📅 {{ formatShortDate(selectedDayWithFilteredPosts) }}
            <span v-if="selectedDayWithFilteredPosts.posts.length > 0" class="post-count"
              >({{ selectedDayWithFilteredPosts.posts.length }} {{ selectedDayWithFilteredPosts.posts.length === 1 ? $t('scheduler.post') : $t('scheduler.posts') }})</span
            >
          </h3>
          <BaseButton variant="primary" size="medium" @click="openCreatePostWizard(selectedDayWithFilteredPosts)">
            ➕ Create Post
          </BaseButton>
        </div>

        <!-- Show holidays if any -->
        <div
          v-if="selectedDayWithFilteredPosts.holidays && selectedDayWithFilteredPosts.holidays.length > 0"
          class="holidays-section"
        >
          <h4 class="section-subtitle">{{ $t('scheduler.holidays') }}</h4>
          <div class="holidays-list">
            <div v-for="holiday in selectedDayWithFilteredPosts.holidays" :key="holiday.name" class="holiday-card">
              <div class="holiday-icon">{{ getHolidayEmoji(holiday) }}</div>
              <div class="holiday-details">
                <h5 class="holiday-name">{{ holiday.name }}</h5>
                <p v-if="holiday.description" class="holiday-description">
                  {{ holiday.description }}
                </p>
                <div class="holiday-meta">
                  <span v-if="holiday.religion" class="holiday-religion">{{
                    holiday.religion
                  }}</span>
                  <span v-if="holiday.type && holiday.type.length > 0" class="holiday-type">{{
                    holiday.type.join(', ')
                  }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="posts-list">
          <div
            v-for="post in paginatedDayPosts(selectedDayWithFilteredPosts.posts)"
            :key="post.id"
            :class="['scheduled-post-card-new', post.status ? `status-${post.status}` : '']"
            @click="viewPostDetail(post)"
          >
            <!-- Status Indicator Bar -->
            <div :class="['status-bar', `status-${post.status || 'scheduled'}`]"></div>

            <!-- Card Content -->
            <div class="card-content">
              <!-- Left: Media Section -->
              <div class="media-section">
                <img
                  v-if="post.content_type === 'image' && post.media_url"
                  :src="getMediaUrl(post.media_url)"
                  :alt="post.post_text || 'Scheduled post'"
                  class="post-image"
                  @error="handleImageError($event, post)"
                  loading="lazy"
                />
                <video
                  v-else-if="post.content_type === 'video' && post.media_url"
                  :src="getMediaUrl(post.media_url)"
                  class="post-image"
                  muted
                  preload="metadata"
                ></video>
                <div v-else class="post-image-placeholder">
                  <span class="placeholder-icon">📸</span>
                </div>

                <!-- Content Type Badge on Image -->
                <div class="media-badge">
                  {{ post.content_type === 'image' ? '📸' : '🎥' }}
                </div>
              </div>

              <!-- Right: Content Section -->
              <div class="content-section">
                <!-- Header Row -->
                <div class="content-header">
                  <div class="time-badge">
                    <span class="time-icon">🕐</span>
                    <span class="time-text">{{ formatTime(post.scheduled_time) || 'No time' }}</span>
                  </div>

                  <div class="status-badges">
                    <!-- Platform Badges (multiple) -->
                    <template v-if="post.platforms && post.platforms.length > 0">
                      <span
                        v-for="platform in post.platforms"
                        :key="platform"
                        :class="['platform-badge-new', `platform-${platform}`]"
                      >
                        {{ getPlatformIcon(platform) }} {{ capitalizeFirst(platform) }}
                      </span>
                    </template>
                    <!-- Fallback for old data structure -->
                    <span v-else-if="post.platform" :class="['platform-badge-new', `platform-${post.platform}`]">
                      {{ getPlatformIcon(post.platform) }} {{ capitalizeFirst(post.platform) }}
                    </span>

                    <!-- Status Badge -->
                    <span :class="['status-badge-new', `status-${post.status || 'scheduled'}`]">
                      <template v-if="post.status === 'published'">✅ Posted</template>
                      <template v-else-if="post.status === 'failed'">❌ Failed</template>
                      <template v-else>📅 Scheduled</template>
                    </span>
                  </div>
                </div>

                <!-- Post Text / Description -->
                <div class="post-content">
                  <p v-if="post.post_text" class="post-description">
                    {{ truncateText(post.post_text, 180) }}
                  </p>
                  <p v-else class="post-description empty">No description provided</p>
                </div>

                <!-- Restaurant Tag -->
                <div v-if="post.restaurant_name" class="restaurant-badge">
                  🏪 {{ post.restaurant_name }}
                </div>

                <!-- Footer Row -->
                <div class="content-footer">
                  <!-- Time Remaining / Published Info -->
                  <div class="footer-info">
                    <template v-if="post.status === 'published'">
                      <span class="published-time">{{ formatPublishedDate(post.published_at) }}</span>
                    </template>
                    <template v-else>
                      <span class="countdown">{{ getTimeRemaining(post) }}</span>
                    </template>
                  </div>

                  <!-- Action Buttons -->
                  <div v-if="post.status !== 'published'" class="action-buttons" @click.stop>
                    <button class="action-btn edit-btn" @click="editScheduledPost(post)" title="Edit post">
                      ✏️
                    </button>
                    <button class="action-btn delete-btn" @click="cancelPost(post.id)" title="Cancel post">
                      🗑️
                    </button>
                  </div>

                  <!-- View Post Link for Published Posts -->
                  <div v-else-if="post.platform_post_urls && Object.keys(post.platform_post_urls).length > 0" class="action-buttons" @click.stop>
                    <a
                      v-for="(url, platform) in (post.platform_post_urls as Record<string, string>)"
                      :key="platform"
                      :href="url"
                      target="_blank"
                      rel="noopener noreferrer"
                      class="view-post-btn"
                    >
                      🔗 View on {{ capitalizeFirst(platform) }}
                    </a>
                  </div>
                  <!-- Fallback for old single-platform posts -->
                  <div v-else-if="post.platform_post_url" class="action-buttons" @click.stop>
                    <a
                      :href="post.platform_post_url"
                      target="_blank"
                      rel="noopener noreferrer"
                      class="view-post-btn"
                    >
                      🔗 View on {{ capitalizeFirst(post.platform || 'Platform') }}
                    </a>
                  </div>
                </div>

                <!-- Error Message (if failed) -->
                <div v-if="post.status === 'failed' && post.error_message" class="error-banner">
                  <span class="error-icon">⚠️</span>
                  <span class="error-text">{{ truncateText(post.error_message, 100) }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Pagination Controls for Selected Day Detail -->
        <div v-if="selectedDayWithFilteredPosts && getTotalPages(selectedDayWithFilteredPosts.posts) > 1" class="detail-pagination">
          <button
            class="pagination-btn"
            :disabled="dayViewPage === 1"
            @click="dayViewPage--"
          >
            ← Previous
          </button>
          <span class="pagination-info">
            Page {{ dayViewPage }} of {{ getTotalPages(selectedDayWithFilteredPosts.posts) }}
          </span>
          <button
            class="pagination-btn"
            :disabled="dayViewPage === getTotalPages(selectedDayWithFilteredPosts.posts)"
            @click="dayViewPage++"
          >
            Next →
          </button>
        </div>
      </BaseCard>

      <!-- Empty State -->
      <BaseCard v-else-if="selectedDay" variant="glass" class="empty-detail-card">
        <div class="empty-content">
          <h3 class="empty-date">📅 {{ formatShortDate(selectedDay) }}</h3>
          <p class="empty-title">{{ $t('scheduler.noPostsScheduled') }}</p>
          <p class="empty-subtitle">{{ $t('scheduler.goToCookUp') }}</p>
          <BaseButton variant="primary" @click="openCreatePostWizard(selectedDay)">
            ➕ Create Post
          </BaseButton>
        </div>
      </BaseCard>
    </div>

    <!-- Pick Post Modal -->
    <PickPostModal
      v-model="showPickPostModal"
      :selected-date="selectedDateForScheduling"
      @scheduled="handlePostScheduled"
    />

    <!-- Create Post Wizard Modal -->
    <Teleport to="body">
      <div v-if="showCreatePostWizard" class="modal-overlay" @click.self="showCreatePostWizard = false">
        <BaseCard variant="glass-intense" class="wizard-modal">
          <div class="wizard-header">
            <h2 class="wizard-title">Create Post for {{ formatWizardDate(selectedDateForScheduling) }}</h2>
            <button class="wizard-close-btn" @click="showCreatePostWizard = false">&times;</button>
          </div>

          <div class="wizard-body">
            <p class="wizard-subtitle">How would you like to create your post?</p>

            <div class="creation-options">
              <!-- From Saved Posts Option -->
              <button
                class="creation-option-card"
                @click="selectCreationMethod('saved')"
              >
                <div class="option-icon">✨</div>
                <h3 class="option-title">From Saved Posts</h3>
                <p class="option-description">
                  Choose from your saved posts
                </p>
              </button>

              <!-- Create New Option -->
              <button
                class="creation-option-card"
                @click="selectCreationMethod('new')"
              >
                <div class="option-icon-logo">
                  <img src="/src/assets/socialchef_logo.svg" alt="SocialChef" class="chef-logo-icon" />
                </div>
                <h3 class="option-title">Create New</h3>
                <p class="option-description">
                  Cook up fresh content
                </p>
              </button>
            </div>
          </div>
        </BaseCard>
      </div>
    </Teleport>

    <!-- Post Detail Modal -->
    <div
      v-if="showPostDetailModal && selectedPostForDetail"
      class="modal-overlay"
      @click="closePostDetailModal"
    >
      <div class="modal-content" @click.stop>
        <button class="modal-close" @click="closePostDetailModal">×</button>

        <div class="modal-body">
          <!-- Large Image/Video -->
          <div class="modal-media">
            <img
              v-if="
                selectedPostForDetail.content_type === 'image' && selectedPostForDetail.media_url
              "
              :src="getMediaUrl(selectedPostForDetail.media_url)"
              alt="Post content"
              class="modal-image"
            />
            <video
              v-else-if="
                selectedPostForDetail.content_type === 'video' && selectedPostForDetail.media_url
              "
              :src="getMediaUrl(selectedPostForDetail.media_url)"
              controls
              class="modal-video"
            ></video>
            <div v-else class="modal-no-media">
              <span class="placeholder-icon">📸</span>
              <span class="placeholder-text">{{ $t('scheduler.noMediaAvailable') }}</span>
            </div>
          </div>

          <!-- Post Information -->
          <div class="modal-info">
            <h2 class="modal-title">{{ $t('scheduler.postDetails') }}</h2>

            <!-- Date & Time -->
            <div class="info-section">
              <div class="info-label">📅 {{ $t('scheduler.scheduledFor') }}</div>
              <div class="info-value">
                {{ formatSelectedDate({ date: new Date(selectedPostForDetail.scheduled_date) }) }}
              </div>
              <div class="info-value time-display">
                {{ formatTime(selectedPostForDetail.scheduled_time) || $t('scheduler.noTimeSet') }}
                <span v-if="selectedPostForDetail.timezone" class="timezone-badge">
                  {{ selectedPostForDetail.timezone }}
                </span>
              </div>
              <div class="time-remaining-large">
                {{ getTimeRemaining(selectedPostForDetail) }}
              </div>
            </div>

            <!-- Platform & Status -->
            <div class="info-section">
              <div class="info-label">{{ $t('scheduler.platformAndStatus') }}</div>
              <div class="badges-row">
                <!-- Platform Badges (multiple) -->
                <template v-if="selectedPostForDetail.platforms && selectedPostForDetail.platforms.length > 0">
                  <span
                    v-for="platform in selectedPostForDetail.platforms"
                    :key="platform"
                    :class="['platform-badge-large', `platform-${platform}`]"
                  >
                    {{ platform }}
                  </span>
                </template>
                <!-- Fallback for old data structure -->
                <span
                  v-else-if="selectedPostForDetail.platform"
                  :class="['platform-badge-large', `platform-${selectedPostForDetail.platform}`]"
                >
                  {{ selectedPostForDetail.platform }}
                </span>

                <span :class="['content-type-badge-large']">
                  <template v-if="selectedPostForDetail.content_type === 'image'">📸 {{ $t('scheduler.image') }}</template>
                  <template v-else>🎥 {{ $t('scheduler.video') }}</template>
                </span>
                <span
                  v-if="selectedPostForDetail.status"
                  :class="['status-badge-large', `status-${selectedPostForDetail.status}`]"
                >
                  {{ selectedPostForDetail.status }}
                </span>
              </div>
            </div>

            <!-- Restaurant -->
            <div v-if="selectedPostForDetail.restaurant_name" class="info-section">
              <div class="info-label">🏪 {{ $t('scheduler.restaurant') }}</div>
              <div class="info-value">{{ selectedPostForDetail.restaurant_name }}</div>
            </div>

            <!-- Post Text -->
            <div v-if="selectedPostForDetail.post_text" class="info-section">
              <div class="info-label">📝 {{ $t('scheduler.caption') }}</div>
              <div class="info-value post-caption">{{ selectedPostForDetail.post_text }}</div>
            </div>

            <!-- Error Message (if failed) -->
            <div v-if="selectedPostForDetail.status === 'failed' && selectedPostForDetail.error_message" class="info-section error-section">
              <div class="info-label error-label">⚠️ Error Details</div>
              <div class="info-value error-text">
                {{ selectedPostForDetail.error_message }}
              </div>
            </div>

            <!-- Published Info -->
            <div v-if="selectedPostForDetail.status === 'published'" class="info-section published-section">
              <div class="published-badge-large">
                ✅ Successfully Posted
              </div>
              <div class="published-details-large">
                <div v-if="selectedPostForDetail.published_at" class="published-info-item">
                  <span class="published-info-label">📅 Published:</span>
                  <span class="published-info-value">{{ formatPublishedDate(selectedPostForDetail.published_at) }}</span>
                </div>
                <div v-if="selectedPostForDetail.platform" class="published-info-item">
                  <span class="published-info-label">📱 Platform:</span>
                  <span class="published-info-value">{{ getPlatformIcon(selectedPostForDetail.platform) }} {{ capitalizeFirst(selectedPostForDetail.platform) }}</span>
                </div>
              </div>

              <!-- View Post Buttons (multi-platform support) -->
              <div v-if="selectedPostForDetail.platform_post_urls && Object.keys(selectedPostForDetail.platform_post_urls).length > 0" class="view-post-buttons-container">
                <a
                  v-for="(url, platform) in (selectedPostForDetail.platform_post_urls as Record<string, string>)"
                  :key="platform"
                  :href="url"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="view-post-button-modal"
                >
                  <span class="view-post-icon">🔗</span>
                  <span>View on {{ capitalizeFirst(platform) }}</span>
                  <span class="external-icon">↗</span>
                </a>
              </div>
              <!-- Fallback for old single-platform posts -->
              <a
                v-else-if="selectedPostForDetail.platform_post_url"
                :href="selectedPostForDetail.platform_post_url"
                target="_blank"
                rel="noopener noreferrer"
                class="view-post-button-modal"
              >
                <span class="view-post-icon">🔗</span>
                <span>View Post on {{ capitalizeFirst(selectedPostForDetail.platform || 'Platform') }}</span>
                <span class="external-icon">↗</span>
              </a>
            </div>

            <!-- Actions (only for scheduled/failed posts) -->
            <div v-if="selectedPostForDetail.status !== 'published'" class="modal-actions">
              <BaseButton
                variant="ghost"
                size="medium"
                @click="editScheduledPost(selectedPostForDetail)"
              >
                ✏️ {{ $t('scheduler.edit') }}
              </BaseButton>
              <BaseButton
                variant="danger"
                size="medium"
                @click="cancelPost(selectedPostForDetail.id); closePostDetailModal()"
              >
                🗑️ {{ $t('scheduler.cancelPost') }}
              </BaseButton>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Edit Scheduled Post Modal -->
    <EditScheduledPostModal
      v-model="showEditModal"
      :post="postToEdit"
      @save="handleSaveEdit"
    />

    <!-- Confirmation Modal -->
    <ConfirmModal
      v-model="showConfirmModal"
      :title="confirmModalConfig.title"
      :message="confirmModalConfig.message"
      :confirm-text="confirmModalConfig.confirmText"
      :cancel-text="confirmModalConfig.cancelText"
      :type="confirmModalConfig.type"
      :loading="cancelLoading"
      @confirm="confirmModalConfig.onConfirm"
    />

    <!-- Toast Notification -->
    <Toast
      v-model="showToast"
      :message="toastMessage"
      :type="toastType"
      :duration="4000"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { toZonedTime, fromZonedTime } from 'date-fns-tz'
import GradientBackground from '../components/GradientBackground.vue'
import BaseCard from '../components/BaseCard.vue'
import BaseButton from '../components/BaseButton.vue'
import PickPostModal from '../components/PickPostModal.vue'
import EditScheduledPostModal from '../components/EditScheduledPostModal.vue'
import Toast from '../components/Toast.vue'
import ConfirmModal from '../components/ConfirmModal.vue'
import { api } from '../services/api'

const router = useRouter()
const { t } = useI18n()

// Calendar state
const currentDate = ref(new Date())
const selectedDay = ref<any>(null)
const scheduledPosts = ref<any[]>([])
const holidays = ref<any[]>([])
const loading = ref(false)
const showPickPostModal = ref(false)
const selectedDateForScheduling = ref<string | null>(null)
const selectedCountry = ref('NO') // Norway as default
const showPostDetailModal = ref(false)
const selectedPostForDetail = ref<any>(null)
const showEditModal = ref(false)
const postToEdit = ref<any>(null)
const showCreatePostWizard = ref(false)
const wizardStep = ref(1) // 1 = Choose Method, 2 = Create/Select Content
const selectedCreationMethod = ref<'saved' | 'new' | null>(null)
const dayViewPage = ref(1)
const postsPerPage = 3

// Toast and confirmation state
const showToast = ref(false)
const toastMessage = ref('')
const toastType = ref<'success' | 'error' | 'info' | 'warning'>('info')
const showConfirmModal = ref(false)
const confirmModalConfig = ref({
  title: '',
  message: '',
  confirmText: '',
  cancelText: '',
  type: 'info' as 'info' | 'warning' | 'danger' | 'success',
  onConfirm: () => {},
})
const cancelLoading = ref(false)
const postIdToCancel = ref<string | null>(null)
const viewMode = ref<'month' | 'week' | 'day'>('month')

// Filters (now using arrays for multi-select)
const filters = ref({
  platforms: [] as string[],
  restaurant_ids: [] as string[],
})
const filtersExpanded = ref(false)
const platformFilterOpen = ref(false)
const restaurantFilterOpen = ref(false)
const platformFilterRef = ref<HTMLElement | null>(null)
const restaurantFilterRef = ref<HTMLElement | null>(null)
const restaurants = ref<any[]>([])

const availablePlatforms = [
  { id: 'facebook', name: 'Facebook', icon: '📘' },
  { id: 'instagram', name: 'Instagram', icon: '📷' },
  { id: 'tiktok', name: 'TikTok', icon: '🎵' },
]

const activeFilterCount = computed(() => {
  return filters.value.platforms.length + filters.value.restaurant_ids.length
})

const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

const currentPeriodLabel = computed(() => {
  if (viewMode.value === 'day') {
    return currentDate.value.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    })
  } else if (viewMode.value === 'week') {
    const weekStart = getWeekStart(currentDate.value)
    const weekEnd = getWeekEnd(currentDate.value)
    return `${weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${weekEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`
  }
  return currentMonthYear.value
})

const displayedWeekDays = computed(() => {
  if (viewMode.value === 'week') {
    return weekDays
  }
  return weekDays
})

const displayedCalendarDays = computed(() => {
  if (viewMode.value === 'day') {
    // Return only the current day
    const year = currentDate.value.getFullYear()
    const month = currentDate.value.getMonth()
    const day = currentDate.value.getDate()
    const date = new Date(year, month, day)
    const dateString = date.toISOString().split('T')[0]
    const postsForDay = scheduledPosts.value.filter((post) => post.scheduled_date === dateString)
    const holidaysForDay = holidays.value.filter((holiday) => holiday.date === dateString)

    return [
      {
        day,
        date,
        isOtherMonth: false,
        isToday: isToday(date),
        posts: postsForDay,
        holidays: holidaysForDay,
      },
    ]
  } else if (viewMode.value === 'week') {
    // Return only days in the current week
    return calendarDays.value.filter((day) => {
      const weekStart = getWeekStart(currentDate.value)
      const weekEnd = getWeekEnd(currentDate.value)
      return day.date >= weekStart && day.date <= weekEnd && !day.isOtherMonth
    })
  }
  // Month view - return all days
  return calendarDays.value
})

const getWeekStart = (date: Date) => {
  const d = new Date(date)
  const day = d.getDay()
  // Adjust for Monday start (Monday = 0, Sunday = 6)
  const diff = d.getDate() - ((day + 6) % 7)
  return new Date(d.setDate(diff))
}

const getWeekEnd = (date: Date) => {
  const weekStart = getWeekStart(date)
  return new Date(weekStart.getTime() + 6 * 24 * 60 * 60 * 1000)
}

const previousPeriod = () => {
  if (viewMode.value === 'day') {
    currentDate.value = new Date(
      currentDate.value.getFullYear(),
      currentDate.value.getMonth(),
      currentDate.value.getDate() - 1,
    )
  } else if (viewMode.value === 'week') {
    currentDate.value = new Date(
      currentDate.value.getFullYear(),
      currentDate.value.getMonth(),
      currentDate.value.getDate() - 7,
    )
  } else {
    currentDate.value = new Date(currentDate.value.getFullYear(), currentDate.value.getMonth() - 1)
  }
  fetchScheduledPosts()
  fetchHolidays()
}

const nextPeriod = () => {
  if (viewMode.value === 'day') {
    currentDate.value = new Date(
      currentDate.value.getFullYear(),
      currentDate.value.getMonth(),
      currentDate.value.getDate() + 1,
    )
  } else if (viewMode.value === 'week') {
    currentDate.value = new Date(
      currentDate.value.getFullYear(),
      currentDate.value.getMonth(),
      currentDate.value.getDate() + 7,
    )
  } else {
    currentDate.value = new Date(currentDate.value.getFullYear(), currentDate.value.getMonth() + 1)
  }
  fetchScheduledPosts()
  fetchHolidays()
}

const currentMonthYear = computed(() => {
  return currentDate.value.toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  })
})

// Helper to format date as YYYY-MM-DD
const formatDateString = (date: Date) => {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

// Helper to normalize a date string to YYYY-MM-DD format
const normalizeDate = (dateStr: string | undefined) => {
  if (!dateStr) return ''
  // Handle both "2025-11-30" and "2025-11-30T..." formats
  return dateStr.split('T')[0]
}

const calendarDays = computed(() => {
  const year = currentDate.value.getFullYear()
  const month = currentDate.value.getMonth()

  // Get first day of month and last day of month
  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)

  // Get days from previous month to fill the first week (Monday = 0, Sunday = 6)
  const startingDayOfWeek = (firstDay.getDay() + 6) % 7
  const prevMonthLastDay = new Date(year, month, 0)
  const prevMonthDays = prevMonthLastDay.getDate()

  const days = []

  // Helper to get posts and holidays for a specific date
  const getDataForDate = (date: Date) => {
    const dateString = formatDateString(date)
    const postsForDay = scheduledPosts.value.filter((post) => {
      const postDate = post.scheduled_date || ''
      return postDate === dateString
    })
    const holidaysForDay = holidays.value.filter((holiday) => {
      const holidayDate = holiday.date ? holiday.date.split('T')[0] : ''
      return holidayDate === dateString
    })
    return { postsForDay, holidaysForDay }
  }

  // Previous month days
  for (let i = startingDayOfWeek - 1; i >= 0; i--) {
    const day = prevMonthDays - i
    const date = new Date(year, month - 1, day)
    const { postsForDay, holidaysForDay } = getDataForDate(date)

    days.push({
      day,
      date,
      isOtherMonth: true,
      isToday: false,
      posts: postsForDay,
      holidays: holidaysForDay,
    })
  }

  // Current month days
  for (let day = 1; day <= lastDay.getDate(); day++) {
    const date = new Date(year, month, day)
    const { postsForDay, holidaysForDay } = getDataForDate(date)

    days.push({
      day,
      date,
      isOtherMonth: false,
      isToday: isToday(date),
      posts: postsForDay,
      holidays: holidaysForDay,
    })
  }

  // Next month days to complete the grid
  const remainingDays = 42 - days.length // 6 weeks * 7 days
  for (let day = 1; day <= remainingDays; day++) {
    const date = new Date(year, month + 1, day)
    const { postsForDay, holidaysForDay } = getDataForDate(date)

    days.push({
      day,
      date,
      isOtherMonth: true,
      isToday: false,
      posts: postsForDay,
      holidays: holidaysForDay,
    })
  }

  return days
})

const isToday = (date: Date) => {
  const today = new Date()
  return (
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear()
  )
}

const previousMonth = () => {
  currentDate.value = new Date(currentDate.value.getFullYear(), currentDate.value.getMonth() - 1)
  fetchScheduledPosts()
  fetchHolidays()
}

const nextMonth = () => {
  currentDate.value = new Date(currentDate.value.getFullYear(), currentDate.value.getMonth() + 1)
  fetchScheduledPosts()
  fetchHolidays()
}

const isPastDate = (date: Date) => {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const checkDate = new Date(date)
  checkDate.setHours(0, 0, 0, 0)
  return checkDate < today
}

const selectDay = (day: any) => {
  // Only allow selecting today or future dates (even from other months)
  if (!isPastDate(day.date)) {
    selectedDay.value = day
  }
}

// Computed property to get the selected day with current filtered posts
const selectedDayWithFilteredPosts = computed(() => {
  if (!selectedDay.value) return null

  // Find the day in the current calendar (which has filtered posts)
  const currentDay = displayedCalendarDays.value.find((day: any) => {
    return day.date && selectedDay.value.date &&
      day.date.getTime() === selectedDay.value.date.getTime()
  })

  return currentDay || selectedDay.value
})

// Computed property for upcoming posts (all future scheduled posts)
const upcomingPosts = computed(() => {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const todayString = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`

  return scheduledPosts.value
    .filter((post) => {
      // Only show scheduled posts (not published or failed)
      if (post.status && post.status !== 'scheduled') return false
      // Only show posts from today onwards
      return post.scheduled_date >= todayString
    })
    .sort((a, b) => {
      // Sort by date then time
      if (a.scheduled_date !== b.scheduled_date) {
        return a.scheduled_date.localeCompare(b.scheduled_date)
      }
      return (a.scheduled_time || '').localeCompare(b.scheduled_time || '')
    })
    .slice(0, 10) // Show max 10 upcoming posts
})

const formatUpcomingDate = (dateString: string) => {
  const date = new Date(dateString + 'T00:00:00')
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)

  if (date.getTime() === today.getTime()) {
    return 'Today'
  }
  if (date.getTime() === tomorrow.getTime()) {
    return 'Tomorrow'
  }
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  })
}

const formatSelectedDate = (day: any) => {
  return day.date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
}

const formatShortDate = (day: any) => {
  return day.date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  })
}

const formatWizardDate = (dateString: string | null) => {
  if (!dateString) return ''
  const date = new Date(dateString + 'T00:00:00')
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
}

// Pagination helpers
const getTotalPages = (posts: any[]) => {
  return Math.ceil(posts.length / postsPerPage)
}

const paginatedDayPosts = (posts: any[]) => {
  const start = (dayViewPage.value - 1) * postsPerPage
  const end = start + postsPerPage
  return posts.slice(start, end)
}

// Reset pagination when changing views
watch(viewMode, () => {
  dayViewPage.value = 1
})

watch(currentDate, () => {
  dayViewPage.value = 1
})

const getContentTypeEmoji = (type: string) => {
  return type === 'image' ? '📸' : '🎥'
}

const getHolidayEmoji = (holiday: any) => {
  // Check for specific holiday names first
  const name = holiday.name.toLowerCase()

  // Christmas and related
  if (name.includes('christmas')) return '🎄'
  if (name.includes('easter')) return '🐰'
  if (name.includes('new year')) return '🎆'

  // National holidays
  if (name.includes('independence') || name.includes('constitution')) return '🇳🇴'
  if (name.includes('labor') || name.includes('labour') || name.includes('workers')) return '👷'

  // Religious holidays by religion
  if (holiday.religion) {
    const religion = holiday.religion.toLowerCase()
    if (religion === 'christian') return '✝️'
    if (religion === 'muslim') return '☪️'
    if (religion === 'jewish') return '✡️'
    if (religion === 'hindu') return '🕉️'
    if (religion === 'buddhist') return '☸️'
  }

  // Holiday types
  if (holiday.type && holiday.type.includes('national')) return '🎌'
  if (holiday.type && holiday.type.includes('religious')) return '🙏'

  // Default
  return '🎉'
}

const truncateText = (text: string, maxLength: number) => {
  if (text.length <= maxLength) return text
  return text.substring(0, maxLength) + '...'
}

const formatTime = (time: string | null) => {
  if (!time) return null
  // Convert 24-hour time to 12-hour format
  const [hours, minutes] = time.split(':')
  const hour = parseInt(hours)
  const ampm = hour >= 12 ? 'PM' : 'AM'
  const displayHour = hour % 12 || 12
  return `${displayHour}:${minutes} ${ampm}`
}

const formatPublishedDate = (dateString: string) => {
  const date = new Date(dateString)
  const now = new Date()
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)

  // Less than a minute
  if (diffInSeconds < 60) {
    return 'Just now'
  }

  // Less than an hour
  if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60)
    return `${minutes} minute${minutes > 1 ? 's' : ''} ago`
  }

  // Less than a day
  if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600)
    return `${hours} hour${hours > 1 ? 's' : ''} ago`
  }

  // Less than a week
  if (diffInSeconds < 604800) {
    const days = Math.floor(diffInSeconds / 86400)
    return `${days} day${days > 1 ? 's' : ''} ago`
  }

  // Format as date
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
    hour: '2-digit',
    minute: '2-digit'
  })
}

const getPlatformIcon = (platform: string) => {
  const icons: Record<string, string> = {
    facebook: '👥',
    instagram: '📷',
    tiktok: '🎵',
    twitter: '🐦',
    linkedin: '💼'
  }
  return icons[platform.toLowerCase()] || '📱'
}

const capitalizeFirst = (str: string) => {
  if (!str) return ''
  return str.charAt(0).toUpperCase() + str.slice(1)
}

const getTimeRemaining = (post: any) => {
  if (!post.scheduled_date || !post.scheduled_time) {
    return '⏱️ No time specified'
  }

  try {
    // Combine date and time with timezone awareness
    const dateTimeString = `${post.scheduled_date}T${post.scheduled_time}`
    const userTimezone = post.timezone || 'UTC'

    // Parse the date in the user's timezone, then convert to UTC for comparison
    const scheduledDateInZone = toZonedTime(dateTimeString, userTimezone)
    const scheduledDateTimeUTC = fromZonedTime(scheduledDateInZone, userTimezone)
    const now = new Date()
    const diff = scheduledDateTimeUTC.getTime() - now.getTime()

    // If in the past
    if (diff < 0) {
      const absDiff = Math.abs(diff)
      const hours = Math.floor(absDiff / (1000 * 60 * 60))
      const minutes = Math.floor((absDiff % (1000 * 60 * 60)) / (1000 * 60))

      if (hours > 24) {
        const days = Math.floor(hours / 24)
        return `⏰ Posted ${days} day${days > 1 ? 's' : ''} ago`
      }
      return `⏰ Posted ${hours}h ${minutes}m ago`
    }

    // Future - calculate time remaining
    const totalMinutes = Math.floor(diff / (1000 * 60))
    const hours = Math.floor(totalMinutes / 60)
    const minutes = totalMinutes % 60

    if (hours > 48) {
      const days = Math.floor(hours / 24)
      return `⏰ Posts in ${days} day${days > 1 ? 's' : ''}`
    } else if (hours > 0) {
      return `⏰ Posts in ${hours}h ${minutes}m`
    } else {
      return `⏰ Posts in ${minutes}m`
    }
  } catch (error) {
    return '⏱️ Invalid time'
  }
}

const detectContentTypeFromUrl = (mediaUrl: string): string => {
  if (!mediaUrl) return 'image'

  const url = mediaUrl.toLowerCase()
  const videoExtensions = ['.mp4', '.mov', '.avi', '.webm', '.mkv', '.flv', '.wmv']
  const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp', '.svg']

  // Check for video extensions
  if (videoExtensions.some((ext) => url.includes(ext))) {
    return 'video'
  }

  // Check for image extensions
  if (imageExtensions.some((ext) => url.includes(ext))) {
    return 'image'
  }

  // Default to image if can't determine
  return 'image'
}

const fetchScheduledPosts = async () => {
  try {
    loading.value = true
    const month = currentDate.value.getMonth() + 1
    const year = currentDate.value.getFullYear()

    // Fetch current month posts
    const response = await api.getScheduledPosts({
      month,
      year,
      platforms: filters.value.platforms.length > 0 ? filters.value.platforms : undefined,
      restaurant_ids: filters.value.restaurant_ids.length > 0 ? filters.value.restaurant_ids : undefined,
    })

    // Also fetch adjacent months for calendar display (previous and next month days shown in grid)
    const prevMonth = month === 1 ? 12 : month - 1
    const prevYear = month === 1 ? year - 1 : year
    const nextMonth = month === 12 ? 1 : month + 1
    const nextYear = month === 12 ? year + 1 : year

    const [prevResponse, nextResponse] = await Promise.all([
      api.getScheduledPosts({
        month: prevMonth,
        year: prevYear,
        platforms: filters.value.platforms.length > 0 ? filters.value.platforms : undefined,
        restaurant_ids: filters.value.restaurant_ids.length > 0 ? filters.value.restaurant_ids : undefined,
      }),
      api.getScheduledPosts({
        month: nextMonth,
        year: nextYear,
        platforms: filters.value.platforms.length > 0 ? filters.value.platforms : undefined,
        restaurant_ids: filters.value.restaurant_ids.length > 0 ? filters.value.restaurant_ids : undefined,
      }),
    ])

    // Combine posts from all three months (current, previous, next)
    const allPosts: any[] = []

    if (response.success) {
      allPosts.push(...(response.data?.scheduled_posts || []))
    }
    if (prevResponse.success) {
      allPosts.push(...(prevResponse.data?.scheduled_posts || []))
    }
    if (nextResponse.success) {
      allPosts.push(...(nextResponse.data?.scheduled_posts || []))
    }

    // Remove duplicates by post id
    const uniquePosts = allPosts.filter((post, index, self) =>
      index === self.findIndex((p) => p.id === post.id)
    )

    // Fix content_type based on media_url if it's incorrect
    scheduledPosts.value = uniquePosts.map((post: any) => {
        if (post.favorite_posts) {
        }

        // Try to find the media URL from various possible fields
        let mediaUrl = post.media_url || post.image_url || post.video_url || post.content_url
        let postText = post.post_text || post.caption
        let contentType = post.content_type
        let platform = post.platform
        let restaurantName = post.restaurant_name

        // Check if this is a scheduled favorite (has favorite_posts field)
        if (!mediaUrl && post.favorite_posts) {
          mediaUrl =
            post.favorite_posts.media_url ||
            post.favorite_posts.image_url ||
            post.favorite_posts.video_url
          postText = postText || post.favorite_posts.post_text || post.favorite_posts.caption
          contentType = contentType || post.favorite_posts.content_type
          platform = platform || post.favorite_posts.platform
          restaurantName = restaurantName || post.favorite_posts.restaurant_name
        }

        // Also check legacy field names
        if (!mediaUrl && post.favorite) {
          mediaUrl = post.favorite.media_url || post.favorite.image_url || post.favorite.video_url
          postText = postText || post.favorite.post_text || post.favorite.caption
          contentType = contentType || post.favorite.content_type
          platform = platform || post.favorite.platform
          restaurantName = restaurantName || post.favorite.restaurant_name
        }

        if (!mediaUrl && post.favorite_post) {
          mediaUrl =
            post.favorite_post.media_url ||
            post.favorite_post.image_url ||
            post.favorite_post.video_url
          postText = postText || post.favorite_post.post_text || post.favorite_post.caption
          contentType = contentType || post.favorite_post.content_type
          platform = platform || post.favorite_post.platform
          restaurantName = restaurantName || post.favorite_post.restaurant_name
        }

        // If content_type is still missing, detect from URL
        const detectedType = contentType || detectContentTypeFromUrl(mediaUrl || '')

        // Ensure scheduled_date is normalized (strip time component if present)
        const scheduledDate = post.scheduled_date ? post.scheduled_date.split('T')[0] : post.scheduled_date

        return {
          ...post,
          scheduled_date: scheduledDate,
          media_url: mediaUrl,
          post_text: postText,
          content_type: detectedType,
          platform: platform,
          restaurant_name: restaurantName,
        }
      })
  } catch (error) {
  } finally {
    loading.value = false
  }
}

const fetchHolidays = async () => {
  try {
    const month = currentDate.value.getMonth() + 1
    const year = currentDate.value.getFullYear()

    const response = await api.getHolidaysForMonth(selectedCountry.value, year, month)

    if (response.success) {
      holidays.value = response.data?.holidays || []
    }
  } catch (error) {
    // Don't block the UI if holidays fail to load
    holidays.value = []
  }
}

const editScheduledPost = (post: any) => {
  postToEdit.value = post
  showEditModal.value = true
  // Close detail modal if open
  showPostDetailModal.value = false
}

const handleSaveEdit = async (updates: any) => {
  if (!postToEdit.value) return

  try {
    loading.value = true
    const response = await api.updateScheduledPost(postToEdit.value.id, updates)

    if (response.success) {
      // Close modal first
      showEditModal.value = false
      postToEdit.value = null

      // Then refresh the scheduled posts to update the calendar
      await fetchScheduledPosts()
    } else {
      throw new Error(response.error || 'Failed to update post')
    }
  } catch (error: any) {
    console.error('Error updating post:', error)
    alert(error.message || 'Failed to update post')
  } finally {
    loading.value = false
  }
}

const showCancelConfirmation = (postId: string) => {
  postIdToCancel.value = postId
  confirmModalConfig.value = {
    title: 'Cancel Scheduled Post',
    message: 'Are you sure you want to cancel this scheduled post? This action cannot be undone.',
    confirmText: 'Yes, Cancel Post',
    cancelText: 'Keep Post',
    type: 'danger',
    onConfirm: confirmCancelPost,
  }
  showConfirmModal.value = true
}

const confirmCancelPost = async () => {
  if (!postIdToCancel.value) return

  cancelLoading.value = true

  try {
    const response = await api.cancelScheduledPost(postIdToCancel.value)

    if (response.success) {
      // Keep the currently selected day to reload its posts
      const currentSelectedDay = selectedDay.value

      // Refresh posts
      await fetchScheduledPosts()

      // Re-select the same day if it was selected
      if (currentSelectedDay) {
        const dateString = currentSelectedDay.date.toISOString().split('T')[0]
        const year = currentSelectedDay.date.getFullYear()
        const month = String(currentSelectedDay.date.getMonth() + 1).padStart(2, '0')
        const day = String(currentSelectedDay.date.getDate()).padStart(2, '0')
        const formattedDate = `${year}-${month}-${day}`

        // Find and re-select the day
        const updatedDay = displayedCalendarDays.value.find(
          (d: any) => {
            const dYear = d.date.getFullYear()
            const dMonth = String(d.date.getMonth() + 1).padStart(2, '0')
            const dDay = String(d.date.getDate()).padStart(2, '0')
            return `${dYear}-${dMonth}-${dDay}` === formattedDate
          }
        )

        if (updatedDay) {
          selectedDay.value = updatedDay
        }
      }

      // Show success toast
      toastMessage.value = 'Post canceled successfully'
      toastType.value = 'success'
      showToast.value = true

      // Close the confirm modal
      showConfirmModal.value = false
      postIdToCancel.value = null
    } else {
      throw new Error(response.error || 'Failed to cancel post')
    }
  } catch (error: any) {
    toastMessage.value = error.message || 'Failed to cancel post'
    toastType.value = 'error'
    showToast.value = true
  } finally {
    cancelLoading.value = false
  }
}

const cancelPost = showCancelConfirmation

// Open the create post wizard
const openCreatePostWizard = (day: any) => {
  const year = day.date.getFullYear()
  const month = String(day.date.getMonth() + 1).padStart(2, '0')
  const dayNum = String(day.date.getDate()).padStart(2, '0')
  const dateString = `${year}-${month}-${dayNum}`
  selectedDateForScheduling.value = dateString
  wizardStep.value = 1
  selectedCreationMethod.value = null
  showCreatePostWizard.value = true
}

// Select creation method in wizard
const selectCreationMethod = (method: 'saved' | 'new') => {
  selectedCreationMethod.value = method

  if (method === 'new') {
    // Go to cook up
    showCreatePostWizard.value = false
    router.push(`/cook-up?scheduleDate=${selectedDateForScheduling.value}`)
  } else if (method === 'saved') {
    // Open pick post modal
    showCreatePostWizard.value = false
    showPickPostModal.value = true
  }
}

const createNewPost = (day: any) => {
  // Use local date string to avoid timezone shifts
  const year = day.date.getFullYear()
  const month = String(day.date.getMonth() + 1).padStart(2, '0')
  const dayNum = String(day.date.getDate()).padStart(2, '0')
  const dateString = `${year}-${month}-${dayNum}`
  router.push(`/cook-up?scheduleDate=${dateString}`)
}

const pickPostForDate = (day: any) => {
  // Use local date string to avoid timezone shifts
  const year = day.date.getFullYear()
  const month = String(day.date.getMonth() + 1).padStart(2, '0')
  const dayNum = String(day.date.getDate()).padStart(2, '0')
  const dateString = `${year}-${month}-${dayNum}`
  selectedDateForScheduling.value = dateString
  showPickPostModal.value = true
}

const handlePostScheduled = async () => {
  // Keep the currently selected day to reload its posts
  const currentSelectedDate = selectedDateForScheduling.value

  // Refresh posts
  await fetchScheduledPosts()

  // Re-select the same day if it was selected to show the new post
  if (currentSelectedDate) {
    // Find and re-select the day from the updated calendar data
    const updatedDay = displayedCalendarDays.value.find(
      (d: any) => {
        const dYear = d.date.getFullYear()
        const dMonth = String(d.date.getMonth() + 1).padStart(2, '0')
        const dDay = String(d.date.getDate()).padStart(2, '0')
        return `${dYear}-${dMonth}-${dDay}` === currentSelectedDate
      }
    )

    if (updatedDay) {
      selectedDay.value = updatedDay
    }
  }

  showPickPostModal.value = false
  selectedDateForScheduling.value = null
}

const viewPostDetail = (post: any) => {
  selectedPostForDetail.value = post
  showPostDetailModal.value = true
}

const closePostDetailModal = () => {
  showPostDetailModal.value = false
  selectedPostForDetail.value = null
}

const getMediaUrl = (url: string): string => {
  if (!url) return ''

  // Replace localhost URLs with production API URL
  if (url.includes('localhost:3000')) {
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000'
    return url.replace('http://localhost:3000', apiUrl)
  }

  // If it's already a full URL (Supabase), return it
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url
  }

  // If it's a relative path, construct the full URL
  const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000'
  return `${baseUrl}${url.startsWith('/') ? '' : '/'}${url}`
}

const handleImageError = (event: Event, post: any) => {
  const img = event.target as HTMLImageElement

  // Keep the placeholder visible instead of hiding
}

// Fetch restaurants for filter dropdown
const fetchRestaurants = async () => {
  try {
    const response = await api.getRestaurants()
    if (response.success) {
      restaurants.value = response.data || []
    }
  } catch (error) {
    console.error('Error fetching restaurants:', error)
  }
}

// Apply filters
const applyFilters = () => {
  fetchScheduledPosts()
}

// Reset filters
const resetFilters = () => {
  filters.value = {
    platforms: [],
    restaurant_ids: [],
  }
  fetchScheduledPosts()
}

// Toggle platform filter
const togglePlatformFilter = (platformId: string) => {
  const index = filters.value.platforms.indexOf(platformId)
  if (index === -1) {
    filters.value.platforms.push(platformId)
  } else {
    filters.value.platforms.splice(index, 1)
  }
  applyFilters()
}

// Toggle all platforms
const toggleAllPlatforms = () => {
  if (filters.value.platforms.length === availablePlatforms.length) {
    filters.value.platforms = []
  } else {
    filters.value.platforms = availablePlatforms.map(p => p.id)
  }
  applyFilters()
}

// Toggle restaurant filter
const toggleRestaurantFilter = (restaurantId: string) => {
  const index = filters.value.restaurant_ids.indexOf(restaurantId)
  if (index === -1) {
    filters.value.restaurant_ids.push(restaurantId)
  } else {
    filters.value.restaurant_ids.splice(index, 1)
  }
  applyFilters()
}

// Toggle all restaurants
const toggleAllRestaurants = () => {
  if (filters.value.restaurant_ids.length === restaurants.value.length) {
    filters.value.restaurant_ids = []
  } else {
    filters.value.restaurant_ids = restaurants.value.map(r => String(r.id))
  }
  applyFilters()
}

// Remove single platform filter
const removePlatformFilter = (platformId: string) => {
  filters.value.platforms = filters.value.platforms.filter(p => p !== platformId)
  applyFilters()
}

// Remove single restaurant filter
const removeRestaurantFilter = (restaurantId: string) => {
  filters.value.restaurant_ids = filters.value.restaurant_ids.filter(r => r !== restaurantId)
  applyFilters()
}

// Get restaurant name by ID
const getRestaurantName = (id: string) => {
  const restaurant = restaurants.value.find(r => r.id === id || r.id === parseInt(id))
  return restaurant?.name || id
}

// Click outside handler to close filter dropdowns
const handleClickOutside = (event: MouseEvent) => {
  const target = event.target as HTMLElement

  if (platformFilterRef.value && !platformFilterRef.value.contains(target)) {
    platformFilterOpen.value = false
  }
  if (restaurantFilterRef.value && !restaurantFilterRef.value.contains(target)) {
    restaurantFilterOpen.value = false
  }
}

onMounted(async () => {
  // Add click outside listener
  document.addEventListener('click', handleClickOutside)
  await Promise.all([fetchScheduledPosts(), fetchHolidays(), fetchRestaurants()])

  // Auto-select today's date
  const today = new Date()
  const todayDay = calendarDays.value.find((day) => !day.isOtherMonth && day.isToday)

  if (todayDay) {
    selectedDay.value = todayDay

    // Scroll to the selected day detail card after a short delay
    setTimeout(() => {
      const detailCard = document.querySelector('.day-detail-card')
      if (detailCard) {
        detailCard.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
      }
    }, 100)
  }
})

onUnmounted(() => {
  // Remove click outside listener
  document.removeEventListener('click', handleClickOutside)
})
</script>

<style scoped>
.scheduler-view {
  min-height: 100vh;
  position: relative;
  padding: var(--space-lg) var(--space-md);
}

.container {
  max-width: 1400px;
  margin: 0 auto;
  position: relative;
  z-index: 1;
}

.header {
  text-align: center;
  margin-bottom: var(--space-xl);
}

.title {
  font-family: var(--font-heading);
  font-size: var(--text-2xl);
  font-weight: 700;
  margin: 0 0 var(--space-xs) 0;
  background: linear-gradient(135deg, var(--text-primary) 0%, var(--gold-primary) 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.subtitle {
  font-size: var(--text-sm);
  color: var(--text-secondary);
  margin: 0;
}


/* Streamlined Calendar Header */
.calendar-header-new {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-sm) 0 var(--space-md);
  margin-bottom: var(--space-sm);
}

.nav-arrow {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 40px;
  background: rgba(212, 175, 55, 0.1);
  border: 1px solid rgba(212, 175, 55, 0.25);
  border-radius: var(--radius-md);
  color: var(--text-secondary);
  font-size: var(--text-lg);
  cursor: pointer;
  transition: all var(--transition-fast);
  margin: 0 var(--space-md);
  align-self: flex-end;
  margin-bottom: var(--space-sm);
}

.nav-arrow:hover {
  background: rgba(212, 175, 55, 0.2);
  border-color: rgba(212, 175, 55, 0.5);
  color: var(--gold-primary);
}

.nav-arrow:hover .arrow-tooltip {
  opacity: 1;
  transform: translateY(0);
}

.arrow-icon {
  font-size: var(--text-lg);
}

.arrow-tooltip {
  position: absolute;
  bottom: -32px;
  left: 50%;
  transform: translateX(-50%) translateY(-4px);
  background: rgba(0, 0, 0, 0.9);
  color: var(--gold-light);
  font-size: var(--text-xs);
  padding: 4px 10px;
  border-radius: var(--radius-sm);
  white-space: nowrap;
  opacity: 0;
  pointer-events: none;
  transition: all var(--transition-fast);
  text-transform: capitalize;
  border: 1px solid rgba(212, 175, 55, 0.2);
}

.calendar-center {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-md);
}

.current-month {
  font-family: var(--font-heading);
  font-size: var(--text-3xl);
  font-weight: var(--font-semibold);
  color: var(--gold-primary);
  margin: 0;
}

.view-mode-toggle {
  display: flex;
  background: rgba(0, 0, 0, 0.3);
  padding: 3px;
  border-radius: var(--radius-md);
  position: relative;
}

.toggle-slider {
  position: absolute;
  top: 3px;
  bottom: 3px;
  width: 70px;
  background: var(--gold-primary);
  border-radius: var(--radius-sm);
  transition: left 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  z-index: 0;
  box-shadow: 0 2px 8px rgba(212, 175, 55, 0.3);
}

.toggle-slider.position-month {
  left: 3px;
}

.toggle-slider.position-week {
  left: 73px;
}

.toggle-slider.position-day {
  left: 143px;
}

.view-btn {
  width: 70px;
  padding: var(--space-sm) 0;
  border: none;
  background: transparent;
  color: var(--text-muted);
  font-family: var(--font-body);
  font-size: var(--text-sm);
  font-weight: var(--font-medium);
  cursor: pointer;
  transition: color var(--transition-fast);
  border-radius: var(--radius-sm);
  position: relative;
  z-index: 1;
  text-align: center;
}

.view-btn:hover {
  color: var(--text-primary);
}

.view-btn.active {
  color: var(--text-on-gold);
}

/* Calendar Legend */
.calendar-legend {
  display: flex;
  gap: var(--space-xl);
  justify-content: center;
  align-items: center;
  padding: var(--space-sm) 0;
  margin-bottom: var(--space-md);
}

.legend-item {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  font-size: var(--text-sm);
  color: var(--text-secondary);
}

.legend-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  flex-shrink: 0;
}

.legend-published {
  background-color: rgba(34, 197, 94, 0.8);
}

.legend-scheduled {
  background-color: rgba(59, 130, 246, 0.8);
}

.legend-failed {
  background-color: rgba(239, 68, 68, 0.8);
}

/* Loading Overlay (subtle, doesn't hide calendar) */
.loading-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(10, 10, 10, 0.7);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10;
  border-radius: var(--radius-lg);
  animation: fadeIn 0.2s ease;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.spinner {
  width: 40px;
  height: 40px;
  border: 3px solid rgba(212, 175, 55, 0.2);
  border-top-color: var(--gold-primary);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.calendar-card {
  padding: var(--space-lg);
  margin-bottom: var(--space-lg);
  position: relative;
  min-height: 400px;
}

/* Filter Accordion */
.filter-accordion {
  border-bottom: 1px solid rgba(212, 175, 55, 0.15);
  margin-bottom: var(--space-xl);
  padding-bottom: var(--space-sm);
}

.filter-toggle {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: var(--space-sm) 0;
  background: transparent;
  border: none;
  cursor: pointer;
  color: var(--text-primary);
  transition: color var(--transition-fast);
}

.filter-toggle:hover {
  color: var(--gold-primary);
}

.filter-toggle:hover .filter-label,
.filter-toggle:hover .filter-icon {
  color: var(--gold-primary);
}

.filter-toggle-left {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
}

.filter-icon {
  font-size: var(--text-lg);
}

.filter-label {
  font-family: var(--font-heading);
  font-size: var(--text-lg);
  font-weight: var(--font-semibold);
  color: var(--text-primary);
}

.filter-badge {
  background: var(--gold-primary);
  color: var(--text-on-gold);
  font-size: var(--text-xs);
  padding: 2px 6px;
  border-radius: var(--radius-full);
  font-weight: var(--font-semibold);
}

.filter-arrow {
  font-size: var(--text-xs);
  transition: transform var(--transition-fast);
}

.filter-arrow.expanded {
  transform: rotate(180deg);
}

.filter-content {
  padding: var(--space-md) 0 var(--space-lg) 0;
}

/* Inline Filters */
.inline-filters {
  display: flex;
  gap: var(--space-lg);
  margin-bottom: var(--space-md);
}

.inline-filter-group {
  flex: 1;
  max-width: 300px;
}

.inline-filter-btn {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  width: 100%;
  padding: var(--space-sm) var(--space-md);
  background: rgba(30, 30, 30, 0.6);
  border: 1px solid rgba(212, 175, 55, 0.2);
  border-radius: var(--radius-md);
  color: var(--text-primary);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.inline-filter-btn:hover {
  background: rgba(212, 175, 55, 0.1);
  border-color: rgba(212, 175, 55, 0.4);
}

.inline-filter-icon {
  font-size: var(--text-base);
}

.inline-filter-label {
  font-size: var(--text-sm);
  font-weight: var(--font-medium);
}

.inline-filter-count {
  color: var(--gold-primary);
  font-size: var(--text-sm);
}

.inline-filter-arrow {
  margin-left: auto;
  font-size: var(--text-xs);
  color: var(--text-muted);
  transition: transform var(--transition-fast);
}

.inline-filter-arrow.open {
  transform: rotate(180deg);
}

.inline-filter-options {
  margin-top: var(--space-xs);
  padding: var(--space-sm);
  background: rgba(20, 20, 20, 0.9);
  border: 1px solid rgba(212, 175, 55, 0.15);
  border-radius: var(--radius-md);
}

.filter-checkbox {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  padding: var(--space-xs) var(--space-sm);
  cursor: pointer;
  border-radius: var(--radius-sm);
  transition: background var(--transition-fast);
}

.filter-checkbox:hover {
  background: rgba(212, 175, 55, 0.1);
}

.filter-checkbox input[type="checkbox"] {
  width: 16px;
  height: 16px;
  accent-color: var(--gold-primary);
  cursor: pointer;
}

.checkbox-icon {
  font-size: var(--text-sm);
}

.checkbox-label {
  font-size: var(--text-sm);
  color: var(--text-secondary);
}

.filter-checkbox:hover .checkbox-label {
  color: var(--text-primary);
}

.filter-checkbox.select-all {
  font-weight: var(--font-medium);
}

.filter-checkbox.select-all .checkbox-label {
  color: var(--text-primary);
}

.filter-divider {
  height: 1px;
  background: rgba(212, 175, 55, 0.15);
  margin: var(--space-xs) 0;
}

/* Active Filter Tags */
.active-filter-tags {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--space-sm);
  padding-top: var(--space-md);
  border-top: 1px solid rgba(212, 175, 55, 0.1);
}

.filter-tag {
  display: inline-flex;
  align-items: center;
  gap: var(--space-xs);
  padding: var(--space-xs) var(--space-sm);
  background: rgba(212, 175, 55, 0.15);
  border: 1px solid rgba(212, 175, 55, 0.3);
  border-radius: var(--radius-full);
  font-size: var(--text-xs);
  color: var(--gold-light);
}

.tag-remove {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  margin-left: 2px;
  padding: 0;
  background: rgba(255, 255, 255, 0.1);
  border: none;
  border-radius: 50%;
  color: var(--text-secondary);
  font-size: 12px;
  cursor: pointer;
  transition: all var(--transition-fast);
}

.tag-remove:hover {
  background: rgba(255, 100, 100, 0.3);
  color: #ff6b6b;
}

.clear-all-btn {
  padding: var(--space-xs) var(--space-sm);
  background: transparent;
  border: 1px solid rgba(255, 100, 100, 0.3);
  border-radius: var(--radius-full);
  color: #ff6b6b;
  font-size: var(--text-xs);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.clear-all-btn:hover {
  background: rgba(255, 100, 100, 0.2);
  border-color: rgba(255, 100, 100, 0.5);
}

.calendar-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 1px;
  background: rgba(212, 175, 55, 0.1);
  border-radius: var(--radius-lg);
  overflow: hidden;
}

.calendar-grid.view-week {
  grid-template-columns: repeat(7, 1fr);
}

.calendar-grid.view-day {
  grid-template-columns: 1fr;
  gap: 0;
}

.calendar-day.day-view {
  min-height: auto;
  max-width: 100%;
  padding: 0;
  background: transparent;
  border: none;
  cursor: default;
}

.calendar-day.day-view:hover {
  transform: none;
  background: transparent;
}

.calendar-grid.view-day .calendar-day {
  background: transparent;
  border: none;
}

.day-view-header {
  padding: var(--space-2xl);
  background: rgba(0, 0, 0, 0.3);
  border-bottom: 2px solid rgba(212, 175, 55, 0.2);
  margin-bottom: var(--space-xl);
}

.day-view-title {
  font-family: var(--font-heading);
  font-size: var(--text-3xl);
  color: var(--text-primary);
  margin: 0 0 var(--space-xl) 0;
  text-align: center;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-md);
  flex-wrap: wrap;
}

.post-count {
  font-size: var(--text-lg);
  color: var(--text-secondary);
  font-weight: var(--font-normal);
}

.day-view-actions {
  display: flex;
  gap: var(--space-lg);
  justify-content: center;
}

.action-button {
  display: flex;
  align-items: center;
  gap: var(--space-md);
  padding: var(--space-md) var(--space-2xl);
  border-radius: var(--radius-md);
  border: 1px solid;
  font-family: var(--font-body);
  font-size: var(--text-base);
  font-weight: var(--font-semibold);
  cursor: pointer;
  transition: var(--transition-base);
  letter-spacing: 0.02em;
}

.create-btn {
  background: rgba(212, 175, 55, 0.1);
  border-color: rgba(212, 175, 55, 0.4);
  color: var(--gold-primary);
}

.create-btn:hover {
  background: var(--gradient-gold);
  border-color: transparent;
  color: var(--text-on-gold);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(212, 175, 55, 0.3);
}

.favorite-btn {
  background: rgba(100, 150, 255, 0.1);
  border-color: rgba(100, 150, 255, 0.4);
  color: rgba(150, 180, 255, 1);
}

.favorite-btn:hover {
  background: rgba(100, 150, 255, 0.2);
  border-color: rgba(100, 150, 255, 0.6);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(100, 150, 255, 0.3);
}

.btn-icon {
  font-size: var(--text-xl);
  line-height: 1;
}

.btn-text {
  line-height: 1;
}

.day-view-posts {
  display: flex;
  flex-direction: column;
  gap: var(--space-lg);
  padding: var(--space-xl);
}

.day-view-pagination {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-lg);
  padding: var(--space-xl);
  border-top: 1px solid rgba(212, 175, 55, 0.2);
}

.pagination-btn {
  padding: var(--space-sm) var(--space-lg);
  background: rgba(212, 175, 55, 0.15);
  border: 1px solid rgba(212, 175, 55, 0.3);
  border-radius: var(--radius-md);
  color: var(--gold-primary);
  font-family: var(--font-body);
  font-size: var(--text-sm);
  font-weight: var(--font-semibold);
  cursor: pointer;
  transition: all 0.2s ease;
}

.pagination-btn:hover:not(:disabled) {
  background: rgba(212, 175, 55, 0.25);
  border-color: var(--gold-primary);
  transform: translateY(-1px);
}

.pagination-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.pagination-info {
  color: var(--text-secondary);
  font-size: var(--text-sm);
  font-weight: var(--font-medium);
}

.day-post-card {
  display: grid;
  grid-template-columns: 140px 100px 1fr;
  gap: var(--space-lg);
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(212, 175, 55, 0.2);
  border-radius: var(--radius-lg);
  padding: var(--space-lg);
  cursor: pointer;
  transition: var(--transition-base);
  border-left-width: 4px;
}

.day-post-card:hover {
  background: rgba(0, 0, 0, 0.4);
  border-color: rgba(212, 175, 55, 0.5);
  transform: translateX(4px);
  box-shadow: 0 4px 12px rgba(212, 175, 55, 0.2);
}

/* Status-based border colors for day post cards */
.day-post-card.status-scheduled {
  border-left-color: #3b82f6;
}

.day-post-card.status-published {
  border-left-color: #22c55e;
}

.day-post-card.status-failed {
  border-left-color: #ef4444;
}

.post-card-thumbnail {
  width: 140px;
  height: 140px;
  border-radius: var(--radius-md);
  overflow: hidden;
  background: rgba(0, 0, 0, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid rgba(212, 175, 55, 0.2);
}

.post-thumb-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.post-thumb-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.6);
}

.thumb-icon {
  font-size: 3rem;
  opacity: 0.3;
}

.post-card-time {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--space-xs);
}

.time-large {
  font-family: var(--font-heading);
  font-size: var(--text-2xl);
  font-weight: var(--font-bold);
  color: var(--gold-primary);
  text-align: center;
  line-height: 1.2;
}

.time-zone {
  font-size: var(--text-xs);
  color: var(--text-muted);
  text-transform: uppercase;
}

.post-card-content {
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
  min-width: 0;
}

.post-card-header {
  display: flex;
  align-items: center;
  gap: var(--space-md);
  flex-wrap: wrap;
}

.post-card-platform {
  padding: 0.375rem 0.875rem;
  border-radius: var(--radius-md);
  font-size: var(--text-xs);
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.post-card-platform.platform-instagram {
  background: rgba(225, 48, 108, 0.2);
  color: #e1306c;
  border: 1px solid rgba(225, 48, 108, 0.4);
}

.post-card-platform.platform-facebook {
  background: rgba(66, 103, 178, 0.2);
  color: #4267b2;
  border: 1px solid rgba(66, 103, 178, 0.4);
}

.post-card-platform.platform-tiktok {
  background: rgba(105, 105, 105, 0.2);
  color: #696969;
  border: 1px solid rgba(105, 105, 105, 0.4);
}

.post-card-type {
  padding: 0.375rem 0.875rem;
  background: rgba(0, 0, 0, 0.4);
  border: 1px solid rgba(212, 175, 55, 0.3);
  border-radius: var(--radius-md);
  font-size: var(--text-xs);
  color: var(--text-secondary);
  font-weight: 600;
  text-transform: capitalize;
}

.post-card-status {
  padding: 0.375rem 0.875rem;
  border-radius: var(--radius-md);
  font-size: var(--text-xs);
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.post-card-status.status-scheduled {
  background: rgba(59, 130, 246, 0.2);
  color: #3b82f6;
  border: 1px solid rgba(59, 130, 246, 0.4);
}

.post-card-status.status-published {
  background: rgba(34, 197, 94, 0.2);
  color: #22c55e;
  border: 1px solid rgba(34, 197, 94, 0.4);
}

.post-card-status.status-failed {
  background: rgba(239, 68, 68, 0.2);
  color: #ef4444;
  border: 1px solid rgba(239, 68, 68, 0.4);
}

.post-card-text {
  color: var(--text-secondary);
  line-height: 1.6;
  margin: 0;
  font-size: var(--text-base);
}

.post-card-restaurant {
  font-size: var(--text-sm);
  color: var(--text-muted);
  font-weight: 500;
}

.post-card-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-md);
  padding-top: var(--space-sm);
  border-top: 1px solid rgba(212, 175, 55, 0.1);
}

.post-card-timing {
  font-size: var(--text-sm);
  color: var(--gold-light);
  font-weight: 600;
}

.post-time-mini {
  font-size: 0.65rem;
  margin-left: 0.25rem;
  opacity: 0.8;
}

.view-post-link {
  display: inline-flex;
  align-items: center;
  gap: var(--space-xs);
  padding: var(--space-xs) var(--space-md);
  background: rgba(212, 175, 55, 0.1);
  border: 1px solid var(--gold-primary);
  border-radius: var(--radius-md);
  color: var(--gold-primary);
  font-size: var(--text-sm);
  font-weight: 600;
  text-decoration: none;
  transition: var(--transition-base);
}

.view-post-link:hover {
  background: rgba(212, 175, 55, 0.2);
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(212, 175, 55, 0.3);
}

.day-view-holidays {
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
  padding: var(--space-xl);
  background: rgba(100, 150, 255, 0.05);
  border-top: 2px solid rgba(100, 150, 255, 0.3);
  border-bottom: 2px solid rgba(100, 150, 255, 0.3);
  margin-bottom: var(--space-xl);
}

.day-holiday-card {
  display: flex;
  gap: var(--space-lg);
  align-items: flex-start;
  background: rgba(100, 150, 255, 0.1);
  border: 1px solid rgba(100, 150, 255, 0.3);
  border-radius: var(--radius-md);
  padding: var(--space-lg);
}

.holiday-card-icon {
  font-size: var(--text-3xl);
  line-height: 1;
}

.holiday-card-info {
  flex: 1;
}

.holiday-card-name {
  font-family: var(--font-heading);
  font-size: var(--text-xl);
  color: var(--text-primary);
  margin: 0 0 var(--space-sm) 0;
}

.holiday-card-desc {
  font-size: var(--text-sm);
  color: var(--text-secondary);
  line-height: 1.5;
  margin: 0;
}

.calendar-day-header {
  background: rgba(0, 0, 0, 0.4);
  padding: 1rem;
  text-align: center;
  font-weight: 600;
  color: var(--gold-primary);
  font-size: 0.875rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.calendar-day {
  background: rgba(0, 0, 0, 0.3);
  min-height: 120px;
  padding: 0.75rem;
  cursor: pointer;
  transition: all 0.2s ease;
  position: relative;
  display: flex;
  flex-direction: column;
}

.calendar-day:hover {
  background: rgba(212, 175, 55, 0.1);
  transform: translateY(-2px);
}

.calendar-day:hover .day-actions {
  opacity: 1;
  pointer-events: all;
}

.calendar-day.other-month {
  opacity: 0.5;
}

/* Past dates - clearly disabled */
.calendar-day.past-date {
  opacity: 0.3;
  cursor: not-allowed;
  background: rgba(0, 0, 0, 0.5);
  border-color: rgba(50, 50, 50, 0.3);
}

.calendar-day.past-date:hover {
  transform: none;
  border-color: rgba(50, 50, 50, 0.3);
  background: rgba(0, 0, 0, 0.5);
}

.calendar-day.past-date .day-number {
  color: rgba(100, 100, 100, 0.8);
  text-decoration: line-through;
  text-decoration-color: rgba(100, 100, 100, 0.5);
}

/* Future dates - clearly selectable */
.calendar-day.future-date {
  background: rgba(212, 175, 55, 0.08);
  border-color: rgba(212, 175, 55, 0.25);
  cursor: pointer;
}

.calendar-day.future-date:hover {
  background: rgba(212, 175, 55, 0.18);
  border-color: rgba(212, 175, 55, 0.5);
  transform: translateY(-2px);
}

.calendar-day.future-date .day-number {
  color: var(--gold-light);
  font-weight: var(--font-semibold);
}

.calendar-day.today {
  background: rgba(212, 175, 55, 0.15);
  border: 2px solid var(--gold-primary);
}

.calendar-day.has-posts {
  background: rgba(212, 175, 55, 0.08);
}

.day-number {
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 0.5rem;
}

.day-actions {
  display: flex;
  gap: 0.25rem;
  margin-bottom: 0.5rem;
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.2s ease;
}

.action-btn {
  flex: 1;
  padding: 0.375rem;
  background: rgba(0, 0, 0, 0.6);
  border: 1px solid rgba(212, 175, 55, 0.3);
  border-radius: 4px;
  cursor: pointer;
  font-size: 1rem;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.action-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(212, 175, 55, 0.3);
}

.new-post-btn {
  border-color: var(--gold-primary);
  background: rgba(212, 175, 55, 0.2);
}

.new-post-btn:hover {
  background: rgba(212, 175, 55, 0.3);
  border-color: var(--gold-light);
}

.pick-favorite-btn {
  border-color: rgba(212, 175, 55, 0.4);
}

.pick-favorite-btn:hover {
  background: rgba(212, 175, 55, 0.15);
  border-color: var(--gold-primary);
}

.day-holidays {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  margin-bottom: 0.5rem;
}

.holiday-indicator {
  padding: 0.25rem 0.5rem;
  background: rgba(100, 150, 255, 0.15);
  border-left: 3px solid rgba(100, 150, 255, 0.6);
  border-radius: 4px;
  font-size: 0.7rem;
  color: var(--text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  line-height: 1.2;
}

.more-holidays {
  font-size: 0.7rem;
  color: rgba(100, 150, 255, 0.8);
  font-weight: 600;
  font-style: italic;
  margin-top: 0.125rem;
}

.day-posts {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.post-indicator {
  padding: 0.25rem 0.5rem;
  background: rgba(212, 175, 55, 0.2);
  border-radius: 4px;
  font-size: 0.75rem;
  color: var(--text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.post-indicator.platform-instagram {
  background: rgba(225, 48, 108, 0.2);
  border-left: 3px solid #e1306c;
}

.post-indicator.platform-facebook {
  background: rgba(66, 103, 178, 0.2);
  border-left: 3px solid #4267b2;
}

.post-indicator.platform-tiktok {
  background: rgba(105, 105, 105, 0.2);
  border-left: 3px solid #696969;
}

.post-indicator.platform-twitter {
  background: rgba(29, 161, 242, 0.2);
  border-left: 3px solid #1da1f2;
}

/* Status-based coloring for post indicators (overrides platform colors) */
.post-indicator.status-scheduled {
  background: rgba(59, 130, 246, 0.2);
  border-left: 3px solid #3b82f6;
}

.post-indicator.status-published {
  background: rgba(34, 197, 94, 0.2);
  border-left: 3px solid #22c55e;
}

.post-indicator.status-failed {
  background: rgba(239, 68, 68, 0.2);
  border-left: 3px solid #ef4444;
}

.more-posts {
  font-size: 0.75rem;
  color: var(--gold-primary);
  font-weight: 600;
}

.day-detail-card {
  padding: 2rem;
}

.detail-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  gap: var(--space-lg);
}

.detail-title {
  font-family: var(--font-heading);
  font-size: 1.5rem;
  color: var(--gold-primary);
  margin: 0;
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.detail-pagination {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-lg);
  padding: var(--space-xl);
  margin-top: var(--space-xl);
  border-top: 1px solid rgba(212, 175, 55, 0.2);
}

.post-count {
  font-size: 1rem;
  color: var(--text-secondary);
  font-weight: normal;
}

/* New Redesigned Post Cards */
.scheduled-post-card-new {
  display: flex;
  background: rgba(0, 0, 0, 0.4);
  border-radius: var(--radius-lg);
  overflow: hidden;
  cursor: pointer;
  transition: all 0.3s ease;
  border: 1px solid rgba(212, 175, 55, 0.15);
  margin-bottom: var(--space-lg);
  position: relative;
}

.scheduled-post-card-new:hover {
  background: rgba(0, 0, 0, 0.5);
  border-color: rgba(212, 175, 55, 0.4);
  transform: translateX(4px);
  box-shadow: 0 8px 24px rgba(212, 175, 55, 0.15);
}

/* Status Indicator Bar on Left Edge */
.status-bar {
  width: 6px;
  min-height: 100%;
  flex-shrink: 0;
}

.status-bar.status-scheduled {
  background: linear-gradient(180deg, #3b82f6, #2563eb);
}

.status-bar.status-published {
  background: linear-gradient(180deg, #22c55e, #16a34a);
}

.status-bar.status-failed {
  background: linear-gradient(180deg, #ef4444, #dc2626);
}

.status-bar.status-pending {
  background: linear-gradient(180deg, #f59e0b, #d97706);
}

/* Main Card Content Layout */
.card-content {
  display: flex;
  width: 100%;
  gap: var(--space-xl);
  padding: var(--space-lg);
}

/* Media Section (Left Side) */
.media-section {
  position: relative;
  flex-shrink: 0;
  width: 180px;
  height: 180px;
  border-radius: var(--radius-md);
  overflow: hidden;
  background: rgba(0, 0, 0, 0.6);
  border: 1px solid rgba(212, 175, 55, 0.2);
}

.post-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s ease;
}

.scheduled-post-card-new:hover .post-image {
  transform: scale(1.05);
}

.media-badge {
  position: absolute;
  top: var(--space-sm);
  right: var(--space-sm);
  background: rgba(0, 0, 0, 0.8);
  backdrop-filter: blur(8px);
  padding: var(--space-xs) var(--space-sm);
  border-radius: var(--radius-sm);
  font-size: var(--text-lg);
  border: 1px solid rgba(212, 175, 55, 0.3);
}

/* Content Section (Right Side) */
.content-section {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
  min-width: 0;
}

/* Content Header (Time + Badges) */
.content-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: var(--space-md);
  flex-wrap: wrap;
}

.time-badge {
  display: flex;
  align-items: center;
  gap: var(--space-xs);
  background: rgba(212, 175, 55, 0.15);
  padding: var(--space-xs) var(--space-md);
  border-radius: var(--radius-full);
  border: 1px solid rgba(212, 175, 55, 0.3);
}

.time-icon {
  font-size: var(--text-base);
}

.time-text {
  font-size: var(--text-sm);
  font-weight: var(--font-semibold);
  color: var(--gold-light);
}

/* Status Badges Container */
.status-badges {
  display: flex;
  gap: var(--space-sm);
  align-items: center;
  flex-wrap: wrap;
}

/* Platform Badges */
.platform-badge-new {
  display: inline-flex;
  align-items: center;
  gap: var(--space-xs);
  padding: var(--space-xs) var(--space-md);
  border-radius: var(--radius-full);
  font-size: var(--text-xs);
  font-weight: var(--font-semibold);
  text-transform: uppercase;
  letter-spacing: 0.03em;
  border: 1px solid;
}

.platform-badge-new.platform-instagram {
  background: rgba(225, 48, 108, 0.15);
  border-color: rgba(225, 48, 108, 0.4);
  color: #ff6b9d;
}

.platform-badge-new.platform-facebook {
  background: rgba(66, 103, 178, 0.15);
  border-color: rgba(66, 103, 178, 0.4);
  color: #6b9aec;
}

.platform-badge-new.platform-tiktok {
  background: rgba(105, 105, 105, 0.15);
  border-color: rgba(105, 105, 105, 0.4);
  color: #a8a8a8;
}

.platform-badge-new.platform-twitter {
  background: rgba(29, 161, 242, 0.15);
  border-color: rgba(29, 161, 242, 0.4);
  color: #5cb3ff;
}

/* Status Badges */
.status-badge-new {
  display: inline-flex;
  align-items: center;
  gap: var(--space-xs);
  padding: var(--space-xs) var(--space-md);
  border-radius: var(--radius-full);
  font-size: var(--text-xs);
  font-weight: var(--font-bold);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  border: 1px solid;
}

.status-badge-new.status-scheduled {
  background: rgba(59, 130, 246, 0.15);
  border-color: rgba(59, 130, 246, 0.4);
  color: #60a5fa;
}

.status-badge-new.status-published {
  background: rgba(34, 197, 94, 0.15);
  border-color: rgba(34, 197, 94, 0.4);
  color: #4ade80;
}

.status-badge-new.status-failed {
  background: rgba(239, 68, 68, 0.15);
  border-color: rgba(239, 68, 68, 0.4);
  color: #f87171;
}

.status-badge-new.status-pending {
  background: rgba(245, 158, 11, 0.15);
  border-color: rgba(245, 158, 11, 0.4);
  color: #fbbf24;
}

/* Post Content (Description) */
.post-content {
  flex: 1;
}

.post-description {
  font-size: var(--text-sm);
  color: var(--text-secondary);
  line-height: var(--leading-relaxed);
  margin: 0;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.post-description.empty {
  color: var(--text-muted);
  font-style: italic;
  opacity: 0.6;
}

/* Restaurant Badge */
.restaurant-badge {
  display: inline-flex;
  align-items: center;
  gap: var(--space-xs);
  padding: var(--space-xs) var(--space-sm);
  background: rgba(212, 175, 55, 0.1);
  border: 1px solid rgba(212, 175, 55, 0.25);
  border-radius: var(--radius-sm);
  font-size: var(--text-xs);
  color: var(--gold-light);
  margin-top: var(--space-xs);
  width: fit-content;
}

/* Content Footer (Countdown + Actions) */
.content-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: var(--space-md);
  padding-top: var(--space-sm);
  border-top: 1px solid rgba(212, 175, 55, 0.1);
}

.footer-info {
  flex: 1;
}

.countdown {
  font-size: var(--text-sm);
  font-weight: var(--font-medium);
  color: var(--gold-primary);
  display: flex;
  align-items: center;
  gap: var(--space-xs);
}

.countdown::before {
  content: '⏱️';
  font-size: var(--text-base);
}

/* Action Buttons */
.action-buttons {
  display: flex;
  gap: var(--space-sm);
}

.action-btn {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.5);
  border: 1px solid rgba(212, 175, 55, 0.3);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: var(--text-base);
  padding: 0;
}

.action-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}

.edit-btn:hover {
  background: rgba(59, 130, 246, 0.2);
  border-color: #3b82f6;
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
}

.delete-btn:hover {
  background: rgba(239, 68, 68, 0.2);
  border-color: #ef4444;
  box-shadow: 0 4px 12px rgba(239, 68, 68, 0.3);
}

.view-post-btn {
  display: inline-flex;
  align-items: center;
  gap: var(--space-sm);
  padding: var(--space-sm) var(--space-lg);
  background: rgba(212, 175, 55, 0.15);
  border: 1px solid var(--gold-primary);
  border-radius: var(--radius-md);
  color: var(--gold-primary);
  font-size: var(--text-sm);
  font-weight: 600;
  text-decoration: none;
  transition: var(--transition-base);
  cursor: pointer;
}

.view-post-btn:hover {
  background: rgba(212, 175, 55, 0.25);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(212, 175, 55, 0.4);
}

/* Error Banner */
.error-banner {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.3);
  border-radius: var(--radius-sm);
  padding: var(--space-sm) var(--space-md);
  margin-top: var(--space-sm);
}

.error-icon {
  font-size: var(--text-lg);
  flex-shrink: 0;
}

.error-text {
  font-size: var(--text-xs);
  color: #f87171;
  line-height: 1.4;
}

/* Responsive Design for Post Cards */
@media (max-width: 768px) {
  .card-content {
    flex-direction: column;
    gap: var(--space-md);
  }

  .media-section {
    width: 100%;
    height: 200px;
  }

  .content-header {
    flex-direction: column;
    align-items: flex-start;
  }

  .content-footer {
    flex-direction: column;
    align-items: flex-start;
  }

  .action-buttons {
    width: 100%;
    justify-content: flex-end;
  }
}

.section-subtitle {
  font-family: var(--font-heading);
  font-size: 1.125rem;
  color: var(--gold-primary);
  margin: 0 0 1rem 0;
  padding-top: 0.5rem;
  border-top: 1px solid rgba(212, 175, 55, 0.2);
}

.holidays-section {
  margin-bottom: 2rem;
}

.holidays-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.holiday-card {
  display: flex;
  gap: 1rem;
  background: rgba(100, 150, 255, 0.08);
  border: 1px solid rgba(100, 150, 255, 0.2);
  border-radius: var(--radius-md);
  padding: 1rem;
  transition: all 0.2s ease;
}

.holiday-card:hover {
  background: rgba(100, 150, 255, 0.12);
  border-color: rgba(100, 150, 255, 0.4);
}

.holiday-icon {
  font-size: 2rem;
  line-height: 1;
}

.holiday-details {
  flex: 1;
}

.holiday-name {
  font-family: var(--font-heading);
  font-size: 1.125rem;
  color: var(--text-primary);
  margin: 0 0 0.5rem 0;
}

.holiday-description {
  color: var(--text-secondary);
  font-size: 0.875rem;
  line-height: 1.5;
  margin: 0 0 0.5rem 0;
}

.holiday-meta {
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.holiday-religion,
.holiday-type {
  font-size: 0.75rem;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  text-transform: capitalize;
}

.holiday-religion {
  background: rgba(212, 175, 55, 0.15);
  color: var(--gold-primary);
  border: 1px solid rgba(212, 175, 55, 0.3);
}

.holiday-type {
  background: rgba(100, 150, 255, 0.15);
  color: rgba(150, 180, 255, 1);
  border: 1px solid rgba(100, 150, 255, 0.3);
}

.posts-list {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.scheduled-post-card {
  display: grid;
  grid-template-columns: 300px 1fr;
  gap: 1.5rem;
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(212, 175, 55, 0.2);
  border-radius: var(--radius-lg);
  padding: 1.5rem;
  transition: all 0.2s ease;
  border-left-width: 4px;
}

.scheduled-post-card:hover {
  border-color: rgba(212, 175, 55, 0.5);
  background: rgba(0, 0, 0, 0.4);
}

/* Status-based border colors for scheduled post cards */
.scheduled-post-card.status-scheduled {
  border-left-color: #3b82f6;
}

.scheduled-post-card.status-published {
  border-left-color: #22c55e;
}

.scheduled-post-card.status-failed {
  border-left-color: #ef4444;
}

.post-media {
  position: relative;
  cursor: pointer;
  overflow: hidden;
  border-radius: var(--radius-md);
}

.post-thumbnail {
  width: 100%;
  height: 250px;
  object-fit: cover;
  border-radius: var(--radius-md);
  transition: transform 0.3s ease;
  display: block;
}

.post-thumbnail-placeholder {
  width: 100%;
  height: 250px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.4);
  border: 2px dashed rgba(212, 175, 55, 0.3);
  border-radius: var(--radius-md);
  gap: var(--space-md);
}

.placeholder-icon {
  font-size: 3rem;
  opacity: 0.5;
}

.placeholder-text {
  color: var(--text-secondary);
  font-size: var(--text-sm);
  opacity: 0.7;
}

.post-thumbnail.clickable:hover {
  transform: scale(1.05);
}

.thumbnail-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.3s ease;
  border-radius: var(--radius-md);
}

.post-media:hover .thumbnail-overlay {
  opacity: 1;
}

.view-icon {
  color: var(--gold-primary);
  font-size: 0.875rem;
  font-weight: 600;
  text-align: center;
}

.post-details {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.post-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.time-info {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.post-time {
  font-size: 1.125rem;
  color: var(--gold-primary);
  font-weight: 700;
}

.post-timezone {
  font-size: 0.75rem;
  color: var(--text-muted);
  font-weight: 500;
}

.time-remaining {
  padding: 0.5rem 0.75rem;
  background: rgba(212, 175, 55, 0.1);
  border-left: 3px solid var(--gold-primary);
  border-radius: 4px;
  font-size: 0.875rem;
  color: var(--gold-light);
  font-weight: 600;
}

.post-platform {
  padding: 0.375rem 0.75rem;
  border-radius: 6px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
}

.post-platform.platform-instagram {
  background: rgba(225, 48, 108, 0.2);
  color: #e1306c;
}

.post-platform.platform-facebook {
  background: rgba(66, 103, 178, 0.2);
  color: #4267b2;
}

.post-text {
  color: var(--text-secondary);
  line-height: 1.6;
  margin: 0;
}

.post-restaurant {
  font-size: 0.875rem;
  color: var(--text-muted);
}

.post-meta {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.content-type-badge {
  padding: 0.25rem 0.75rem;
  background: rgba(0, 0, 0, 0.4);
  border: 1px solid rgba(212, 175, 55, 0.3);
  border-radius: 6px;
  font-size: 0.75rem;
  color: var(--text-secondary);
  font-weight: 500;
}

.status-badge {
  padding: 0.25rem 0.75rem;
  border-radius: 6px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
}

.status-badge.status-scheduled {
  background: rgba(59, 130, 246, 0.2);
  color: #3b82f6;
  border: 1px solid rgba(59, 130, 246, 0.3);
}

.status-badge.status-published {
  background: rgba(34, 197, 94, 0.2);
  color: #22c55e;
  border: 1px solid rgba(34, 197, 94, 0.3);
}

.status-badge.status-failed {
  background: rgba(239, 68, 68, 0.2);
  color: #ef4444;
  border: 1px solid rgba(239, 68, 68, 0.3);
}

.post-actions {
  display: flex;
  gap: 0.75rem;
  margin-top: 0.5rem;
}

/* Published Post Styles */
.published-badge-compact {
  padding: var(--space-xs) var(--space-md);
  background: rgba(34, 197, 94, 0.15);
  border: 1px solid rgba(34, 197, 94, 0.4);
  border-radius: var(--radius-md);
  font-size: var(--text-sm);
  font-weight: var(--font-semibold);
  color: #22c55e;
  white-space: nowrap;
}

.published-info {
  color: var(--gold-primary) !important;
  font-weight: var(--font-medium);
}

/* Old full-width published styles (keeping for modal if needed) */
.post-published {
  margin-top: var(--space-md);
  padding: var(--space-md);
  background: rgba(34, 197, 94, 0.1);
  border: 1px solid rgba(34, 197, 94, 0.3);
  border-radius: var(--radius-md);
}

.published-badge {
  font-size: var(--text-sm);
  font-weight: var(--font-semibold);
  color: #22c55e;
  margin-bottom: var(--space-sm);
}

.published-details {
  display: flex;
  flex-direction: column;
  gap: var(--space-xs);
}

.published-time,
.published-platform {
  font-size: var(--text-xs);
  color: var(--text-secondary);
}

.published-section {
  background: rgba(34, 197, 94, 0.1);
  border: 1px solid rgba(34, 197, 94, 0.3);
  border-radius: var(--radius-md);
  padding: var(--space-lg);
}

.published-badge-large {
  font-size: var(--text-lg);
  font-weight: var(--font-bold);
  color: #22c55e;
  margin-bottom: var(--space-md);
  display: flex;
  align-items: center;
  gap: var(--space-sm);
}

.published-details-large {
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
}

.published-info-item {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
}

.published-info-label {
  font-size: var(--text-sm);
  font-weight: var(--font-semibold);
  color: var(--text-primary);
  min-width: 100px;
}

.published-info-value {
  font-size: var(--text-sm);
  color: var(--text-secondary);
}

.view-post-buttons-container {
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
  margin-top: var(--space-lg);
}

.view-post-button-modal {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-sm);
  padding: var(--space-md) var(--space-xl);
  background: var(--gradient-gold);
  border: none;
  border-radius: var(--radius-md);
  color: var(--text-on-gold);
  font-size: var(--text-base);
  font-weight: var(--font-bold);
  text-decoration: none;
  transition: var(--transition-base);
  cursor: pointer;
  box-shadow: var(--glow-gold-sm);
  width: 100%;
}

/* For standalone button (not in container) */
.view-post-button-modal:not(.view-post-buttons-container .view-post-button-modal) {
  margin-top: var(--space-lg);
}

.view-post-button-modal:hover {
  transform: translateY(-2px);
  box-shadow: var(--glow-gold-md);
}

.view-post-icon {
  font-size: var(--text-lg);
}

.external-icon {
  font-size: var(--text-sm);
  opacity: 0.8;
}

.empty-detail-card {
  padding: var(--space-2xl) var(--space-xl);
}

.empty-content {
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-md);
}

.empty-date {
  font-family: var(--font-heading);
  font-size: var(--text-xl);
  color: var(--gold-primary);
  margin: 0;
}

.empty-title {
  font-family: var(--font-heading);
  font-size: var(--text-lg);
  color: var(--text-primary);
  margin: 0;
}

.empty-subtitle {
  font-size: var(--text-sm);
  color: var(--text-secondary);
  margin: 0 0 var(--space-sm) 0;
}

.empty-content h3 {
  font-family: var(--font-heading);
  font-size: 1.5rem;
  color: var(--text-primary);
  margin: 0;
}

.empty-content p {
  color: var(--text-secondary);
  margin: 0;
}

/* Responsive */
@media (max-width: 1024px) {
  .calendar-day {
    min-height: 100px;
  }

  .scheduled-post-card {
    grid-template-columns: 250px 1fr;
  }
}

@media (max-width: 768px) {
  .title {
    font-size: 2rem;
  }

  .calendar-grid {
    gap: 0;
  }

  .schedule-settings {
    grid-template-columns: 1fr;
  }

  .scheduled-post-card {
    grid-template-columns: 1fr;
  }

  .post-thumbnail {
    height: 200px;
  }

  .time-info {
    flex-direction: row;
    align-items: center;
    gap: 0.5rem;
  }

  .post-timezone::before {
    content: '(';
  }

  .post-timezone::after {
    content: ')';
  }

  .calendar-day {
    min-height: 80px;
    padding: 0.5rem;
  }

  .day-number {
    font-size: 1rem;
  }

  .calendar-day-header {
    padding: 0.75rem 0.5rem;
    font-size: 0.75rem;
  }

  .scheduled-post-card {
    grid-template-columns: 1fr;
    gap: 1rem;
  }

  .post-thumbnail,
  .post-thumbnail-placeholder {
    height: 200px;
  }

  /* Day View Mobile */
  .day-view-header {
    padding: var(--space-lg);
  }

  .day-view-title {
    font-size: var(--text-2xl);
  }

  .day-view-actions {
    flex-direction: column;
    gap: var(--space-md);
  }

  .action-button {
    width: 100%;
    justify-content: center;
  }

  .day-view-posts,
  .day-view-holidays {
    padding: var(--space-lg);
  }

  .day-post-card {
    grid-template-columns: 1fr;
    gap: var(--space-md);
  }

  .post-card-thumbnail {
    width: 100%;
    height: 200px;
  }

  .post-card-time {
    flex-direction: row;
    justify-content: space-between;
    padding-bottom: var(--space-sm);
    border-bottom: 1px solid rgba(212, 175, 55, 0.2);
  }

  .time-large {
    font-size: var(--text-xl);
  }

  .view-mode-selector {
    flex-direction: row;
  }

  .view-mode-btn {
    flex: 1;
    padding: var(--space-sm) var(--space-md);
    font-size: var(--text-sm);
  }
}

/* Post Detail Modal */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.95);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: var(--space-xl);
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.modal-content {
  background: var(--bg-secondary);
  border: 1px solid rgba(212, 175, 55, 0.3);
  border-radius: var(--radius-xl);
  max-width: 1200px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
  position: relative;
  animation: slideUp 0.3s ease;
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.modal-close {
  position: absolute;
  top: var(--space-lg);
  right: var(--space-lg);
  background: rgba(0, 0, 0, 0.6);
  border: 1px solid rgba(212, 175, 55, 0.3);
  color: var(--text-primary);
  font-size: 2rem;
  width: 48px;
  height: 48px;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  z-index: 10;
  line-height: 1;
  padding: 0;
}

.modal-close:hover {
  background: var(--gold-primary);
  border-color: var(--gold-primary);
  color: var(--bg-primary);
  transform: rotate(90deg);
}

.modal-body {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-3xl);
  padding: var(--space-3xl);
}

.modal-media {
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.4);
  border-radius: var(--radius-lg);
  overflow: hidden;
}

.modal-image,
.modal-video {
  max-width: 100%;
  max-height: 70vh;
  width: auto;
  height: auto;
  object-fit: contain;
  border-radius: var(--radius-lg);
}

.modal-no-media {
  width: 100%;
  height: 400px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--space-lg);
  background: rgba(0, 0, 0, 0.4);
  border: 2px dashed rgba(212, 175, 55, 0.3);
  border-radius: var(--radius-lg);
}

.modal-no-media .placeholder-icon {
  font-size: 4rem;
  opacity: 0.5;
}

.modal-no-media .placeholder-text {
  color: var(--text-secondary);
  font-size: var(--text-lg);
  opacity: 0.7;
}

.modal-info {
  display: flex;
  flex-direction: column;
  gap: var(--space-xl);
}

.modal-title {
  font-family: var(--font-heading);
  font-size: var(--text-3xl);
  color: var(--gold-primary);
  margin: 0;
  padding-bottom: var(--space-lg);
  border-bottom: 2px solid rgba(212, 175, 55, 0.2);
}

.info-section {
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
}

.info-label {
  font-size: var(--text-sm);
  font-weight: 600;
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.info-value {
  font-size: var(--text-lg);
  color: var(--text-primary);
  line-height: 1.6;
}

.time-display {
  display: flex;
  align-items: center;
  gap: var(--space-md);
  font-size: var(--text-2xl);
  font-weight: 700;
  color: var(--gold-primary);
}

.timezone-badge {
  font-size: var(--text-sm);
  font-weight: 500;
  color: var(--text-secondary);
  background: rgba(0, 0, 0, 0.4);
  padding: 0.25rem 0.75rem;
  border-radius: var(--radius-md);
  border: 1px solid rgba(212, 175, 55, 0.2);
}

.time-remaining-large {
  padding: var(--space-md) var(--space-lg);
  background: rgba(212, 175, 55, 0.15);
  border-left: 4px solid var(--gold-primary);
  border-radius: var(--radius-md);
  font-size: var(--text-base);
  color: var(--gold-light);
  font-weight: 600;
  margin-top: var(--space-sm);
}

.badges-row {
  display: flex;
  gap: var(--space-md);
  flex-wrap: wrap;
}

.platform-badge-large {
  padding: var(--space-sm) var(--space-lg);
  border-radius: var(--radius-md);
  font-size: var(--text-sm);
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.platform-badge-large.platform-instagram {
  background: rgba(225, 48, 108, 0.2);
  color: #e1306c;
  border: 1px solid rgba(225, 48, 108, 0.4);
}

.platform-badge-large.platform-facebook {
  background: rgba(66, 103, 178, 0.2);
  color: #4267b2;
  border: 1px solid rgba(66, 103, 178, 0.4);
}

.content-type-badge-large {
  padding: var(--space-sm) var(--space-lg);
  background: rgba(0, 0, 0, 0.4);
  border: 1px solid rgba(212, 175, 55, 0.3);
  border-radius: var(--radius-md);
  font-size: var(--text-sm);
  color: var(--text-primary);
  font-weight: 600;
}

.status-badge-large {
  padding: var(--space-sm) var(--space-lg);
  border-radius: var(--radius-md);
  font-size: var(--text-sm);
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.status-badge-large.status-scheduled {
  background: rgba(59, 130, 246, 0.2);
  color: #3b82f6;
  border: 1px solid rgba(59, 130, 246, 0.4);
}

.status-badge-large.status-published {
  background: rgba(34, 197, 94, 0.2);
  color: #22c55e;
  border: 1px solid rgba(34, 197, 94, 0.4);
}

.status-badge-large.status-failed {
  background: rgba(239, 68, 68, 0.2);
  color: #ef4444;
  border: 1px solid rgba(239, 68, 68, 0.4);
}

.post-caption {
  white-space: pre-wrap;
  line-height: 1.8;
  padding: var(--space-lg);
  background: rgba(0, 0, 0, 0.3);
  border-radius: var(--radius-md);
  border-left: 3px solid var(--gold-primary);
}

.modal-actions {
  display: flex;
  gap: var(--space-md);
  padding-top: var(--space-lg);
  border-top: 1px solid rgba(212, 175, 55, 0.2);
  margin-top: auto;
}

/* Responsive Modal */
@media (max-width: 1024px) {
  .modal-body {
    grid-template-columns: 1fr;
    gap: var(--space-2xl);
  }

  .modal-media {
    max-height: 50vh;
  }
}

@media (max-width: 768px) {
  .modal-overlay {
    padding: var(--space-md);
  }

  .modal-body {
    padding: var(--space-2xl) var(--space-lg);
  }

  .modal-title {
    font-size: var(--text-2xl);
  }

  .time-display {
    flex-direction: column;
    align-items: flex-start;
    gap: var(--space-sm);
  }

  .modal-actions {
    flex-direction: column;
  }
}

/* Error Message Styles */
.post-error {
  display: flex;
  gap: var(--space-md);
  padding: var(--space-md);
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.3);
  border-left: 3px solid #ef4444;
  border-radius: var(--radius-md);
  margin-top: var(--space-md);
}

.post-card-error {
  padding: var(--space-sm) var(--space-md);
  background: rgba(239, 68, 68, 0.15);
  border: 1px solid rgba(239, 68, 68, 0.3);
  border-radius: var(--radius-sm);
  font-size: var(--text-xs);
  color: #ef4444;
  margin-top: var(--space-sm);
  line-height: var(--leading-normal);
}

.error-icon {
  font-size: var(--text-2xl);
  flex-shrink: 0;
}

.error-content {
  flex: 1;
}

.error-title {
  font-weight: var(--font-semibold);
  color: #ef4444;
  font-size: var(--text-sm);
  margin-bottom: var(--space-xs);
}

.error-message {
  color: var(--text-secondary);
  font-size: var(--text-sm);
  line-height: var(--leading-normal);
}

/* Error Section in Modal */
.error-section {
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.3);
  border-left: 3px solid #ef4444;
  border-radius: var(--radius-md);
  padding: var(--space-lg);
}

.error-label {
  color: #ef4444 !important;
  font-weight: var(--font-semibold);
}

.error-text {
  color: var(--text-secondary);
  background: rgba(0, 0, 0, 0.3);
  padding: var(--space-md);
  border-radius: var(--radius-sm);
  font-family: var(--font-body);
  line-height: var(--leading-normal);
}

/* Create Post Wizard Modal */
.wizard-modal {
  max-width: 600px;
  width: 100%;
  animation: slideUp 0.3s ease-out;
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.wizard-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--space-2xl);
  padding-bottom: var(--space-lg);
  border-bottom: 1px solid rgba(212, 175, 55, 0.2);
}

.wizard-title {
  font-family: var(--font-heading);
  font-size: var(--text-2xl);
  color: var(--text-primary);
  margin: 0;
}

.wizard-close-btn {
  width: 36px;
  height: 36px;
  background: none;
  border: none;
  color: var(--text-secondary);
  font-size: 2rem;
  cursor: pointer;
  border-radius: var(--radius-sm);
  transition: var(--transition-base);
  display: flex;
  align-items: center;
  justify-content: center;
  line-height: 1;
}

.wizard-close-btn:hover {
  background: rgba(212, 175, 55, 0.1);
  color: var(--gold-primary);
  transform: rotate(90deg);
}

.wizard-body {
  padding: var(--space-lg) 0;
}

.wizard-subtitle {
  font-size: var(--text-lg);
  color: var(--text-secondary);
  text-align: center;
  margin: 0 0 var(--space-2xl) 0;
}

.creation-options {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-xl);
}

.creation-option-card {
  background: rgba(0, 0, 0, 0.3);
  border: 2px solid rgba(212, 175, 55, 0.2);
  border-radius: var(--radius-lg);
  padding: var(--space-2xl);
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: var(--space-md);
}

.creation-option-card:hover {
  background: rgba(212, 175, 55, 0.1);
  border-color: var(--gold-primary);
  transform: translateY(-4px);
  box-shadow: var(--glow-gold-md);
}

.option-icon {
  font-size: 3rem;
  margin-bottom: var(--space-sm);
}

.option-icon-logo {
  width: 80px;
  height: 80px;
  margin-bottom: var(--space-sm);
  display: flex;
  align-items: center;
  justify-content: center;
}

.chef-logo-icon {
  width: 100%;
  height: 100%;
  object-fit: contain;
  filter: drop-shadow(0 0 8px rgba(212, 175, 55, 0.3));
  transition: all 0.3s ease;
}

.creation-option-card:hover .chef-logo-icon {
  filter: drop-shadow(0 0 16px rgba(212, 175, 55, 0.6));
  transform: scale(1.05);
}

.option-title {
  font-family: var(--font-heading);
  font-size: var(--text-xl);
  color: var(--text-primary);
  margin: 0;
  font-weight: var(--font-semibold);
}

.option-description {
  color: var(--text-secondary);
  font-size: var(--text-sm);
  line-height: var(--leading-normal);
  margin: 0;
}

/* Upcoming Posts Section */
.upcoming-posts-card {
  padding: var(--space-lg);
  margin-bottom: var(--space-lg);
}

.upcoming-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--space-md);
  padding-bottom: var(--space-sm);
  border-bottom: 1px solid rgba(212, 175, 55, 0.15);
}

.upcoming-title {
  font-family: var(--font-heading);
  font-size: var(--text-lg);
  color: var(--text-primary);
  margin: 0;
}

.upcoming-count {
  font-size: var(--text-sm);
  color: var(--text-secondary);
  background: rgba(212, 175, 55, 0.1);
  padding: var(--space-xs) var(--space-sm);
  border-radius: var(--radius-full);
}

.upcoming-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
}

.upcoming-item {
  display: grid;
  grid-template-columns: 90px 48px 1fr auto;
  gap: var(--space-md);
  align-items: center;
  padding: var(--space-sm) var(--space-md);
  background: rgba(0, 0, 0, 0.2);
  border: 1px solid rgba(212, 175, 55, 0.1);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: var(--transition-base);
}

.upcoming-item:hover {
  background: rgba(0, 0, 0, 0.3);
  border-color: rgba(212, 175, 55, 0.3);
  transform: translateX(4px);
}

.upcoming-date-badge {
  display: flex;
  flex-direction: column;
  align-items: center;
  min-width: 80px;
}

.upcoming-date {
  font-size: var(--text-sm);
  font-weight: var(--font-semibold);
  color: var(--gold-primary);
}

.upcoming-time {
  font-size: var(--text-xs);
  color: var(--text-secondary);
}

.upcoming-thumb {
  width: 48px;
  height: 48px;
  border-radius: var(--radius-sm);
  overflow: hidden;
  background: rgba(0, 0, 0, 0.3);
  flex-shrink: 0;
}

.upcoming-thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.upcoming-thumb-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: var(--text-lg);
  background: rgba(212, 175, 55, 0.1);
}

.upcoming-content {
  min-width: 0;
  flex: 1;
}

.upcoming-text {
  font-size: var(--text-sm);
  color: var(--text-primary);
  margin: 0 0 var(--space-xs) 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.upcoming-meta {
  display: flex;
  gap: var(--space-md);
  font-size: var(--text-xs);
}

.upcoming-platform {
  color: var(--text-secondary);
  text-transform: capitalize;
}

.upcoming-platform.platform-facebook { color: #4267B2; }
.upcoming-platform.platform-instagram { color: #E1306C; }
.upcoming-platform.platform-tiktok { color: #00f2ea; }

.upcoming-restaurant {
  color: var(--text-muted);
}

.upcoming-actions {
  display: flex;
  gap: var(--space-xs);
  opacity: 0;
  transition: opacity 0.2s ease;
}

.upcoming-item:hover .upcoming-actions {
  opacity: 1;
}

.upcoming-action-btn {
  width: 28px;
  height: 28px;
  border: none;
  background: rgba(212, 175, 55, 0.15);
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: var(--transition-base);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: var(--text-sm);
}

.upcoming-action-btn:hover {
  background: rgba(212, 175, 55, 0.3);
  transform: scale(1.1);
}

.upcoming-action-btn.delete:hover {
  background: rgba(239, 68, 68, 0.3);
}

/* Responsive */
@media (max-width: 768px) {
  .creation-options {
    grid-template-columns: 1fr;
  }

  .wizard-modal {
    max-width: 95%;
  }

  .upcoming-item {
    grid-template-columns: 70px 40px 1fr;
  }

  .upcoming-actions {
    display: none;
  }
}
</style>
