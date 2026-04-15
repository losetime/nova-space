import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import { authApi, userApi, type User } from '@/api'

export const useUserStore = defineStore('user', () => {
  // 状态
  const user = ref<User | null>(null)
  const token = ref<string | null>(localStorage.getItem('accessToken'))
  const loading = ref(false)

  // 计算属性
  const isLoggedIn = computed(() => !!token.value && !!user.value)
  const isAdmin = computed(() => user.value?.role === 'admin' || user.value?.role === 'super_admin')
  const isVip = computed(() => user.value?.level === 'advanced' || user.value?.level === 'professional')

  // 登录
  async function login(username: string, password: string) {
    loading.value = true
    try {
      const response = await authApi.login({ username, password })
      const data = response.data.data
      const userData = data.user
      const accessToken = data.accessToken ?? data.token

      console.log('Login response:', { userData, accessToken })

      // 保存 Token
      localStorage.setItem('accessToken', accessToken)
      token.value = accessToken
      user.value = userData

      console.log('After login:', { token: token.value, user: user.value, isLoggedIn: isLoggedIn.value })

      return { success: true }
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } }
      return { success: false, message: err.response?.data?.message || '登录失败' }
    } finally {
      loading.value = false
    }
  }

  // 注册
  async function register(username: string, email: string, password: string) {
    loading.value = true
    try {
      const response = await authApi.register({ username, email, password })
      const data = response.data.data
      const userData = data.user
      const accessToken = data.accessToken ?? data.token

      // 保存 Token
      localStorage.setItem('accessToken', accessToken)
      token.value = accessToken
      user.value = userData

      return { success: true }
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } }
      return { success: false, message: err.response?.data?.message || '注册失败' }
    } finally {
      loading.value = false
    }
  }

  // 登出
  function logout() {
    localStorage.removeItem('accessToken')
    localStorage.removeItem('refreshToken')
    token.value = null
    user.value = null
  }

  // 获取用户信息
  async function fetchUser() {
    if (!token.value) return

    loading.value = true
    try {
      const response = await userApi.getMe()
      user.value = response.data.data
    } catch {
      // Token 无效，清除登录状态
      logout()
    } finally {
      loading.value = false
    }
  }

  // 更新用户信息
  async function updateUser(data: Partial<User>) {
    loading.value = true
    try {
      const response = await userApi.updateMe(data)
      user.value = response.data.data
      return { success: true }
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } }
      return { success: false, message: err.response?.data?.message || '更新失败' }
    } finally {
      loading.value = false
    }
  }

  // 修改密码
  async function changePassword(oldPassword: string, newPassword: string) {
    loading.value = true
    try {
      await userApi.changePassword({ oldPassword, newPassword })
      return { success: true }
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } }
      return { success: false, message: err.response?.data?.message || '修改密码失败' }
    } finally {
      loading.value = false
    }
  }

  return {
    // 状态
    user,
    token,
    loading,
    // 计算属性
    isLoggedIn,
    isAdmin,
    isVip,
    // 方法
    login,
    register,
    logout,
    fetchUser,
    updateUser,
    changePassword,
  }
})