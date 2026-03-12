// pages/appointment/detail/index.js
const app = getApp();
const { getAppointmentDetail, cancelAppointment } = require('../../../utils/api');

Page({
  data: {
    appointment: {
      id: null,
      time: '',
      status: 1, // 1-待支付 2-已预约 3-已完成 4-已取消
      doctor: { name: '', avatar: '' },
      department: ''
    },
    showReviewModal: false,
    rating: 5,
    comment: '',
    hasReviewed: false,
    reviews: []
  },

  // ================= 生命周期函数 =================
  onLoad(options) {
    const appointmentId = options.id;
    if (!appointmentId) {
      wx.showToast({ title: '参数错误', icon: 'none' });
      wx.navigateBack();
      return;
    }
    
    // 异步加载数据链
    this.loadData(appointmentId)
      .then(() => this.checkReviewStatus())
      .catch(err => console.error('初始化失败:', err));
  },

  // ================= 数据加载 =================
  async loadData(appointmentId) {
    wx.showLoading({ title: '加载中...' });
    try {
      const res = await getAppointmentDetail(appointmentId);
      console.log('[DEBUG] 预约详情接口响应:', res);

      if (res?.code === 200) {
        const { id, time, status, doctor = {}, department } = res.data;
        
        // 结构化数据赋值
        this.setData({
          appointment: {
            id,
            time: this.formatDisplayTime(time), // 新增时间格式化
            status,
            doctor: {
              id: doctor.id || 0,
              name: doctor.name || '未知医生',
              avatar: doctor.avatar || '/images/default-avatar.png'
            },
            department
          }
        });

        // 强制更新视图
        this.setData({}, () => {
          console.log('[DEBUG] 数据更新完成');
        });
      } else {
        throw new Error(res?.msg || '接口数据异常');
      }
    } catch (error) {
      console.error('[ERROR] 加载失败:', error);
      wx.showToast({ title: error.message, icon: 'none' });
    } finally {
      wx.hideLoading();
    }
  },

  // ================= 评价功能 =================
  // 打开弹窗（增加状态验证）
  openReview() {
    if (this.data.appointment.status !== 3 || this.data.hasReviewed) return;
    console.log('[DEBUG] 打开评价弹窗');
    this.setData({ showReviewModal: true });
  },

  // 提交评价（增强校验）
  async submitReview() {
    const { rating, comment, appointment } = this.data;
    
    // 前端校验
    if (rating < 1 || rating > 5) {
      wx.showToast({ title: '请选择评分', icon: 'none' });
      return;
    }

    try {
      const res = await wx.$api.submitReview({
        appointment_id: appointment.id,
        rating,
        comment: comment.trim()
      });

      if (res.code === 200) {
        wx.showToast({ title: '评价成功', icon: 'success' });
        
        // 更新本地状态
        this.setData({
          showReviewModal: false,
          hasReviewed: true,
          'appointment.status': 3 // 确保状态同步
        });
      }
    } catch (error) {
      console.error('[ERROR] 评价提交失败:', error);
      wx.showToast({ title: error.msg || '提交失败', icon: 'none' });
    }
  },

  // ================= 状态检查 =================
  async checkReviewStatus() {
    try {
      const { appointment } = this.data;
      if (!appointment?.id || !appointment?.doctor?.id) {
        console.error('缺少必要参数');
        return;
      }

      // ✅ 修改点1：获取分页数据
      const res = await wx.$api.getDoctorReviews(appointment.doctor.id, {
        page: 1,
        pageSize: 100 // 获取全部评价用于状态检查
      });

      console.log('[DEBUG] 医生评价数据:', res.data);

      // ✅ 修改点2：使用 res.data.list 访问数组
      const hasReviewed = res.data.list.some(review => 
        review.appointment_id === appointment.id && 
        review.user_id === app.globalData.userId
      );

      this.setData({ hasReviewed });
    } catch (error) {
      console.error('[ERROR] 检查评价状态失败:', error);
      this.setData({ hasReviewed: false });
    }
  },

  // ================= 工具方法 =================
  // 时间格式化（新增）
  formatDisplayTime(timestamp) {
    const date = new Date(timestamp);
    return `${date.getFullYear()}-${(date.getMonth()+1).toString().padStart(2,'0')}-${date.getDate().toString().padStart(2,'0')} ${date.getHours().toString().padStart(2,'0')}:${date.getMinutes().toString().padStart(2,'0')}`;
  },

  // 状态文本映射（优化）
  getStatusText(status) {
    const map = { 
      1: '待支付', 
      2: '已预约', 
      3: '已完成', 
      4: '已取消' 
    };
    return map[status] || '未知状态';
  },

  // ================= 其他功能 =================
  // 联系医生（增加加载状态）
  async navigateToChat() {
    wx.showLoading({ title: '连接中...' });
    try {
      const doctorId = this.data.appointment.doctor?.id;
      if (!doctorId) throw new Error('医生信息异常');

      const res = await wx.$api.getConversationId({ doctor_id: doctorId });
      if (res.code === 200) {
        wx.navigateTo({
          url: `/pages/chat/index?conversationId=${res.data.conversation_id}&doctorId=${doctorId}`
        });
      }
    } catch (error) {
      console.error('[ERROR] 联系医生失败:', error);
      wx.showToast({ title: error.message, icon: 'none' });
    } finally {
      wx.hideLoading();
    }
  },

  // 新增关闭弹窗方法
  closeReviewModal() {
    this.setData({ showReviewModal: false });
  },

  handleCommentInput(e) {
    this.setData({
      comment: e.detail.value
    });
  },

  // 取消预约（增加二次确认）
  cancelAppointment() {
    wx.showModal({
      title: '确认取消',
      content: '确定要取消本次预约吗？',
      success: async (res) => {
        if (res.confirm) {
          try {
            await cancelAppointment(this.data.appointment.id);
            wx.showToast({ title: '取消成功' });
            this.loadData(this.data.appointment.id); // 重新加载数据
          } catch (error) {
            wx.showToast({ title: '取消失败', icon: 'none' });
          }
        }
      }
    });
  }
});