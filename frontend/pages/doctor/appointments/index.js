const app = getApp()
const { 
  getDoctorAppointments, 
  completeAppointment,
  confirmAppointment  // 新增此行
} = require('../../../utils/api')

Page({
  data: {
    appointments: [],
    statusMap: {
      1: '待确认',
      2: '已预约',
      3: '已完成'
    }
  },
  // 新增状态切换方法
  changeStatus(e) {
    const status = e.currentTarget.dataset.id;
    this.setData({ activeStatus: status }, () => {
      this.loadAppointments();
    });
  },
  onLoad() {
    this.checkDoctorRole()
    this.loadAppointments()
  },

  // 验证医生身份
  checkDoctorRole() {
    if (app.globalData.userInfo.roleId !== 2) {
      wx.redirectTo({ url: '/pages/index/index' })
    }
  },

  // 加载预约数据
  async loadAppointments() {
    try {
      console.log('[DEBUG] 开始加载预约数据'); // 新增调试日志
      const res = await getDoctorAppointments({ 
        status: 1 // ✅ 只需传递状态参数
      });
      
      console.log('[调试] 接口响应数据:', res);
      
      this.setData({
        appointments: res.data.map(item => ({
          ...item,
          formattedTime: this.formatTime(item.appointment_time)
        }))
      });
      console.log('[DEBUG] 数据绑定完成'); // 新增调试日志
    } catch (error) {
      console.error('[ERROR] 加载失败:', error); // 改进错误日志
      wx.showToast({ title: '加载失败', icon: 'none' });
    }
  },

  // 格式化时间
  formatTime(timestamp) {
    const date = new Date(timestamp)
    return `${date.getFullYear()}-${date.getMonth()+1}-${date.getDate()} ${date.getHours()}:${date.getMinutes()}`
  },

  // 标记完成
  async handleConfirm(e) {
    console.log('[DEBUG] 触发确认方法，事件对象:', e);
    const id = e.currentTarget.dataset.id;
    wx.showModal({
      title: '确认预约',
      content: '确定接受该预约吗？',
      success: async (res) => {
        if (res.confirm) {
          try {
            console.log('[DEBUG] 开始调用 confirmAppointment');
            // ✅ 仅保留正确的方法调用（删除重复调用）
            await confirmAppointment(id);  // 直接使用导入的方法
            wx.showToast({ title: '确认成功' });
            this.loadAppointments();
          } catch (error) {
            console.error('[ERROR] 完整错误信息:', error);
            wx.showToast({ title: '操作失败', icon: 'none' });
          }
        }
      }
    })
  },
})