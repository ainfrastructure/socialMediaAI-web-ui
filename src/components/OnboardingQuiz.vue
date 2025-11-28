<script setup lang="ts">
import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import BaseButton from './BaseButton.vue'
import BaseAlert from './BaseAlert.vue'

const { t } = useI18n()

const emit = defineEmits<{
  (e: 'complete'): void
  (e: 'back'): void
}>()

interface QuizQuestion {
  question: string
  options: string[]
  correctAnswer: number
  explanation: string
}

const quizQuestions = computed<QuizQuestion[]>(() => [
  {
    question: t('onboarding.quiz.q1Question'),
    options: t('onboarding.quiz.q1Options') as unknown as string[],
    correctAnswer: 1,
    explanation: t('onboarding.quiz.q1Explanation')
  },
  {
    question: t('onboarding.quiz.q2Question'),
    options: t('onboarding.quiz.q2Options') as unknown as string[],
    correctAnswer: 2,
    explanation: t('onboarding.quiz.q2Explanation')
  },
  {
    question: t('onboarding.quiz.q3Question'),
    options: t('onboarding.quiz.q3Options') as unknown as string[],
    correctAnswer: 2,
    explanation: t('onboarding.quiz.q3Explanation')
  },
  {
    question: t('onboarding.quiz.q4Question'),
    options: t('onboarding.quiz.q4Options') as unknown as string[],
    correctAnswer: 2,
    explanation: t('onboarding.quiz.q4Explanation')
  }
])

const currentQuestion = ref(0)
const selectedAnswers = ref<(number | null)[]>(Array(quizQuestions.value.length).fill(null))
const showResult = ref(false)
const acceptedTerms = ref(false)
const showTermsError = ref(false)

const progress = computed(() => {
  return ((currentQuestion.value + 1) / quizQuestions.value.length) * 100
})

const isAnswerSelected = computed(() => {
  return selectedAnswers.value[currentQuestion.value] !== null
})

const isAnswerCorrect = computed(() => {
  const selected = selectedAnswers.value[currentQuestion.value]
  if (selected === null) return false
  return selected === quizQuestions.value[currentQuestion.value].correctAnswer
})

const canGoNext = computed(() => {
  // Can only proceed if answer is correct
  return isAnswerCorrect.value && currentQuestion.value < quizQuestions.value.length - 1
})

const canGoPrev = computed(() => currentQuestion.value > 0)

const isLastQuestion = computed(() => {
  return currentQuestion.value === quizQuestions.value.length - 1
})

const score = computed(() => {
  return selectedAnswers.value.filter((answer, index) => {
    return answer === quizQuestions.value[index].correctAnswer
  }).length
})

const scorePercentage = computed(() => {
  return (score.value / quizQuestions.value.length) * 100
})

const passedQuiz = computed(() => {
  return scorePercentage.value >= 75 // Need 75% to pass
})

function selectAnswer(index: number) {
  selectedAnswers.value[currentQuestion.value] = index
}

function nextQuestion() {
  if (canGoNext.value) {
    currentQuestion.value++
  } else if (isLastQuestion.value && isAnswerCorrect.value) {
    showResult.value = true
  }
}

function prevQuestion() {
  if (canGoPrev.value) {
    currentQuestion.value--
  }
}

function retakeQuiz() {
  currentQuestion.value = 0
  selectedAnswers.value = Array(quizQuestions.value.length).fill(null)
  showResult.value = false
  acceptedTerms.value = false
  showTermsError.value = false
}

function finishOnboarding() {
  if (!acceptedTerms.value) {
    showTermsError.value = true
    return
  }
  emit('complete')
}
</script>

