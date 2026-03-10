import axios, { type AxiosInstance, type AxiosResponse } from 'axios'
import { useUserStore } from '@/stores/user'

// API 响应格式
export interface ApiResponse<T = unknown> {
  success: boolean
  data: T
  message?: string
}

// 用户信息
export interface User {
  id: number
  username: string
  email: string
  nickname?: string
  avatar?: string
  role: string
  level: string
  points: number
  createdAt: string
  updatedAt: string
}

// 登录响应
export interface LoginResponse {
  user: User
  accessToken: string
  refreshToken: string
}

// 积分统计
export interface PointsStats {
  currentPoints: number
  totalPoints: number
  totalEarned: number
  totalConsumed: number
  checkinDays: number
}

// 积分记录
export interface PointsRecord {
  id: string
  userId: string
  action: string
  points: number
  balance: number
  description: string
  createdAt: string
}

// 订阅信息
export interface Subscription {
  id: number
  plan: string
  status: string
  startDate: string
  endDate: string
  autoRenew: boolean
}

// 创建 API 实例
const api: AxiosInstance = axios.create({
  baseURL: '/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// 请求拦截器 - 添加 Token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  },
)

// 响应拦截器 - 处理错误和 Token 刷新
api.interceptors.response.use(
  (response: AxiosResponse) => {
    return response
  },
  async (error) => {
    const originalRequest = error.config

    // 如果是 401 错误且不是刷新 Token 的请求
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true

      try {
        const refreshToken = localStorage.getItem('refreshToken')
        if (refreshToken) {
          const response = await axios.post('/api/auth/refresh', {
            refreshToken,
          })

          const { accessToken, refreshToken: newRefreshToken } = response.data.data
          localStorage.setItem('accessToken', accessToken)
          localStorage.setItem('refreshToken', newRefreshToken)

          // 重试原请求
          originalRequest.headers.Authorization = `Bearer ${accessToken}`
          return api(originalRequest)
        }
      } catch {
        // 刷新失败，清除登录状态
        localStorage.removeItem('accessToken')
        localStorage.removeItem('refreshToken')
        const userStore = useUserStore()
        userStore.logout()
        window.location.href = '/login'
      }
    }

    return Promise.reject(error)
  },
)

// 认证 API
export const authApi = {
  register: (data: { username: string; email: string; password: string }) =>
    api.post<ApiResponse<LoginResponse>>('/auth/register', data),

  login: (data: { username: string; password: string }) =>
    api.post<ApiResponse<LoginResponse>>('/auth/login', data),

  profile: () => api.get<ApiResponse<User>>('/auth/profile'),

  refresh: (refreshToken: string) =>
    api.post<ApiResponse<{ accessToken: string; refreshToken: string }>>('/auth/refresh', {
      refreshToken,
    }),
}

// 用户 API
export const userApi = {
  getMe: () => api.get<ApiResponse<User>>('/users/me'),

  updateMe: (data: Partial<User>) => api.put<ApiResponse<User>>('/users/me', data),

  changePassword: (data: { oldPassword: string; newPassword: string }) =>
    api.put<ApiResponse<void>>('/users/me/password', data),
}

// 积分 API
export const pointsApi = {
  dailyCheckin: () => api.post<ApiResponse<{ points: number; message: string }>>('/points/daily-checkin'),

  getStats: () => api.get<ApiResponse<PointsStats>>('/points/stats'),

  getHistory: (params?: { page?: number; limit?: number }) =>
    api.get<ApiResponse<{ records: PointsRecord[]; total: number }>>('/points/history', { params }),
}

// 订阅 API
export const subscriptionApi = {
  getCurrent: () => api.get<ApiResponse<Subscription | null>>('/subscriptions/current'),

  create: (data: { plan: string }) => api.post<ApiResponse<Subscription>>('/subscriptions', data),

  cancel: () => api.put<ApiResponse<void>>('/subscriptions/cancel'),
}

// 科普文章
export interface Article {
  id: number
  title: string
  content: string
  summary: string
  cover: string
  category: 'basic' | 'advanced' | 'mission' | 'people'
  type: 'article' | 'video'
  views: number
  likes: number
  duration: number
  tags: string[]
  isPublished: boolean
  createdAt: string
  updatedAt: string
}

// 每日问答
export interface Quiz {
  id: number
  question: string
  options: string[]
  correctIndex: number
  explanation: string
  category: string
  points: number
}

// 答题结果
export interface QuizResult {
  isCorrect: boolean
  correctIndex: number
  explanation: string
  pointsEarned: number
}

// 答题统计
export interface QuizStats {
  totalAnswered: number
  correctCount: number
  totalPoints: number
  streak: number
}

// 科普 API
export const educationApi = {
  // 获取文章列表
  getArticles: (params?: { category?: string; page?: number; limit?: number }) =>
    api.get<ApiResponse<{ data: Article[]; total: number }>>('/education/articles', { params }),

  // 获取文章详情
  getArticle: (id: string | number) => api.get<ApiResponse<Article>>(`/education/articles/${id}`),

  // 获取每日问答
  getDailyQuiz: () => api.get<ApiResponse<Quiz>>('/education/quiz/daily'),

  // 提交答案
  submitAnswer: (data: { quizId: number; selectedIndex: number }) =>
    api.post<ApiResponse<QuizResult>>('/education/quiz/submit', data),

  // 获取答题统计
  getQuizStats: () => api.get<ApiResponse<QuizStats>>('/education/quiz/stats'),
}

// 情报
export interface Intelligence {
  id: number
  title: string
  summary: string
  content: string
  cover?: string
  category: 'launch' | 'satellite' | 'industry' | 'research' | 'environment'
  level: 'free' | 'advanced' | 'professional'
  views: number
  likes: number
  collects: number
  source: string
  sourceUrl?: string
  tags: string[]
  analysis?: string
  trend?: string
  publishedAt: string
  isLocked?: boolean
  isCollected?: boolean
}

// 卫星轨道点
export interface OrbitPoint {
  lng: number
  lat: number
  alt: number
}

// 卫星轨道数据
export interface SatelliteOrbit {
  noradId: string
  name: string
  orbitPoints: OrbitPoint[]
}

// 卫星 API
export const satelliteApi = {
  // 获取卫星轨道数据
  getOrbit: (noradId: string | number) =>
    api.get<ApiResponse<SatelliteOrbit>>(`/satellites/${noradId}/orbit`),
}

// 情报 API
export const intelligenceApi = {
  // 获取情报列表
  getList: (params?: { category?: string; page?: number; pageSize?: number }) =>
    api.get<ApiResponse<{ list: Intelligence[]; total: number; page: number; pageSize: number }>>('/intelligence', { params }),

  // 获取情报详情
  getDetail: (id: number) => api.get<ApiResponse<Intelligence>>(`/intelligence/${id}`),

  // 获取热门排行
  getHotList: () => api.get<ApiResponse<{ id: number; title: string; views: number }[]>>('/intelligence/hot'),

  // 收藏/取消收藏
  toggleCollect: (id: number) => api.post<ApiResponse<{ collected: boolean }>>(`/intelligence/${id}/collect`),

  // 获取用户收藏列表
  getUserCollects: () => api.get<ApiResponse<Intelligence[]>>('/intelligence/user/collects'),
}

export default api