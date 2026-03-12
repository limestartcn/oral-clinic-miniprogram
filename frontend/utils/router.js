import { ROLES, PERMISSIONS, MENU_CONFIG } from './roles'

export function checkPermission(roleId, permission) {
  const app = getApp()
  // 获取用户权限列表
  const permissions = app.globalData.permissions || []
  return permissions.includes(permission)
}

export function checkRoutePermission(path) {
  const { roleId } = getApp().globalData.userInfo
  const menuItems = MENU_CONFIG[roleId] || []
  return menuItems.some(item => item.path === path)
}

// 在app.onLaunch中初始化权限
wx.login().then(() => {
  const { roleId } = app.globalData.userInfo
  // 获取角色权限列表
  wx.request({
    url: '/api/role/permissions',
    data: { roleId },
    success: res => {
      app.globalData.permissions = res.data
    }
  })
})

export function navigateTo(url) {
  const { roleId } = app.globalData.userInfo
  
  // 路由权限表
  const routeRules = {
    '/pages/admin': [3],       // 仅管理员
    '/pages/doctor': [2,3],    // 医生和管理员
    '/pages/supervisor': [4]   // 仅监管
  }

  const matchedRule = Object.entries(routeRules).find(([path]) => url.includes(path))
  if (matchedRule && !matchedRule[1].includes(roleId)) {
    wx.showToast({ title: '无权限访问', icon: 'none' })
    return
  }
  
  wx.navigateTo({ url })
}