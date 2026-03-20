<template>
  <span class="flag-icon-wrapper" :title="title || countryName">
    <span :class="flagClass" class="flag-icon"></span>
  </span>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { getFlagClass, getISOCode } from '@/utils/countryFlags'

interface Props {
  /** CelesTrak 国家代码 */
  code: string
  /** 国家名称 (用于title) */
  countryName?: string
  /** 自定义 title */
  title?: string
  /** 尺寸 */
  size?: 'small' | 'default' | 'large'
  /** 是否为圆形 */
  rounded?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  size: 'default',
  rounded: false,
})

const flagClass = computed(() => {
  const baseClass = getFlagClass(props.code)
  const classes = [baseClass]

  if (props.rounded) {
    classes.push('fi-rounded')
  }

  return classes.join(' ')
})
</script>

<style scoped>
.flag-icon-wrapper {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  line-height: 1;
}

.flag-icon {
  width: 1.2em;
  height: 0.9em;
  border-radius: 2px;
  box-shadow: 0 0 1px rgba(0, 0, 0, 0.3);
  background-size: cover;
  background-position: center;
  display: inline-block;
}

/* 不同尺寸 */
.flag-icon-wrapper.size-small .flag-icon {
  width: 1em;
  height: 0.75em;
}

.flag-icon-wrapper.size-large .flag-icon {
  width: 1.5em;
  height: 1.125em;
}

/* 圆角 */
.flag-icon.fi-rounded {
  border-radius: 50%;
  width: 1em;
  height: 1em;
}

/* 组织特殊样式 */
.organization-flags {
  display: inline-block;
  width: 1.2em;
  height: 0.9em;
  border-radius: 2px;
  background-size: contain;
  background-repeat: no-repeat;
  background-position: center;
}

/* 北约旗帜 - 使用emoji作为后备 */
.org-nato {
  background: linear-gradient(135deg, #003399 0%, #003399 100%);
  position: relative;
}

.org-nato::after {
  content: '⚓';
  position: absolute;
  font-size: 0.6em;
  color: white;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
}

/* Intelsat/国际组织 */
.org-intelsat {
  background: linear-gradient(135deg, #1a237e 0%, #3949ab 100%);
  position: relative;
}

.org-intelsat::after {
  content: '🛰';
  position: absolute;
  font-size: 0.5em;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
}

/* O3b */
.org-o3b {
  background: linear-gradient(135deg, #00bcd4 0%, #009688 100%);
  position: relative;
}

.org-o3b::after {
  content: '🌐';
  position: absolute;
  font-size: 0.5em;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
}

/* 待定 */
.org-tbd {
  background: linear-gradient(135deg, #9e9e9e 0%, #757575 100%);
  position: relative;
}

.org-tbd::after {
  content: '?';
  position: absolute;
  font-size: 0.6em;
  color: white;
  font-weight: bold;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
}
</style>