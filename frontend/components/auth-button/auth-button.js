Component({
  properties: {
    requiredRole: Number,
    requiredPermission: String
  },

  methods: {
    checkAuth() {
      const { roleId, permissions } = app.globalData.userInfo
      
      // 角色验证
      if (this.data.requiredRole && roleId !== this.data.requiredRole) {
        wx.showToast({ title: '无权限操作', icon: 'none' })
        return false
      }
      
      // 权限验证
      if (this.data.requiredPermission && 
          !permissions.includes(this.data.requiredPermission)) {
        wx.showToast({ title: '无权限操作', icon: 'none' })
        return false
      }
      this.triggerEvent('authed')
      return true
    }
  }
})