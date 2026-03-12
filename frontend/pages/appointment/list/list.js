const app = getApp()
const { getAppointments, cancelAppointment } = require('../../../utils/api')

Page({
  data: {
    loading: true,
    appointments: [],
    tabs: [
      { id: 0, name: '全部' },
      { id: 1, name: '待确认' },
      { id: 2, name: '已预约' },
      { id: 3, name: '已完成' }
    ],
    activeTab: 0,
    statusMap: {
      1: '待确认',
      2: '已预约',
      3: '已完成',
      4: '已取消'
    }
  },

  onLoad() {
    this.loadAppointments()
  },

  async loadAppointments() {
    try {
      const res = await getAppointments({
        status: this.data.activeTab === 0 ? null : this.data.activeTab
      });
  
      if (!res || !res.data) {
        throw new Error('接口返回数据异常');
      }
  
      this.setData({
        appointments: res.data.map(item => ({
          id: item.id,
          appointmentTime: item.appointment_time, // 字段名与后端一致
          status: item.status,
          formattedTime: this.formatTime(item.appointment_time),
          department: item.department,
          doctorName: item.doctor_name // 字段名与后端一致
        })),
        loading: false
      });
    } catch (error) {
      console.error('加载失败:', error);
      wx.showToast({ title: '加载失败', icon: 'none' });
      this.setData({ loading: false });
    }
  },

  formatTime(timestamp) {
    const date = new Date(timestamp)
    return `${date.getFullYear()}-${date.getMonth()+1}-${date.getDate()} ${date.getHours()}:${date.getMinutes().toString().padStart(2, '0')}`
  },

  switchTab(e) {
    const tabId = e.currentTarget.dataset.id
    if (this.data.activeTab === tabId) return
    
    this.setData({ 
      activeTab: tabId,
      loading: true
    }, () => this.loadAppointments())
  },

  // ✅ 修正跳转路径
  navigateToDetail(e) {
    const id = e.currentTarget.dataset.id;
    console.log('🎯 点击事件触发，预约ID:', id);
    
    if (!id) {
      console.error('❌ 未获取到预约ID');
      return;
    }
  
    wx.navigateTo({
      url: `/pages/appointment/detail/index?id=${id}`,
      success: () => console.log('✅ 跳转成功'),
      fail: (err) => console.error('❌ 跳转失败:', err)
    });
  },

  async handleCancel(e) {
    const id = e.currentTarget.dataset.id
    const appointment = this.data.appointments.find(a => a.id === id)
    
    wx.showModal({
      title: '确认取消',
      content: `确定要取消${this.formatTime(appointment.appointmentTime)}的预约吗？`,
      success: async (res) => {
        if (res.confirm) {
          try {
            await cancelAppointment(id)
            wx.showToast({ title: '取消成功' })
            this.loadAppointments()
          } catch (error) {
            wx.showToast({ title: '取消失败', icon: 'none' })
          }
        }
      }
    })
  }
})