const app = getApp()
const { getDepartments } = require('../../../../utils/api') 

Page({
  data: {
    loading: true,
    error: null,
    departments: [],
    selectedId: null
  },

  onLoad() {
    this.loadDepartments()
  },

  onShow() {
    // 检查登录状态
    if (!app.globalData.hasLogin) {
      wx.redirectTo({ url: '/pages/auth/login/login' })
    }
  },

  async loadDepartments() {
    try {
      this.setData({ 
        loading: true,
        error: null 
      })

      const res = await getDepartments()
      if (res.code !== 200 || !Array.isArray(res.data)) {
        throw new Error('数据格式错误')
      }

      this.setData({
        departments: res.data,
        loading: false
      })
    } catch (error) {
      console.error('加载科室失败:', error)
      this.setData({
        loading: false,
        error: '科室信息加载失败，请稍后重试'
      })
    }
  },
  // 返回处理
  handleBack() {
    wx.removeStorageSync('tempDepartment')
    wx.navigateBack()
  },

  selectDepartment(e) {
    const id = e.currentTarget.dataset.id
    const department = this.data.departments.find(d => d.id === id)
    
    if (!department) {
      wx.showToast({ title: '科室信息错误', icon: 'none' })
      return
    }

    // 保存选择数据
    wx.setStorageSync('tempDepartment', department)
    
    // 跳转到选择医生页面
    wx.navigateTo({
      url: '/pages/appointment/create/step2-doctor/index'
    })
  }
})