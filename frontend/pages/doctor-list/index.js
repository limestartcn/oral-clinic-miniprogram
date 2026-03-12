
// pages/doctor-list/index.js
const { getDoctorsByDepartment } = require('../../utils/api')

Page({
  data: {
    loading: true,           // 加载状态
    error: null,             // 错误信息
    doctors: [],             // 医生列表数据
    departmentName: '',      // 当前科室名称
    currentPage: 1,          // 当前页码（预留分页功能）
    hasMore: true            // 是否还有更多数据（预留分页）
  },

  onLoad(options) {
    this.setData({
      departmentName: decodeURIComponent(options.departmentName || '全部科室')
    })
    this.loadDoctors(options.departmentId)
  },

  // 加载医生数据
  async loadDoctors(departmentId) {
    try {
      this.setData({ loading: true, error: null })
      
      const res = await getDoctorsByDepartment(departmentId)
      if (res.code !== 200 || !res.data?.list) {
        throw new Error('数据加载失败，请稍后重试')
      }

      this.setData({
        doctors: this.processDoctorData(res.data.list),
        loading: false,
        hasMore: res.data.total > res.data.list.length
      })
    } catch (error) {
      console.error('医生加载失败:', error)
      this.setData({
        loading: false,
        error: error.message || '加载失败，下拉刷新重试'
      })
    }
  },

  // 处理医生数据（兼容字段缺失）
  processDoctorData(list) {
    return list.map(doctor => ({
      id: doctor.id,
      name: doctor.name || '未知医生',
      title: doctor.title || '医师',
      department: doctor.department_name || this.data.departmentName,
      specialty: doctor.specialty || '暂无擅长领域描述',
      avatar: doctor.avatar || '/images/default-avatar.png',
      rating: doctor.rating ? Math.min(5, doctor.rating).toFixed(1) : '5.0',
      serviceCount: doctor.service_count || 0
    }))
  },

  // 跳转到医生详情
  navigateToDoctorDetail(e) {
    const { id } = e.currentTarget.dataset
    wx.navigateTo({
      url: `/pages/doctor-detail/index?id=${id}`
    })
  },

  // 下拉刷新
  onPullDownRefresh() {
    this.loadDoctors().finally(() => {
      wx.stopPullDownRefresh()
    })
  },

  // 上拉加载更多（预留功能）
  onReachBottom() {
    if (this.data.hasMore && !this.data.loading) {
      this.setData({ currentPage: this.data.currentPage + 1 })
      // 此处可添加分页加载逻辑
    }
  }
})