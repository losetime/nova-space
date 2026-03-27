import axios, { type AxiosInstance, type AxiosResponse } from 'axios'
import { useUserStore } from '@/stores/user'

// API 响应格式（与后端 TransformInterceptor 一致）
export interface ApiResponse<T = unknown> {
  code: number
  data: T
  message?: string
  timestamp?: string
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
    api.get<ApiResponse<{ list: Article[]; total: number }>>('/education/articles', { params }),

  // 获取文章详情
  getArticle: (id: string | number) => api.get<ApiResponse<Article>>(`/education/articles/${id}`),

  // 收藏/取消收藏文章
  toggleCollect: (id: string | number) =>
    api.post<ApiResponse<{ collected: boolean }>>(`/education/articles/${id}/collect`),

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
  timestamp?: string
  velocity?: {
    x: number
    y: number
    z: number
  }
}

// 卫星轨道数据
export interface SatelliteOrbit {
  noradId: string
  name: string
  startTime?: string
  duration?: number
  steps?: number
  orbitPoints: OrbitPoint[]
}

// 轨道预测结果
export interface OrbitPrediction {
  noradId: string
  name: string
  startTime: string
  endTime: string
  duration: number
  steps: number
  orbit: OrbitPoint[]
  orbitalPeriod?: number
}

// 位置预测结果
export interface PositionPrediction {
  noradId: string
  name: string
  timestamp: string
  position: {
    lat: number
    lng: number
    alt: number
  }
  velocity: {
    x: number
    y: number
    z: number
    total: number
  }
  orbitalInfo?: {
    period: number
    inclination: number
    eccentricity: number
  }
}

// 过境事件
export interface PassEvent {
  startTime: string
  endTime: string
  maxElevationTime: string
  maxElevation: number
  startAzimuth: number
  endAzimuth: number
  maxAzimuth: number
  duration: number
  visible: boolean
}

// 过境预测结果
export interface PassPrediction {
  noradId: string
  name: string
  observer: {
    lat: number
    lng: number
    alt: number
  }
  passes: PassEvent[]
  startDate: string
  endDate: string
  totalPasses: number
}

// 卫星详情数据
export interface SatelliteDetail {
  noradId: string
  name: string
  position: {
    noradId: string
    name: string
    lat: number
    lng: number
    alt: number
    velocity?: number
  } | null
  metadata: {
    noradId: string
    name?: string
    objectId?: string
    altNames?: string[]
    objectType?: string
    status?: string
    countryCode?: string
    launchDate?: string
    launchSite?: string
    launchVehicle?: string
    decayDate?: string
    period?: number
    inclination?: number
    apogee?: number
    perigee?: number
    eccentricity?: number
    raan?: number
    argOfPerigee?: number
    rcs?: string
    stdMag?: number
    tleEpoch?: string
    tleAge?: number
    // ESA DISCOS 扩展字段
    cosparId?: string
    objectClass?: string
    launchMass?: number
    dimensions?: string
    span?: number
    shape?: string
    mission?: string
    operator?: string
    firstEpoch?: string
    predDecayDate?: string
    hasDiscosData?: boolean
    // 发射扩展信息
    flightNo?: string
    cosparLaunchNo?: string
    launchFailure?: boolean
    launchSiteName?: string
  } | null
  orbit: SatelliteOrbit
}

