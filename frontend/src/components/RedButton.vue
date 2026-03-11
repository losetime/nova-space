<script setup lang="ts">
defineProps<{
  variant?: 'primary' | 'secondary' | 'shiny' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  disabled?: boolean
  loading?: boolean
}>()

defineEmits<{
  click: [event: MouseEvent]
}>()
</script>

<template>
  <button
    class="red-btn"
    :class="[
      `red-btn--${variant || 'primary'}`,
      `red-btn--${size || 'md'}`,
      { 'red-btn--loading': loading }
    ]"
    :disabled="disabled || loading"
    @click="$emit('click', $event)"
  >
    <span v-if="loading" class="red-btn__spinner"></span>
    <span class="red-btn__content" :class="{ 'red-btn__content--hidden': loading }">
      <slot />
    </span>
  </button>
</template>

<style scoped>
.red-btn {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-family: var(--font-body);
  font-weight: 600;
  border-radius: 8px;
  cursor: pointer;
  transition: all 150ms ease;
  border: none;
  outline: none;
}

.red-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Sizes */
.red-btn--sm {
  padding: 8px 16px;
  font-size: 13px;
}

.red-btn--md {
  padding: 12px 24px;
  font-size: 14px;
}

.red-btn--lg {
  padding: 16px 32px;
  font-size: 16px;
}

/* Primary */
.red-btn--primary {
  background: var(--color-primary);
  color: white;
}

.red-btn--primary:hover:not(:disabled) {
  background: #d90429;
  box-shadow: 0 0 20px rgba(239, 35, 60, 0.4);
}

.red-btn--primary:active:not(:disabled) {
  transform: scale(0.98);
}

/* Secondary */
.red-btn--secondary {
  background: transparent;
  color: var(--color-text-primary);
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.red-btn--secondary:hover:not(:disabled) {
  border-color: rgba(255, 255, 255, 0.4);
  background: rgba(255, 255, 255, 0.05);
}

/* Ghost */
.red-btn--ghost {
  background: transparent;
  color: var(--color-text-muted);
}

.red-btn--ghost:hover:not(:disabled) {
  color: var(--color-text-primary);
  background: rgba(255, 255, 255, 0.05);
}

/* Shiny */
.red-btn--shiny {
  background: transparent;
  color: var(--color-text-primary);
  border: none;
  overflow: hidden;
  isolation: isolate;
}

/* 旋转边框层 - 最底层 */
.red-btn--shiny::before {
  content: '';
  position: absolute;
  inset: -2px;
  /* 更丝滑的渐变：使用多段渐变实现柔和过渡 */
  background: conic-gradient(
    from 0deg,
    transparent 0deg,
    transparent 60deg,
    var(--color-primary) 90deg,
    var(--color-primary) 100deg,
    transparent 130deg,
    transparent 180deg,
    transparent 240deg,
    var(--color-primary) 270deg,
    var(--color-primary) 280deg,
    transparent 310deg,
    transparent 360deg
  );
  border-radius: 10px; /* 比 button 的 8px 稍大，匹配 inset: -2px */
  animation: border-spin 3s linear infinite;
  z-index: -2;
  /* GPU 加速优化 */
  will-change: transform;
  backface-visibility: hidden;
  transform: translateZ(0);
}

/* 背景层 - 中间层 */
.red-btn--shiny::after {
  content: '';
  position: absolute;
  inset: 2px;
  background: var(--color-bg-tertiary);
  border-radius: 6px; /* 比 button 的 8px 稍小，匹配 inset: 2px */
  z-index: -1;
  transition: background 200ms ease, box-shadow 300ms ease;
}

.red-btn--shiny:hover:not(:disabled)::after {
  background: var(--color-bg-elevated);
  box-shadow: inset 0 0 20px rgba(239, 35, 60, 0.1);
}

/* hover 时加速旋转 - 使用动画过渡而非直接改变 duration */
.red-btn--shiny:hover:not(:disabled)::before {
  animation: border-spin-fast 1.5s linear infinite;
  filter: brightness(1.2);
}

/* 平滑的动画过渡 */
.red-btn--shiny::before {
  transition: filter 300ms ease;
}

@keyframes border-spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

@keyframes border-spin-fast {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

/* Loading */
.red-btn--loading {
  pointer-events: none;
}

.red-btn__spinner {
  position: absolute;
  width: 18px;
  height: 18px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.red-btn__content {
  display: flex;
  align-items: center;
  gap: 8px;
}

.red-btn__content--hidden {
  visibility: hidden;
}
</style>