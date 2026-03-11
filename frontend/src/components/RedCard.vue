<script setup lang="ts">
defineProps<{
  title?: string
  description?: string
  icon?: string
  hoverable?: boolean
}>()

defineEmits<{
  click: [event: MouseEvent]
}>()
</script>

<template>
  <div
    class="red-card"
    :class="{ 'red-card--hoverable': hoverable }"
    @click="$emit('click', $event)"
  >
    <div v-if="icon" class="red-card__icon">
      <component :is="icon" />
    </div>
    <div v-else-if="$slots.icon" class="red-card__icon">
      <slot name="icon" />
    </div>
    
    <div class="red-card__content">
      <h3 v-if="title" class="red-card__title">{{ title }}</h3>
      <p v-if="description" class="red-card__description">{{ description }}</p>
      <slot />
    </div>
    
    <div v-if="$slots.footer" class="red-card__footer">
      <slot name="footer" />
    </div>
  </div>
</template>

<style scoped>
.red-card {
  background: var(--color-bg-secondary);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 24px;
  transition: all 300ms ease;
}

.red-card--hoverable {
  cursor: pointer;
}

.red-card--hoverable:hover {
  border-color: rgba(255, 255, 255, 0.2);
  background: var(--color-bg-tertiary);
  transform: translateY(-2px);
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
}

.red-card__icon {
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(239, 35, 60, 0.1);
  border-radius: 10px;
  margin-bottom: 16px;
  color: var(--color-primary);
  font-size: 24px;
}

.red-card__content {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.red-card__title {
  font-family: var(--font-heading);
  font-size: 18px;
  font-weight: 600;
  color: var(--color-text-primary);
  margin: 0;
}

.red-card__description {
  font-size: 14px;
  line-height: 1.6;
  color: var(--color-text-muted);
  margin: 0;
}

.red-card__footer {
  margin-top: 20px;
  padding-top: 16px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}
</style>