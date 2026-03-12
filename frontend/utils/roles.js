export const ROLES = {
  USER: 1,
  DOCTOR: 2,
  ADMIN: 3,
  SUPERVISOR: 4
}

export const PERMISSIONS = {
  CREATE_APPOINTMENT: 'appointment:create',
  MANAGE_APPOINTMENT: 'appointment:manage',
  MANAGE_USERS: 'user:manage',
  CLINIC_CONFIG: 'clinic:config',
  VIEW_REPORTS: 'report:view'
}

// 角色可见菜单配置
export const MENU_CONFIG = {
  [ROLES.USER]: [
    { path: '/pages/index', name: '首页' },
    { path: '/pages/appointment', name: '预约', required: PERMISSIONS.CREATE_APPOINTMENT }
  ],
  [ROLES.DOCTOR]: [
    { path: '/pages/doctor/schedule', name: '排班管理' },
    { path: '/pages/doctor/patients', name: '患者管理' }
  ],
  [ROLES.ADMIN]: [
    { path: '/pages/admin/users', name: '用户管理' },
    { path: '/pages/admin/settings', name: '系统设置' }
  ],
  [ROLES.SUPERVISOR]: [
    { path: '/pages/supervisor/reports', name: '数据报表' }
  ]
}