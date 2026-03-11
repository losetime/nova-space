<template>
  <a-config-provider :theme="darkTheme">
    <router-view />
  </a-config-provider>
</template>

<script setup lang="ts">
import { theme } from 'ant-design-vue'

// Red Noir Theme for Ant Design
const darkTheme = {
  algorithm: theme.darkAlgorithm,
  token: {
    colorPrimary: '#ef233c',
    colorBgContainer: '#18181b',
    colorBgElevated: '#27272a',
    colorBorder: 'rgba(255, 255, 255, 0.1)',
    colorText: 'rgba(255, 255, 255, 0.95)',
    colorTextSecondary: 'rgba(255, 255, 255, 0.7)',
    colorTextTertiary: 'rgba(255, 255, 255, 0.5)',
    colorBgLayout: '#000000',
    borderRadius: 8,
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  },
  components: {
    Button: {
      primaryColor: '#ef233c',
      primaryColorHover: '#d90429',
      primaryShadow: '0 0 20px rgba(239, 35, 60, 0.4)',
    },
    Input: {
      colorBgContainer: 'rgba(255, 255, 255, 0.05)',
      colorBorder: 'rgba(255, 255, 255, 0.1)',
      colorBorderHover: 'rgba(255, 255, 255, 0.2)',
      colorPrimaryBorderHover: '#ef233c',
    },
    Select: {
      colorBgContainer: 'rgba(255, 255, 255, 0.05)',
      colorBorder: 'rgba(255, 255, 255, 0.1)',
    },
    Table: {
      colorBgContainer: 'transparent',
      headerBg: 'rgba(239, 35, 60, 0.1)',
      headerColor: 'rgba(255, 255, 255, 0.9)',
      rowHoverBg: 'rgba(239, 35, 60, 0.05)',
      borderColor: 'rgba(255, 255, 255, 0.06)',
    },
    Tabs: {
      colorText: 'rgba(255, 255, 255, 0.6)',
      colorTextActive: '#ef233c',
      inkBarColor: '#ef233c',
    },
    Modal: {
      contentBg: '#18181b',
      headerBg: '#18181b',
    },
    Dropdown: {
      colorBgElevated: 'rgba(24, 24, 27, 0.98)',
    },
    Menu: {
      colorBgElevated: 'transparent',
      colorItemText: 'rgba(255, 255, 255, 0.7)',
      colorItemTextHover: '#ef233c',
      colorItemBgHover: 'rgba(239, 35, 60, 0.1)',
      colorItemTextSelected: '#ef233c',
    },
    Form: {
      labelColor: 'rgba(255, 255, 255, 0.8)',
    },
    Tag: {
      defaultBg: 'rgba(255, 255, 255, 0.1)',
      defaultColor: 'rgba(255, 255, 255, 0.85)',
    },
    Card: {
      colorBgContainer: '#18181b',
      colorBorderSecondary: 'rgba(255, 255, 255, 0.1)',
    },
  },
}
</script>

<style>
/* Global styles are in src/assets/base.css */
</style>