<template>
  <div class="onboarding-quiz">
    <!-- Quiz Questions -->
    <div v-if="!showResult" class="quiz-container">
      <!-- Progress Bar -->
      <div class="progress-container">
        <div class="progress-bar">
          <div class="progress-fill" :style="{ width: `${progress}%` }"></div>
        </div>
        <p class="progress-text">Question {{ currentQuestion + 1 }} of {{ quizQuestions.length }}</p>
      </div>

      <!-- Question -->
      <div class="question-container">
        <h2 class="question-title">{{ quizQuestions[currentQuestion].question }}</h2>

        <div class="options-grid">
          <button
            v-for="(option, index) in quizQuestions[currentQuestion].options"
            :key="index"
            :class="[
              'option-button',
              { 'selected': selectedAnswers[currentQuestion] === index }
            ]"
            @click="selectAnswer(index)"
          >
            <span class="option-letter">{{ String.fromCharCode(65 + index) }}</span>
            <span class="option-text">{{ option }}</span>
          </button>
        </div>
      </div>

      <!-- Navigation -->
      <div class="quiz-navigation">
        <BaseButton
          v-if="canGoPrev"
          variant="ghost"
          @click="prevQuestion"
        >
          ← Previous
        </BaseButton>
        <BaseButton
          v-else
          variant="ghost"
          @click="$emit('back')"
        >
          ← Back to Tour
        </BaseButton>

        <div class="next-button-container">
          <BaseButton
            variant="primary"
            :disabled="!isAnswerCorrect"
            @click="nextQuestion"
          >
            {{ isLastQuestion ? 'View Results →' : 'Next Question →' }}
          </BaseButton>
          <p v-if="isAnswerSelected && !isAnswerCorrect" class="error-text">
            ❌ Incorrect answer. Please try again!
          </p>
          <p v-else-if="isAnswerCorrect" class="success-text">
            ✓ Correct! Click next to continue
          </p>
        </div>
      </div>
    </div>

    <!-- Quiz Results -->
    <div v-else class="results-container">
      <div class="results-icon">
        {{ passedQuiz ? '🎉' : '📚' }}
      </div>

      <h2 class="results-title">
        {{ passedQuiz ? 'Congratulations!' : 'Almost There!' }}
      </h2>

      <p class="results-description">
        {{ passedQuiz
          ? 'You\'ve demonstrated a great understanding of SocialChef!'
          : 'Let\'s review and try again to ensure you\'re ready.'
        }}
      </p>

      <div class="score-card">
        <div class="score-number">{{ score }} / {{ quizQuestions.length }}</div>
        <div class="score-percentage">{{ Math.round(scorePercentage) }}%</div>
      </div>

      <!-- Answer Review -->
      <div class="answer-review">
        <h3 class="review-title">Review Your Answers</h3>
        <div
          v-for="(question, index) in quizQuestions"
          :key="index"
          class="review-item"
        >
          <div class="review-header">
            <span class="review-question-number">Q{{ index + 1 }}</span>
            <span
              :class="[
                'review-badge',
                selectedAnswers[index] === question.correctAnswer ? 'correct' : 'incorrect'
              ]"
            >
              {{ selectedAnswers[index] === question.correctAnswer ? '✓ Correct' : '✗ Incorrect' }}
            </span>
          </div>
          <p class="review-question">{{ question.question }}</p>
          <p class="review-explanation">
            <strong>💡 </strong>{{ question.explanation }}
          </p>
        </div>
      </div>

      <!-- Terms and Conditions -->
      <div v-if="passedQuiz" class="terms-section">
        <h3 class="terms-title">Terms and Conditions</h3>

        <div class="terms-content">
          <h4 class="terms-heading">1. Acceptance of Terms</h4>
          <p>By using SocialChef, you agree to these terms and conditions. If you do not agree, please do not use our service.</p>

          <h4 class="terms-heading">2. Service Description</h4>
          <p>SocialChef provides AI-powered social media content generation and scheduling services for restaurants and food businesses.</p>

          <h4 class="terms-heading">3. User Responsibilities</h4>
          <ul class="terms-list">
            <li>You are responsible for maintaining the confidentiality of your account</li>
            <li>You agree to provide accurate restaurant and business information</li>
            <li>You will not use the service for illegal or unauthorized purposes</li>
            <li>You own the rights to any images you upload</li>
          </ul>

          <h4 class="terms-heading">4. Content Rights</h4>
          <p>Content generated through SocialChef belongs to you. We do not claim ownership of your generated content.</p>

          <h4 class="terms-heading">5. Privacy Policy</h4>
          <p>We respect your privacy and protect your data. We will not share your information with third parties without your consent.</p>

          <h4 class="terms-heading">6. Service Modifications</h4>
          <p>We reserve the right to modify or discontinue the service with reasonable notice.</p>

          <h4 class="terms-heading">7. Limitation of Liability</h4>
          <p>SocialChef is provided "as is" without warranties. We are not liable for any indirect or consequential damages.</p>
        </div>

        <label class="terms-checkbox">
          <input
            type="checkbox"
            v-model="acceptedTerms"
            @change="showTermsError = false"
          />
          <span class="checkbox-label">
            I have read and accept the Terms and Conditions and Privacy Policy
          </span>
        </label>

        <BaseAlert v-if="showTermsError" type="error">
          Please accept the Terms and Conditions to continue
        </BaseAlert>
      </div>

      <!-- Actions -->
      <div class="results-actions">
        <BaseButton
          v-if="!passedQuiz"
          variant="secondary"
          @click="retakeQuiz"
        >
          Retake Quiz
        </BaseButton>
        <BaseButton
          v-else
          variant="primary"
          size="large"
          full-width
          @click="finishOnboarding"
        >
          Complete Onboarding & Get Started!
        </BaseButton>
      </div>
    </div>
  </div>
