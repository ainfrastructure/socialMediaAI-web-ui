<script setup lang="ts">
import { ref } from 'vue'
import BaseCard from './BaseCard.vue'
import BaseButton from './BaseButton.vue'
import BaseInput from './BaseInput.vue'
import BaseAlert from './BaseAlert.vue'
import { useAuthStore } from '@/stores/auth'

const code = ref('ory_ac_wLBTbrBjYfvp7hd-hTEndLirnYSYlRwilwNTfZh_JnM.ujRLXxUxbcP41JYq4oKxN9VXhQnw-CzURiZvBQPtlF4')
const state = ref('7f3a911afd07213a5cc65008837b48adebc499f38815cd3c3af32b4eb679e996')
const loading = ref(false)
const success = ref('')
const error = ref('')

const exchangeCode = async () => {
  loading.value = true
  success.value = ''
  error.value = ''

  try {
    const authStore = useAuthStore()
    const userId = authStore.user?.id

    if (!userId) {
      throw new Error('Not authenticated. Please log in first.')
    }

    const response = await fetch('http://localhost:3000/api/wolt/manual-exchange', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        code: code.value,
        state: state.value,
        userId: userId
      })
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.message || 'Failed to exchange code')
    }

    success.value = `Successfully connected! Venue ID: ${data.connection.venueId}`
    console.log('✅ Connection data:', data)

  } catch (err: any) {
    error.value = err.message
    console.error('❌ Exchange failed:', err)
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <BaseCard variant="glass-intense" class="manual-connect">
    <h2 class="card-title">Manual Wolt Connection</h2>
    <p class="card-description">
      Use this to manually exchange your Wolt authorization code for tokens.
    </p>

    <BaseAlert v-if="success" type="success">
      {{ success }}
    </BaseAlert>

    <BaseAlert v-if="error" type="error" @close="error = ''">
      {{ error }}
    </BaseAlert>

    <div class="form">
      <BaseInput
        v-model="code"
        label="Authorization Code"
        placeholder="Enter the code from Wolt callback URL"
        hint="The 'code' parameter from the callback URL"
      />

      <BaseInput
        v-model="state"
        label="State (optional)"
        placeholder="Enter the state from Wolt callback URL"
        hint="The 'state' parameter from the callback URL"
      />

      <BaseButton
        variant="primary"
        size="large"
        full-width
        :disabled="loading || !code"
        @click="exchangeCode"
      >
        {{ loading ? 'Connecting...' : 'Connect to Wolt' }}
      </BaseButton>
    </div>
  </BaseCard>
</template>

<style scoped>
.manual-connect {
  animation: fadeInUp 0.6s var(--ease-smooth);
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

.card-title {
  font-family: var(--font-heading);
  font-size: var(--text-2xl);
  font-weight: var(--font-semibold);
  color: var(--text-primary);
  margin: 0 0 var(--space-md) 0;
}

.card-description {
  font-size: var(--text-sm);
  color: var(--text-secondary);
  line-height: var(--leading-normal);
  margin: 0 0 var(--space-2xl) 0;
}

.form {
  display: flex;
  flex-direction: column;
  gap: var(--space-lg);
}
</style>
