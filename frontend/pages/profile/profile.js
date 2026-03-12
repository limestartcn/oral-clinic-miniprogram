const app = getApp()
const { 
  getUserInfo,
  updateUserInfo,
  getAppointmentCount 
} = require('../../utils/api')

Page({
  data: {
    userInfo: null,
    appointmentCount: 0,
    showNicknameDialog: false,
    newNickname: '',
    roleFeatures: {
      1: [
        { name: '我的预约', icon: 'appointment', url: '/pages/appointment/list/list' },
        { name: '健康档案', icon: 'record', url: '/pages/medical-records/index' }
      ],
      2: [
        { 
          name: '预约管理', 
          icon: 'appointment', 
          url: '/pages/doctor/appointments/index' // 新增的预约管理页面路径
        },
        { name: '接诊安排', icon: 'schedule', url: '/pages/doctor/schedule' },
        { name: '患者管理', icon: 'patient', url: '/pages/doctor/patients' }
      ],
      3: [
        { name: '用户管理', icon: 'user-mgmt', url: '/pages/admin/users' },
        { name: '数据统计', icon: 'analytics', url: '/pages/admin/analytics' }
      ],
      4: [
        { name: '报表查看', icon: 'report', url: '/pages/supervisor/report' },
        { name: '合规审核', icon: 'audit', url: '/pages/supervisor/audit' }
      ]
    }
  },

  onLoad() {
    const userInfo = app.globalData.userInfo || {}
    const roleId = userInfo.roleId || 1 // 默认普通用户
    this.setData({
      features: this.data.roleFeatures[roleId] || []
    })
  },
  onShow() {
    this.loadData()
    const app = getApp(); // 获取全局实例
    console.log('用户角色:', app.globalData.userInfo.roleName);
  },

  // 加载数据
  async loadData() {
    wx.showLoading({ title: '加载中...' })

    
    try {
      // 确保已初始化权限
      if (!app.globalData.userInfo?.roleId) {
        await app.initPermissions()
      }

      const [userRes, countRes] = await Promise.all([
        wx.$api.getUserInfo(),
        wx.$api.getAppointmentCount().catch(() => ({ count: 0 }))
      ])
      
      this.setData({
        userInfo: {
          ...userRes.data,
          roleName: app.globalData.userInfo.roleName
        },
        appointmentCount: countRes.count,
        features: this.data.roleFeatures[app.globalData.userInfo.roleId] || []
      })
      
      // 更新全局用户信息
      app.globalData.userInfo = userRes.data
    } catch (error) {
      console.error('数据加载失败:', error)
    } finally {
      wx.hideLoading()
    }
    const { roleId } = app.globalData.userInfo
    this.setData({
      features: this.data.roleFeatures[roleId] || []
    })
  },

  // 显示修改昵称弹窗
  showNicknameDialog() {
    this.setData({ 
      showNicknameDialog: true,
      newNickname: this.data.userInfo.nickname 
    })
  },

  // 昵称输入处理
  onNicknameInput(e) {
    this.setData({ newNickname: e.detail.value.trim() })
  },

  // 提交昵称修改
  async submitNickname() {
    if (!this.data.newNickname) {
      wx.showToast({ title: '昵称不能为空', icon: 'none' })
      return
    }
    
    try {
      await updateUserInfo({ nickname: this.data.newNickname })
      
      this.setData({
        'userInfo.nickname': this.data.newNickname,
        showNicknameDialog: false
      })
      
      wx.showToast({ title: '修改成功' })
    } catch (error) {
      console.error('修改失败:', error)
    }
  },

  // 跳转绑定手机
  navigateToBindMobile() {
    wx.navigateTo({ url: '/pages/auth/bind-mobile/bind-mobile' })
  },

  // 新增返回首页方法
  navigateToHome() {
    // 清除页面栈历史
    getCurrentPages().forEach(page => {
      if (page.route !== 'pages/index/index') {
        wx.navigateBack({ delta: 999 })
      }
    })
    
    // 确保跳转到首页
    wx.switchTab({
      url: '/pages/index/index',
      success: () => {
        const app = getApp()
        app.eventBus.emit('refresh-home')
      }
    })
  },

  // 跳转设置
  navigateToSettings() {
    wx.navigateTo({ url: '/pages/settings/settings' })
  },

  // 退出登录（复用之前实现）
  handleLogout() {
    // ...同之前退出登录实现
  }
})