</template>

<style scoped>
.onboarding-quiz {
  width: 100%;
  max-width: 800px;
  margin: 0 auto;
}

.quiz-container {
  display: flex;
  flex-direction: column;
  gap: var(--space-3xl);
}

.progress-container {
  text-align: center;
}

.progress-bar {
  width: 100%;
  height: 8px;
  background: var(--bg-elevated);
  border-radius: var(--radius-full);
  overflow: hidden;
  margin-bottom: var(--space-md);
}

.progress-fill {
  height: 100%;
  background: var(--gradient-gold);
  transition: width var(--transition-base);
  border-radius: var(--radius-full);
}

.progress-text {
  font-size: var(--text-sm);
  color: var(--text-muted);
  margin: 0;
}

.question-container {
  animation: fadeInUp 0.5s var(--ease-smooth);
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

.question-title {
  font-family: var(--font-heading);
  font-size: var(--text-2xl);
  color: var(--text-primary);
  margin-bottom: var(--space-3xl);
  text-align: center;
  line-height: var(--leading-relaxed);
}

.options-grid {
  display: grid;
  gap: var(--space-lg);
}

.option-button {
  display: flex;
  align-items: center;
  gap: var(--space-lg);
  padding: var(--space-xl);
  background: var(--glass-bg);
  border: 2px solid var(--border-color);
  border-radius: var(--radius-lg);
  backdrop-filter: blur(var(--blur-md));
  cursor: pointer;
  transition: var(--transition-base);
  text-align: left;
}

.option-button:hover {
  border-color: var(--gold-primary);
  transform: translateX(4px);
}

.option-button.selected {
  border-color: var(--gold-primary);
  background: var(--gold-subtle);
  box-shadow: var(--glow-gold-sm);
}

.option-letter {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  background: var(--bg-elevated);
  border-radius: var(--radius-md);
  font-family: var(--font-heading);
  font-size: var(--text-lg);
  font-weight: var(--font-bold);
  color: var(--gold-primary);
  flex-shrink: 0;
}

.option-button.selected .option-letter {
  background: var(--gradient-gold);
  color: var(--text-on-gold);
}

.option-text {
  font-size: var(--text-base);
  color: var(--text-secondary);
  line-height: var(--leading-normal);
}

.option-button.selected .option-text {
  color: var(--text-primary);
  font-weight: var(--font-medium);
}

.quiz-navigation {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: var(--space-lg);
  padding-top: var(--space-2xl);
  border-top: 1px solid var(--border-color);
}

.next-button-container {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: var(--space-sm);
}

.error-text {
  font-size: var(--text-sm);
  color: var(--error-text);
  margin: 0;
  font-weight: var(--font-semibold);
  animation: shake 0.5s ease-in-out;
}

.success-text {
  font-size: var(--text-sm);
  color: var(--success-text);
  margin: 0;
  font-weight: var(--font-semibold);
}

@keyframes shake {
  0%, 100% {
    transform: translateX(0);
  }
  25% {
    transform: translateX(-5px);
  }
  75% {
    transform: translateX(5px);
  }
}

/* Results Styles */
.results-container {
  display: flex;
  flex-direction: column;
  gap: var(--space-3xl);
  animation: fadeInUp 0.6s var(--ease-smooth);
}

.results-icon {
  font-size: 100px;
  text-align: center;
  animation: bounce 2s ease-in-out infinite;
}

@keyframes bounce {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-15px);
  }
}

.results-title {
  font-family: var(--font-heading);
  font-size: var(--text-4xl);
  color: var(--text-primary);
  text-align: center;
  background: var(--gradient-gold);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin: 0;
}

.results-description {
  font-size: var(--text-lg);
  color: var(--text-secondary);
  text-align: center;
  margin: 0;
}

.score-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-md);
  padding: var(--space-3xl);
  background: var(--glass-bg);
  border: 2px solid var(--gold-primary);
  border-radius: var(--radius-xl);
  backdrop-filter: blur(var(--blur-lg));
  box-shadow: var(--glow-gold-md);
}

.score-number {
  font-family: var(--font-heading);
  font-size: var(--text-5xl);
  font-weight: var(--font-bold);
  color: var(--gold-primary);
}

