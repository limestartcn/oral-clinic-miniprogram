const { 
  getDoctorDetail,
  createAppointment,
  confirmPayment 
} = require('../../utils/api')

Page({
  data: {
    loading: true,           // 加载状态
    error: null,             // 错误信息
    doctor: null,            // 医生详情数据
    tempAppointment: null    // 临时存储预约数据
  },

  onLoad(options) {
    this.loadDoctorDetail(options.id)
  },

  // 加载医生详情
  async loadDoctorDetail(id) {
    try {
      this.setData({ loading: true, error: null })
      
      const res = await getDoctorDetail(id)
      if (res.code !== 200 || !res.data) {
        throw new Error('医生信息加载失败')
      }

      this.setData({
        doctor: this.processDoctorData(res.data),
        loading: false
      })
    } catch (error) {
      console.error('详情加载失败:', error)
      this.setData({
        loading: false,
        error: error.message || '加载失败，请稍后重试'
      })
    }
  },

  // 处理医生数据
  processDoctorData(data) {
    return {
      id: data.id,
      name: data.name || '未知医生',
      title: data.title || '医师',
      department: data.department_name || '未知科室',
      specialty: data.specialty || '暂无擅长领域描述',
      avatar: data.avatar || '/images/default-avatar.png',
      rating: data.rating ? Math.min(5, data.rating).toFixed(1) : '5.0',
      department_id: data.department_id || data.department?.id, 
      serviceCount: data.service_count || 0,
      satisfaction: data.satisfaction ? `${data.satisfaction}%` : '100%'
    }
  },

  // 处理预约流程
  async handleAppointment() {
    try {
      const { doctor } = this.data;
      
      // 参数校验
      if (!doctor?.id || !doctor?.department_id) {
        throw new Error('无法获取医生信息');
      }

      // 存储必要参数到缓存
      wx.setStorageSync('tempDoctor', doctor);
      wx.setStorageSync('tempDepartment', { 
        id: doctor.department_id,
        name: doctor.department 
      });

      // 跳转到时间选择页
      wx.navigateTo({
        url: '/pages/appointment/create/step3-time/index'
      });

    } catch (error) {
      wx.showToast({ title: error.message, icon: 'none' });
    }
  },

  // 显示模拟支付弹窗
  showPaymentDialog() {
    wx.showModal({
      title: '模拟支付',
      content: '开发环境请选择支付结果',
      confirmText: '支付成功',
      cancelText: '支付失败',
      success: async (res) => {
        if (res.confirm) {
          await this.confirmPayment()
        } else {
          await this.handlePaymentFailure()
        }
      }
    })
  },

  // 确认支付
  async confirmPayment() {
    try {
      const res = await confirmPayment(this.data.tempAppointment.id)
      if (res.code === 200) {
        wx.showToast({ 
          title: '预约成功', 
          icon: 'success',
          success: () => {
            setTimeout(() => {
              wx.navigateTo({
                url: `/pages/appointment/detail/index?id=${this.data.tempAppointment.id}`
              })
            }, 1500)
          }
        })
      }
    } catch (error) {
      wx.showToast({ title: '支付状态更新失败', icon: 'none' })
    }
  },

  // 处理支付失败
  async handlePaymentFailure() {
    wx.showToast({ 
      title: '支付未完成，请及时处理', 
      icon: 'none',
      duration: 3000
    })
  },

  // 跳转到聊天
  async navigateToChat() {
    try {
      // 使用与预约详情页相同的接口方法
      const res = await wx.$api.getConversationId({ 
        doctor_id: this.data.doctor.id 
      });
  
      if (res.code === 200) {
        wx.navigateTo({
          url: `/pages/chat/index?conversationId=${res.data.conversation_id}&doctorId=${this.data.doctor.id}`
        });
      }
    } catch (error) {
      console.error('[ERROR]', error);
      wx.showToast({ title: '暂时无法发起咨询', icon: 'none' });
    }
  },

  // 分享功能
  onShareAppMessage() {
    return {
      title: `推荐${this.data.doctor.name}医生`,
      path: `/pages/doctor-detail/index?id=${this.data.doctor.id}`
    }
  }
})