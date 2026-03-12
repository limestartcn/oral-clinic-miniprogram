const app = getApp()
const { getDoctorsByDepartment } = require('../../../../utils/api')

Page({
  data: {
    loading: true,
    error: null,
    departmentName: '',
    doctors: []
  },

  onLoad() {
    this.initData()
  },

  async initData() {
    const department = wx.getStorageSync('tempDepartment')
    if (!department) {
      wx.showToast({ title: '请先选择科室', icon: 'none' })
      setTimeout(() => wx.navigateBack(), 1500)
      return
    }

    this.setData({
      departmentName: department.name
    }, () => {
      this.loadDoctors(department.id)
    })
  },

  async loadDoctors(departmentId) {
    try {
      this.setData({ 
        loading: true,
        error: null 
      });
  
      const res = await getDoctorsByDepartment(departmentId);
      
      // ✅ 验证数据结构
      if (
        res.code !== 200 || 
        !res.data || 
        !Array.isArray(res.data.list) // 检查 list 字段是否为数组
      ) {
        throw new Error('数据格式错误: 缺少有效列表');
      }
  
      this.setData({
        // ✅ 使用 res.data.list 获取医生列表
        doctors: res.data.list.map(doctor => ({
          ...doctor,
          rating: Math.min(5, Math.max(0, doctor.rating || 5))
        })),
        loading: false
      });
    } catch (error) {
      console.error('加载医生失败:', error);
      this.setData({
        loading: false,
        error: error.message || '医生信息加载失败'
      });
    }
  },

  selectDoctor(e) {
    const doctor = e.currentTarget.dataset.doctor
    if (!doctor.id) {
      wx.showToast({ title: '医生信息异常', icon: 'none' })
      return
    }

    wx.setStorageSync('tempDoctor', doctor)
    wx.navigateTo({
      url: '/pages/appointment/create/step3-time/index'
    })
  },

  navigateBack() {
    wx.navigateBack()
  }
})