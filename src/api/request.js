import axios from 'axios'

const request = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json'
  }
})

// 请求拦截器
request.interceptors.request.use(
  (config) => {
    // 如果有 token，在这里统一注入
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// 响应拦截器
request.interceptors.response.use(
  (response) => {
    // 直接返回 data，省去每次 response.data
    return response.data
  },
  (error) => {
    const status = error.response?.status
    const msgMap = {
      400: '请求参数错误',
      401: '未授权，请重新登录',
      403: '无权限访问',
      404: '请求资源不存在',
      500: '服务器内部错误',
      502: '网关错误',
      503: '服务不可用'
    }
    const message = msgMap[status] || error.message || '网络请求失败'
    console.error(`[HTTP ${status}] ${message}`)
    return Promise.reject(new Error(message))
  }
)

export default request
