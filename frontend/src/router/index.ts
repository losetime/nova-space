import { createRouter, createWebHistory } from 'vue-router'
import MainLayout from '@/layouts/MainLayout.vue'
import { useUserStore } from '@/stores/user'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      component: MainLayout,
      children: [
        {
          path: '',
          name: 'home',
          component: () => import('@/views/HomeView.vue'),
        },
        {
          path: 'satellite',
          name: 'satellite',
          component: () => import('@/views/SatelliteView.vue'),
        },
        {
          path: 'education',
          name: 'education',
          component: () => import('@/views/EducationView.vue'),
        },
        {
          path: 'education/:id',
          name: 'article-detail',
          component: () => import('@/views/ArticleDetailView.vue'),
        },
        {
          path: 'intelligence',
          name: 'intelligence',
          component: () => import('@/views/IntelligenceView.vue'),
        },
        {
          path: 'intelligence/:id',
          name: 'intelligence-detail',
          component: () => import('@/views/IntelligenceDetailView.vue'),
        },
        {
          path: 'profile',
          name: 'profile',
          component: () => import('@/views/ProfileView.vue'),
          meta: { requiresAuth: true },
        },
      ],
    },
    {
      path: '/login',
      name: 'login',
      component: () => import('@/views/AuthView.vue'),
      meta: { guestOnly: true },
    },
    {
      path: '/register',
      name: 'register',
      component: () => import('@/views/AuthView.vue'),
      meta: { guestOnly: true },
    },
  ],
})

// 路由守卫
router.beforeEach(async (to, _from, next) => {
  const userStore = useUserStore()

  // 如果有 Token 但没有用户信息，尝试获取
  if (userStore.token && !userStore.user) {
    await userStore.fetchUser()
  }

  // 需要登录的页面
  if (to.meta.requiresAuth && !userStore.isLoggedIn) {
    next({ name: 'login', query: { redirect: to.fullPath } })
    return
  }

  // 已登录用户访问登录/注册页面
  if (to.meta.guestOnly && userStore.isLoggedIn) {
    next({ name: 'home' })
    return
  }

  next()
})

export default router