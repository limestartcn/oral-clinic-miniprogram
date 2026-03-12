Page({
  data: {
    roles: [],
    permissions: []
  },

  onLoad() {
    this.loadData()
  },

  async loadData() {
    const [rolesRes, permRes] = await Promise.all([
      wx.$api.getRoles(),
      wx.$api.getAllPermissions()
    ])
    
    this.setData({
      roles: rolesRes.data,
      permissions: permRes.data
    })
  },

  // 更新角色权限
  async updateRolePermissions(e) {
    const { roleId, permissions } = e.detail
    await wx.$api.updateRolePermissions({ roleId, permissions })
    wx.showToast({ title: '更新成功' })
  }
})