.score-percentage {
  font-size: var(--text-2xl);
  color: var(--text-secondary);
}

.answer-review {
  background: var(--bg-secondary);
  border-radius: var(--radius-lg);
  padding: var(--space-2xl);
  border: 1px solid var(--border-color);
}

.review-title {
  font-family: var(--font-heading);
  font-size: var(--text-xl);
  color: var(--text-primary);
  margin: 0 0 var(--space-xl) 0;
}

.review-item {
  padding: var(--space-xl);
  background: var(--glass-bg);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  margin-bottom: var(--space-lg);
}

.review-item:last-child {
  margin-bottom: 0;
}

.review-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--space-md);
}

.review-question-number {
  font-family: var(--font-heading);
  font-weight: var(--font-bold);
  color: var(--gold-primary);
}

.review-badge {
  padding: var(--space-xs) var(--space-md);
  border-radius: var(--radius-full);
  font-size: var(--text-sm);
  font-weight: var(--font-semibold);
}

.review-badge.correct {
  background: var(--success-bg);
  color: var(--success-text);
  border: 1px solid var(--success-border);
}

.review-badge.incorrect {
  background: var(--error-bg);
  color: var(--error-text);
  border: 1px solid var(--error-border);
}

.review-question {
  font-size: var(--text-base);
  color: var(--text-primary);
  margin: 0 0 var(--space-sm) 0;
  font-weight: var(--font-medium);
}

.review-explanation {
  font-size: var(--text-sm);
  color: var(--text-secondary);
  margin: 0;
  line-height: var(--leading-normal);
}

/* Terms Section */
.terms-section {
  background: var(--bg-secondary);
  border: 2px solid var(--border-color);
  border-radius: var(--radius-lg);
  padding: var(--space-3xl);
}

.terms-title {
  font-family: var(--font-heading);
  font-size: var(--text-2xl);
  color: var(--text-primary);
  margin: 0 0 var(--space-2xl) 0;
  text-align: center;
}

.terms-content {
  max-height: 400px;
  overflow-y: auto;
  padding: var(--space-xl);
  background: var(--glass-bg);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  margin-bottom: var(--space-2xl);
}

.terms-content::-webkit-scrollbar {
  width: 8px;
}

.terms-content::-webkit-scrollbar-track {
  background: var(--bg-elevated);
  border-radius: var(--radius-sm);
}

.terms-content::-webkit-scrollbar-thumb {
  background: var(--gold-primary);
  border-radius: var(--radius-sm);
}

.terms-heading {
  font-family: var(--font-heading);
  font-size: var(--text-lg);
  color: var(--text-primary);
  margin: var(--space-xl) 0 var(--space-md) 0;
}

.terms-heading:first-child {
  margin-top: 0;
}

.terms-content p {
  font-size: var(--text-sm);
  color: var(--text-secondary);
  line-height: var(--leading-relaxed);
  margin: 0 0 var(--space-md) 0;
}

.terms-list {
  margin: var(--space-md) 0;
  padding-left: var(--space-2xl);
}

.terms-list li {
  font-size: var(--text-sm);
  color: var(--text-secondary);
  line-height: var(--leading-relaxed);
  margin-bottom: var(--space-sm);
}

.terms-checkbox {
  display: flex;
  align-items: flex-start;
  gap: var(--space-md);
  cursor: pointer;
  padding: var(--space-lg);
  background: var(--glass-bg);
  border: 2px solid var(--border-color);
  border-radius: var(--radius-md);
  transition: var(--transition-base);
}

.terms-checkbox:hover {
  border-color: var(--gold-primary);
}

.terms-checkbox input[type="checkbox"] {
  width: 24px;
  height: 24px;
  cursor: pointer;
  flex-shrink: 0;
  margin-top: 2px;
  accent-color: var(--gold-primary);
}

.checkbox-label {
  font-size: var(--text-base);
  color: var(--text-primary);
  line-height: var(--leading-normal);
}

.results-actions {
  display: flex;
  justify-content: center;
  gap: var(--space-lg);
}

/* Mobile Responsive */
@media (max-width: 768px) {
  .question-title {
    font-size: var(--text-xl);
  }

  .option-letter {
    width: 32px;
    height: 32px;
    font-size: var(--text-base);
  }

  .option-text {
    font-size: var(--text-sm);
  }

  .quiz-navigation {
    flex-direction: column;
  }

  .results-icon {
    font-size: 70px;
  }

  .results-title {
    font-size: var(--text-3xl);
  }

  .score-number {
    font-size: var(--text-4xl);
  }
}
</style>
