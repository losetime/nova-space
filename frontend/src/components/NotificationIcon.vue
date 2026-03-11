<template>
  <div class="notification-icon" @click="togglePanel">
    <span class="bell-icon">🔔</span>
    <span v-if="unreadCount > 0" class="unread-badge">{{ unreadCount > 99 ? '99+' : unreadCount }}</span>
    
    <Teleport to="body">
      <div v-if="showPanel" class="notification-panel">
        <div class="panel-header">
          <h3>通知</h3>
          <button v-if="notifications.length > 0" class="mark-all-btn" @click="markAllRead">
            全部已读
          </button>
        </div>
        
        <div class="panel-content">
          <div v-if="loading" class="loading-state">
            加载中...
          </div>
          
          <div v-else-if="notifications.length === 0" class="empty-state">
            暂无通知
          </div>
          
          <div v-else class="notification-list">
            <div
              v-for="notification in notifications"
              :key="notification.id"
              :class="['notification-item', { unread: !notification.isRead }]"
              @click="handleClick(notification)"
            >
              <div class="notification-type">
                {{ getTypeIcon(notification.type) }}
              </div>
              <div class="notification-content">
                <div class="notification-title">{{ notification.title }}</div>
                <div class="notification-text">{{ notification.content }}</div>
                <div class="notification-time">{{ formatTime(notification.createdAt) }}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import api from '@/api'

interface Notification {
  id: string
  type: 'intelligence' | 'system' | 'achievement'
  title: string
  content: string
  isRead: boolean
  relatedId?: string
  createdAt: string
}

const showPanel = ref(false)
const loading = ref(false)
const notifications = ref<Notification[]>([])
const unreadCount = ref(0)

const getTypeIcon = (type: string) => {
  const icons: Record<string, string> = {
    intelligence: '📡',
    system: '⚙️',
    achievement: '🏆',
  }
  return icons[type] || '📢'
}

const formatTime = (dateStr: string) => {
  if (!dateStr) return ''
  
  const date = new Date(dateStr)
  if (isNaN(date.getTime())) return ''
  
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  
  if (diff < 0) return '刚刚'
  
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)
  
  if (minutes < 1) return '刚刚'
  if (minutes < 60) return `${minutes}分钟前`
  if (hours < 24) return `${hours}小时前`
  if (days < 7) return `${days}天前`
  return date.toLocaleDateString()
}

const fetchNotifications = async () => {
  loading.value = true
  try {
    const res = await api.get('/notifications')
    notifications.value = res.data.data?.list || []
  } catch (error) {
    console.error('获取通知失败:', error)
  } finally {
    loading.value = false
  }
}

const fetchUnreadCount = async () => {
  try {
    const res = await api.get('/notifications/unread-count')
    unreadCount.value = res.data.data?.count || 0
  } catch (error) {
    console.error('获取未读数量失败:', error)
  }
}

const togglePanel = () => {
  showPanel.value = !showPanel.value
  if (showPanel.value) {
    fetchNotifications()
  }
}

const handleClick = async (notification: Notification) => {
  if (!notification.isRead) {
    try {
      await api.put(`/notifications/${notification.id}/read`)
      notification.isRead = true
      unreadCount.value = Math.max(0, unreadCount.value - 1)
    } catch (error) {
      console.error('标记已读失败:', error)
    }
  }
  
  // 如果有关联ID，可以跳转到对应页面
  if (notification.relatedId && notification.type === 'intelligence') {
    window.location.href = `/intelligence/${notification.relatedId}`
  }
  
  showPanel.value = false
}

const markAllRead = async () => {
  try {
    await api.put('/notifications/read-all')
    notifications.value.forEach(n => n.isRead = true)
    unreadCount.value = 0
  } catch (error) {
    console.error('全部已读失败:', error)
  }
}

const handleClickOutside = (e: MouseEvent) => {
  const target = e.target as HTMLElement
  if (!target.closest('.notification-icon') && !target.closest('.notification-panel')) {
    showPanel.value = false
  }
}

onMounted(() => {
  fetchUnreadCount()
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>

<style scoped>
.notification-icon {
  position: relative;
  cursor: pointer;
  padding: 8px;
}

.bell-icon {
  font-size: 20px;
}

.unread-badge {
  position: absolute;
  top: 2px;
  right: 2px;
  min-width: 18px;
  height: 18px;
  background: #ef233c;
  border-radius: 9px;
  font-size: 11px;
  font-weight: 600;
  color: #ffffff;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 4px;
}

.notification-panel {
  position: fixed;
  top: 60px;
  right: 20px;
  width: 360px;
  max-height: 480px;
  background: #18181b;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.5);
  z-index: 1000;
  overflow: hidden;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.panel-header h3 {
  font-family: 'Manrope', sans-serif;
  font-size: 16px;
  font-weight: 600;
  color: #ffffff;
  margin: 0;
}

.mark-all-btn {
  background: none;
  border: none;
  color: #ef233c;
  font-size: 13px;
  cursor: pointer;
}

.mark-all-btn:hover {
  text-decoration: underline;
}

.panel-content {
  max-height: 400px;
  overflow-y: auto;
}

.loading-state,
.empty-state {
  padding: 40px 20px;
  text-align: center;
  color: #a1a1aa;
  font-size: 14px;
}

.notification-list {
  padding: 8px 0;
}

.notification-item {
  display: flex;
  gap: 12px;
  padding: 12px 20px;
  cursor: pointer;
  transition: background 0.2s ease;
}

.notification-item:hover {
  background: rgba(255, 255, 255, 0.05);
}

.notification-item.unread {
  background: rgba(239, 35, 60, 0.05);
}

.notification-type {
  font-size: 20px;
  flex-shrink: 0;
}

.notification-content {
  flex: 1;
  min-width: 0;
}

.notification-title {
  font-size: 14px;
  font-weight: 500;
  color: #ffffff;
  margin-bottom: 4px;
}

.notification-text {
  font-size: 13px;
  color: #a1a1aa;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.notification-time {
  font-size: 12px;
  color: #71717a;
  margin-top: 4px;
}

@media (max-width: 640px) {
  .notification-panel {
    width: calc(100vw - 40px);
    right: 20px;
    left: 20px;
  }
}
</style>