// 卫星 API
export const satelliteApi = {
  // 获取卫星详细信息（推荐）
  getDetail: (noradId: string | number) =>
    api.get<ApiResponse<SatelliteDetail>>(`/satellites/${noradId}/detail`),

  // 获取卫星轨道数据
  getOrbit: (noradId: string | number, params?: {
    steps?: number
    startTime?: string
    duration?: number
  }) =>
    api.get<ApiResponse<SatelliteOrbit>>(`/satellites/${noradId}/orbit`, { params }),

  // 轨道预测（完整版）
  predictOrbit: (noradId: string | number, params?: {
    startTime?: string
    duration?: number
    steps?: number
  }) =>
    api.get<ApiResponse<OrbitPrediction>>(`/satellites/${noradId}/predict`, { params }),

  // 预测指定时间点的位置
  predictPosition: (noradId: string | number, time?: string) =>
    api.get<ApiResponse<PositionPrediction>>(`/satellites/${noradId}/position`, {
      params: time ? { time } : undefined,
    }),

  // 预测卫星过境
  predictPasses: (noradId: string | number, params: {
    lat: number
    lng: number
    alt?: number
    days?: number
    minElevation?: number
  }) =>
    api.get<ApiResponse<PassPrediction>>(`/satellites/${noradId}/passes`, { params }),

  // 获取国家列表
  getCountries: () =>
    api.get<ApiResponse<{ code: string; count: number }[]>>('/satellites/countries'),

  // 获取用途列表
  getPurposes: () =>
    api.get<ApiResponse<{ name: string; count: number }[]>>('/satellites/purposes'),

  // 获取运营商列表
  getOperators: () =>
    api.get<ApiResponse<{ name: string; count: number }[]>>('/satellites/operators'),

  // 获取所有卫星元数据
  getAllMetadata: () =>
    api.get<ApiResponse<{
      noradId: string
      name?: string
      objectId?: string
      altNames?: string[]
      objectType?: string
      status?: string
      countryCode?: string
      launchDate?: string
      launchSite?: string
      launchVehicle?: string
      decayDate?: string
      period?: number
      inclination?: number
      apogee?: number
      perigee?: number
      eccentricity?: number
      raan?: number
      argOfPerigee?: number
      rcs?: string
      stdMag?: number
      tleEpoch?: string
      tleAge?: number
      mission?: string
      operator?: string
    }[]>>('/satellites/metadata/all'),

  // 关注/取消关注卫星
  toggleFavorite: (noradId: string | number) =>
    api.post<ApiResponse<{ favorited: boolean }>>(`/satellites/${noradId}/favorite`),

  // 检查是否关注
  checkFavorite: (noradId: string | number) =>
    api.get<ApiResponse<{ favorited: boolean }>>(`/satellites/${noradId}/favorite`),

  // 获取用户关注的卫星列表
  getFavorites: () =>
    api.get<ApiResponse<SatelliteFavorite[]>>('/satellites/favorites'),
}

