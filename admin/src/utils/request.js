import axios from 'axios'
import { getToken } from './auth'

// 创建 axios 实例
const service = axios.create({
  baseURL: '/api', // 确保此处仅配置一次
  timeout: 5000,
  withCredentials: true // 关键配置：允许跨域携带凭证
})
let isRefreshing = false;
let tokenCheckCount = 0;
// 请求拦截器
service.interceptors.request.use(
  config => {
    // 从Cookie获取Token（根据实际存储位置调整）
    console.log('[请求拦截器] 完整请求配置:', config) // 打印完整配置
    const token = getToken()
    console.log('[请求拦截器] 当前Token:', token) // 调试输出
    if (token) {
      config.headers.Authorization = `Bearer ${token}`; // 注意Bearer后空格
      console.log('[请求拦截器] 修改后的请求头:', config.headers) // 关键调试点
    } else {
      console.error('未找到Token，请重新登录');
    }
    return config
  },
  error => {
    return Promise.reject(error)
  }
)
// 响应拦截器
service.interceptors.response.use(
  response => {
    return response.data
  },
  error => {
    return Promise.reject(error)
  }
)

export default service