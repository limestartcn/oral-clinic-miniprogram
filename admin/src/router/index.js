import { createRouter, createWebHistory } from 'vue-router'
import Layout from '@/views/Layout/index.vue'
import store from '@/store'
import {
  DataAnalysis,
  User,
  UserFilled, // 医生管理图标
  Setting,
  Notebook,
  Calendar,
  Clock,
  Plus,
  // 新增图标组件
  Tools
} from '@element-plus/icons-vue'

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/Login.vue'),
    meta: { title: '登录' }
  },
  {
    path: '/admin',
    component: Layout,
    redirect: (to) => {
      // 动态重定向
      const role = store.state.user.roleId
      return role === 2 ? 
        '/admin/doctor/appointments' : 
        '/admin/dashboard'
    },
    meta: { requiresAuth: true },
    children: [
      // 仪表盘
      {
        path: 'dashboard',
        name: 'Dashboard',
        component: () => import('@/views/Dashboard.vue'),
        meta: { 
          title: '数据分析',
          roles: [2, 3], // 允许医生和管理员
          icon: DataAnalysis
        }
      },
      
      // 管理员专属路由
      {
        path: 'user/manage',
        name: 'UserManage',
        component: () => import('@/views/UserManage.vue'),
        meta: { 
          title: '用户管理', 
          roles: [3], 
          icon: UserFilled
        }
      },
      // 医生管理模块
      // 医生管理模块配置
      {
        path: 'doctor',
        name: 'DoctorManagement',
        redirect: '/admin/doctor/list',
        //omponent: () => import('@/views/Layout/BlankLayout.vue'), // 新增空白布局组件
        meta: { 
          title: '医生管理',
          roles: [3], 
          icon: UserFilled
        },
        children: [
          {
            path: 'list',
            name: 'DoctorList',
            component: () => import('@/views/doctor/DoctorList.vue'), // 指定组件
            meta: { 
              title: '医生管理', 
              icon: Notebook,
              roles: [3] 
            }
          },
          {
            path: 'schedule',
            name: 'DoctorSchedule',
            component: () => import('@/views/doctor/ScheduleManage.vue'), // 指定组件
            meta: { 
              title: '排班管理', 
              icon: Calendar ,
              roles: [3] 
            }
          },
          {
            path: 'create',
            name: 'DoctorCreate',
            component: () => import('@/views/doctor/DoctorForm.vue'), // 指定组件
            meta: { 
              title: '新增医生', 
              icon: Plus ,
              roles: [3] 
            }
          },

        ]
      },

      // 医生工作台路由
      {
        path: 'doctor/appointments',
        name: 'DoctorAppointments',
        component: () => import('@/views/doctor/AppointmentManage.vue'),
        meta: { 
          title: '预约管理', 
          roles: [2], 
          icon: 'el-icon-date' 
        }
      },
      // {
      //   path: 'doctor/my-schedule',
      //   name: 'DoctorMySchedule',
      //   component: () => import('@/views/doctor/MySchedule.vue'),
      //   meta: { 
      //     title: '我的排班', 
      //     roles: [2], 
      //     icon: 'el-icon-timer' 
      //   }
      // },
      {
        path: 'medical',
        name: 'DoctorMedical',
        component: () => import('@/views/Layout/BlankLayout.vue'),
        meta: { 
          title: '病例管理',
          roles: [2], // 关键角色配置
          icon: 'el-icon-document-checked' 
        },
        children: [
          {
            path: 'list',
            name: 'MedicalList',
            component: () => import('@/views/doctor/medical/list/index.vue'),
            meta: { 
              title: '病例列表',
              roles: [2],
              keepAlive: true 
            }
          },
          {
            path: 'edit/:id', 
            name: 'MedicalEdit', // ✅ 添加命名路由
            component: () => import('@/views/doctor/medical/edit/index.vue'), // 修正路径
            meta: { 
              title: '填写病例',
              roles: [2],
              hidden: true // 添加隐藏标记
            }
          },
          {
            path: 'detail/:appointmentId',
            name: 'MedicalDetail',
            component: () => import('@/views/doctor/medical/detail/index.vue'),
            meta: { 
              hidden: true // 隐藏菜单项
            }
          }
        ]
      }
    ]
  },
  
  // 错误页面
  {
    path: '/401',
    name: 'Unauthorized',
    component: () => import('@/views/error/401.vue'),
    meta: { title: '未授权' }
  },
  {
    path: '/404',
    name: 'NotFound',
    component: () => import('@/views/error/404.vue'),
    meta: { title: '页面不存在' }
  },
  {
    path: '/:catchAll(.*)', // 必须放在最后
    redirect: (to) => {
      // 新增角色兜底重定向
      const role = store.state.user.roleId
      return role === 2 ? 
        '/admin/doctor/appointments' : 
        '/404'
    }
  }
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes
})

// 增强路由守卫
router.beforeEach(async (to, from, next) => {
  // 设置页面标题
  document.title = to.meta.title ? `${to.meta.title} - 口腔诊所系统` : '口腔诊所管理系统'

  const hasToken = localStorage.getItem('admin-token')
  
  // 登录页特殊处理
  if (to.path === '/login') {
    if (hasToken) {
      // 动态跳转逻辑
      const redirectPath = store.state.user.roleId === 2 
        ? '/admin/doctor/appointments' 
        : '/admin/dashboard'
      next(redirectPath)
    } else {
      next()
    }
    return
  }

  // 无令牌重定向到登录页
  if (!hasToken) {
    next(`/login?redirect=${to.path}`)
    return
  }

  // 已登录状态加载用户信息
  try {
    if (!store.state.user.roleId) {
      await store.dispatch('user/fetchUserInfo')
    }
    // 新增调试日志
    console.log('[路由守卫] 当前角色:', store.state.user.roleId)
    console.log('[路由守卫] 目标路径:', to.path)
    // 新增：处理根路径重定向
    if (to.path === '/admin') {
      const redirectPath = store.state.user.roleId === 2 
        ? '/admin/doctor/appointments' 
        : '/admin/dashboard'
      console.log('[重定向] 目标路径:', redirectPath)
      return next(redirectPath)
    }

    // 新增：匹配失败时的角色兜底
    if (to.matched.length === 0) {
      console.warn('[路由守卫] 未匹配路由，执行角色兜底')
      return next(store.state.user.roleId === 2 
        ? '/admin/doctor/appointments' 
        : '/401'
      )
    }

    // 权限验证
    const requiredRoles = to.meta.roles || []
    const userRole = store.state.user.roleId
    
    if (requiredRoles.length && !requiredRoles.includes(userRole)) {
      next('/401')
    } else if (to.matched.length === 0) { // 未匹配任何路由
      next('/404')
    } else {
      next()
    }
  } catch (error) {
    console.error('[路由守卫错误]', error)
    localStorage.removeItem('admin-token')
    next(`/login?redirect=${to.path}`)
  }
})

export default router