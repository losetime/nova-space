<template>
  <div class="feedback-view">
    <div class="feedback-container">
      <div class="feedback-header">
        <h1>意见反馈</h1>
        <p>您的建议是我们前进的动力</p>
      </div>

      <form @submit.prevent="handleSubmit" class="feedback-form">
        <div class="form-group">
          <label>反馈类型</label>
          <div class="type-options">
            <button
              v-for="type in feedbackTypes"
              :key="type.value"
              type="button"
              :class="['type-btn', { active: form.type === type.value }]"
              @click="form.type = type.value"
            >
              <span class="type-icon">{{ type.icon }}</span>
              <span class="type-label">{{ type.label }}</span>
            </button>
          </div>
        </div>

        <div class="form-group">
          <label for="title">标题</label>
          <input
            id="title"
            v-model="form.title"
            type="text"
            placeholder="请简要描述您的问题或建议"
            maxlength="200"
            required
          />
        </div>

        <div class="form-group">
          <label for="content">详细内容</label>
          <textarea
            id="content"
            v-model="form.content"
            placeholder="请详细描述您遇到的问题或建议..."
            rows="6"
            required
          ></textarea>
        </div>

        <button type="submit" class="submit-btn" :disabled="submitting">
          {{ submitting ? '提交中...' : '提交反馈' }}
        </button>
      </form>

      <div v-if="submitted" class="success-message">
        <span class="success-icon">✓</span>
        <p>感谢您的反馈！我们会认真处理您的建议。</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import api from '@/api'

const feedbackTypes = [
  { value: 'bug', label: '问题反馈', icon: '🐛' },
  { value: 'feature', label: '功能建议', icon: '💡' },
  { value: 'suggestion', label: '改进建议', icon: '📝' },
  { value: 'other', label: '其他', icon: '💬' },
]

const form = reactive({
  type: 'suggestion',
  title: '',
  content: '',
})

const submitting = ref(false)
const submitted = ref(false)

const handleSubmit = async () => {
  if (submitting.value) return

  submitting.value = true
  try {
    await api.post('/feedback', form)
    submitted.value = true
    form.title = ''
    form.content = ''
    form.type = 'suggestion'

    setTimeout(() => {
      submitted.value = false
    }, 3000)
  } catch (error) {
    console.error('提交失败:', error)
    alert('提交失败，请稍后重试')
  } finally {
    submitting.value = false
  }
}
</script>

<style scoped lang="scss">
// 主题色
$primary: #00d4ff;
$primary-light: #7dd3fc;
$accent: #a855f7;

// 背景色
$bg-dark: #0a0a0f;
$bg-card: rgba(255, 255, 255, 0.03);
$bg-elevated: rgba(255, 255, 255, 0.06);

// 文字色
$text-primary: rgba(255, 255, 255, 0.95);
$text-secondary: rgba(255, 255, 255, 0.6);
$text-muted: rgba(255, 255, 255, 0.4);

.feedback-view {
  min-height: calc(100vh - 64px);
  background: $bg-dark;
  padding: 40px 20px;
}

.feedback-container {
  max-width: 600px;
  margin: 0 auto;
}

.feedback-header {
  text-align: center;
  margin-bottom: 40px;
}

.feedback-header h1 {
  font-size: 32px;
  font-weight: 700;
  color: $text-primary;
  margin-bottom: 8px;
}

.feedback-header p {
  color: $text-muted;
  font-size: 14px;
}

.feedback-form {
  background: $bg-card;
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 16px;
  padding: 32px;
  backdrop-filter: blur(20px);
}

.form-group {
  margin-bottom: 24px;
}

.form-group label {
  display: block;
  font-size: 14px;
  font-weight: 500;
  color: $text-secondary;
  margin-bottom: 8px;
}

.type-options {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
}

.type-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: 16px 8px;
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.type-btn:hover {
  border-color: rgba($primary, 0.3);
  background: rgba($primary, 0.05);
}

.type-btn.active {
  background: rgba($primary, 0.1);
  border-color: $primary;
}

.type-icon {
  font-size: 24px;
}

.type-label {
  font-size: 12px;
  color: $text-muted;
}

.type-btn.active .type-label {
  color: $primary;
}

input,
textarea {
  width: 100%;
  padding: 12px 16px;
  background: rgba(20, 20, 28, 1);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  color: $text-primary;
  font-size: 14px;
  transition: all 0.2s ease;
}

input:focus,
textarea:focus {
  outline: none;
  border-color: $primary;
  box-shadow: 0 0 0 2px rgba($primary, 0.1);
}

input::placeholder,
textarea::placeholder {
  color: $text-muted;
}

textarea {
  resize: vertical;
  min-height: 120px;
}

.submit-btn {
  width: 100%;
  padding: 14px;
  background: linear-gradient(135deg, $primary 0%, $accent 100%);
  border: none;
  border-radius: 8px;
  color: #fff;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.submit-btn:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba($primary, 0.3);
}

.submit-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.success-message {
  margin-top: 24px;
  padding: 16px;
  background: rgba(34, 197, 94, 0.1);
  border: 1px solid rgba(34, 197, 94, 0.3);
  border-radius: 8px;
  display: flex;
  align-items: center;
  gap: 12px;
}

.success-icon {
  width: 24px;
  height: 24px;
  background: #22c55e;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #ffffff;
  font-size: 14px;
}

.success-message p {
  color: #22c55e;
  font-size: 14px;
  margin: 0;
}

@media (max-width: 640px) {
  .type-options {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>