// 关注的卫星
export interface SatelliteFavorite {
  noradId: string
  name: string
  followedAt: string
  metadata?: {
    name?: string
    objectId?: string
    altNames?: string[]
    objectType?: string
    status?: string
    countryCode?: string
    launchDate?: string
    launchSite?: string
    launchVehicle?: string
    decayDate?: string
    period?: number
    inclination?: number
    apogee?: number
    perigee?: number
    eccentricity?: number
    raan?: number
    argOfPerigee?: number
    rcs?: string
    stdMag?: number
    tleEpoch?: string
    tleAge?: number
  }
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

// 反馈
export interface Feedback {
  id: string
  userId?: string
  type: 'bug' | 'feature' | 'suggestion' | 'other'
  title: string
  content: string
  status: 'pending' | 'processing' | 'resolved' | 'closed'
  createdAt: string
}

// 反馈 API
export const feedbackApi = {
  submit: (data: { type: string; title: string; content: string }) =>
    api.post<ApiResponse<Feedback>>('/feedback', data),
}

// 通知
export interface Notification {
  id: string
  userId: string
  type: 'intelligence' | 'system' | 'achievement'
  title: string
  content: string
  isRead: boolean
  relatedId?: string
  createdAt: string
}

// 通知 API
export const notificationApi = {
  getList: () => api.get<ApiResponse<Notification[]>>('/notifications'),

  markRead: (id: string) => api.put<ApiResponse<void>>(`/notifications/${id}/read`),

  markAllRead: () => api.put<ApiResponse<void>>('/notifications/read-all'),

  getUnreadCount: () => api.get<ApiResponse<{ count: number }>>('/notifications/unread-count'),
}

// 空间天气状态
export interface SpaceWeatherStatus {
  dateStamp: string | null
  timeStamp: string | null
  radiation: {
    scale: number
    text: string
    minorProb: number | null
    majorProb: number | null
  }
  solarFlare: {
    scale: number
    text: string
    minorProb: number | null
    majorProb: number | null
  }
  geomagnetic: {
    scale: number
    text: string
    minorProb: number | null
    majorProb: number | null
  }
  solarWind: {
    speed: number
    timeStamp: string
  }
}

// 空间天气预警
export interface SpaceWeatherAlert {
  id: string
  issueTime: string
  title: string
  type: 'geomagnetic' | 'radiation' | 'radio_blackout' | 'xray_flux' | 'unknown'
  level: number
  message: string
}

// X射线通量数据
export interface XrayFluxData {
  data: Array<{
    time: string
    flux: number
    observedFlux: number
  }>
  unit: string
  description: string
}

// 空间天气 API
export const spaceWeatherApi = {
  // 获取当前空间天气状态
  getCurrentStatus: () => api.get<ApiResponse<SpaceWeatherStatus>>('/space-weather/current'),

  // 获取预警列表
  getAlerts: (limit?: number) =>
    api.get<ApiResponse<{ list: SpaceWeatherAlert[]; total: number }>>('/space-weather/alerts', {
      params: { limit },
    }),

  // 获取X射线通量数据
  getXrayFlux: (hours?: number) =>
    api.get<ApiResponse<XrayFluxData>>('/space-weather/xray-flux', {
      params: { hours },
    }),
}

// 推送订阅
export interface PushSubscription {
  id: string
  email: string
  subscriptionTypes: string[]
  enabled: boolean
  status: 'active' | 'paused' | 'cancelled'
  lastPushAt: string | null
  createdAt: string
  updatedAt: string
}

// 推送订阅 API
export const pushApi = {
  // 获取订阅配置
  getSubscription: () => api.get<ApiResponse<PushSubscription | null>>('/push/subscription'),

  // 创建订阅
  createSubscription: (data: {
    email: string
    subscriptionTypes?: string[]
  }) => api.post<ApiResponse<PushSubscription>>('/push/subscription', data),

  // 更新订阅配置
  updateSubscription: (data: {
    email?: string
    subscriptionTypes?: string[]
  }) => api.put<ApiResponse<PushSubscription>>('/push/subscription', data),

  // 暂停推送
  pauseSubscription: () => api.post<ApiResponse<PushSubscription>>('/push/subscription/pause'),

  // 恢复推送
  resumeSubscription: () => api.post<ApiResponse<PushSubscription>>('/push/subscription/resume'),

  // 取消订阅
  cancelSubscription: () => api.delete<ApiResponse<{ success: boolean }>>('/push/subscription'),

  // 测试推送
  testPush: () => api.post<ApiResponse<{ success: boolean; message: string }>>('/push/test'),
}

// 里程碑
export interface Milestone {
  id: number
  title: string
  description: string
  content?: string
  eventDate: string
  category: 'launch' | 'recovery' | 'orbit' | 'mission' | 'other'
  cover?: string
  media?: any[]
  relatedSatelliteNoradId?: string
  importance: number
  location?: string
  organizer?: string
  createdAt: string
  updatedAt: string
}

// 里程碑 API
export const milestoneApi = {
  // 获取里程碑列表
  getList: (params?: { category?: string; page?: number; pageSize?: number }) =>
    api.get<ApiResponse<{ list: Milestone[]; total: number; page: number; pageSize: number }>>('/milestones', { params }),

  // 获取时间线数据（按年代分组）
  getTimeline: () => api.get<ApiResponse<{ decade: string; items: Milestone[] }[]>>('/milestones/timeline'),

  // 获取重要里程碑
  getFeatured: (limit?: number) =>
    api.get<ApiResponse<Milestone[]>>('/milestones/featured', { params: { limit } }),

  // 获取分类统计
  getCategories: () => api.get<ApiResponse<{ category: string; count: number }[]>>('/milestones/categories'),

  // 获取里程碑详情
  getDetail: (id: number) => api.get<ApiResponse<Milestone>>(`/milestones/${id}`),

  // 创建里程碑（管理员）
  create: (data: Partial<Milestone>) => api.post<ApiResponse<Milestone>>('/milestones', data),

  // 更新里程碑（管理员）
  update: (id: number, data: Partial<Milestone>) =>
    api.put<ApiResponse<Milestone>>(`/milestones/${id}`, data),

  // 删除里程碑（管理员）
  delete: (id: number) => api.delete<ApiResponse<{ success: boolean }>>(`/milestones/${id}`),
}

export default api