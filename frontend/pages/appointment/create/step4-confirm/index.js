// pages/appointment/create/step4-confirm/index.js
const app = getApp();
const { createAppointment,confirmPayment } = require('../../../../utils/api');

Page({
  data: {
    doctor: null,        // 医生信息
    department: null,    // 科室信息
    selectedDate: '',    // 预约日期（YYYY-MM-DD）
    selectedTime: '',    // 时间段（如09:00-10:00）
    patientName: '',     // 就诊人姓名
    patientMobile: '',   // 就诊人手机号
    remark: '',          // 备注
    isSubmitting: false, // 是否正在提交
    isFormValid: false   // 表单是否有效
  },

  onLoad() {
    // 从缓存读取前几步数据
    const doctor = wx.getStorageSync('tempDoctor');
    const department = wx.getStorageSync('tempDepartment');
    const timeData = wx.getStorageSync('tempTime');

    if (!doctor || !department || !timeData) {
      wx.showToast({ title: '请重新选择预约信息', icon: 'none' });
      setTimeout(() => wx.navigateBack({ delta: 3 }), 1500);
      return;
    }

    this.setData({
      doctor,
      department,
      selectedDate: timeData.date,
      selectedTime: timeData.time,
      // 初始化格式化日期和星期
      formattedDate: this.formatDate(timeData.date),
      selectedWeek: this.getWeekday(timeData.date)
    });
  },

  // 格式化日期（03月24日）
  formatDate(dateStr) {
    const [year, month, day] = dateStr.split('-');
    return `${month.padStart(2, '0')}月${day.padStart(2, '0')}日`;
  },

  // 获取星期
  getWeekday(dateStr) {
    const [year, month, day] = dateStr.split('-');
    const date = new Date(year, month - 1, day);
    const weeks = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
    return weeks[date.getDay()];
  },

  // 输入框事件
  onPatientNameInput(e) {
    this.setData({ patientName: e.detail.value }, this.validateForm);
  },

  onPatientMobileInput(e) {
    this.setData({ patientMobile: e.detail.value }, this.validateForm);
  },

  onRemarkInput(e) {
    this.setData({ remark: e.detail.value });
  },

  // 表单验证
  validateForm() {
    const { patientName, patientMobile } = this.data;
    const isNameValid = patientName.trim().length > 0;
    const isMobileValid = /^1[3-9]\d{9}$/.test(patientMobile);
    this.setData({ isFormValid: isNameValid && isMobileValid });
  },

  // 提交预约
  async handleSubmit() {
    if (this.data.isSubmitting) return;
    this.setData({ isSubmitting: true });

    try {
      // 从缓存获取时间数据
      const timeData = wx.getStorageSync('tempTime') || {};
      if (!timeData.schedule_id) {
        wx.showToast({ title: '请重新选择就诊时间', icon: 'none' });
        throw new Error('schedule_id缺失');
      }

      // 构造参数
      const params = {
        doctor_id: this.data.doctor.id,
        department_id: this.data.department.id,
        appointment_time: `${this.data.selectedDate} ${this.data.selectedTime.split('-')[0]}:00`,
        patient_name: this.data.patientName.trim(),
        patient_mobile: this.data.patientMobile.trim(),
        remark: this.data.remark.trim(),
        schedule_id: timeData.schedule_id
      };

      // 1. 创建预约记录（状态1-待支付）
      const res = await createAppointment(params);
      if (res.code !== 200 || !res.data?.id) {
        throw new Error(res.msg || '预约创建失败');
      }
      const appointmentId = res.data.id;

      // 2. 显示支付弹窗
      wx.showModal({
        title: '模拟支付',
        content: '开发阶段支付模拟',
        confirmText: '支付成功',
        cancelText: '支付失败',
        success: async (payRes) => {
          // 3. 根据选择处理支付
          if (payRes.confirm) {
            try {
              // ✅ 支付成功分支
              await confirmPayment(appointmentId);
              wx.showToast({ title: '支付成功', icon: 'success' });

              // 开发环境自动支付（仅调试用）
              const accountInfo = wx.getAccountInfoSync();
              if (accountInfo.miniProgram.envVersion === 'develop') {
                console.log('[DEV] 开发环境自动标记支付成功');
              }
            } catch (error) {
              console.error('支付确认失败:', error);
              wx.showToast({ title: '支付状态更新失败', icon: 'none' });
            }
          } else {
            // ✅ 支付失败分支（不调用接口）
            wx.showToast({ 
              title: '支付未完成，请及时支付', 
              icon: 'none',
              duration: 3000
            });
          }

          // 4. 无论成功失败都跳转详情页
          wx.reLaunch({ 
            url: `/pages/appointment/detail/index?id=${appointmentId}`
          });
        },
        complete: () => {
          // ✅ 仅清理缓存（移除了自动支付逻辑）
          wx.removeStorageSync('tempDoctor');
          wx.removeStorageSync('tempDepartment');
          wx.removeStorageSync('tempTime');
        }
      });

    } catch (error) {
      console.error('预约提交失败:', error);
      wx.showToast({ title: error.message || '流程异常', icon: 'none' });
    } finally {
      this.setData({ isSubmitting: false });
    }
  },

  // 返回上一步
  navigateBack() {
    wx.navigateBack();
  }
});