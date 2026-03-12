const app = getApp()
const { getTimeSlots } = require('../../../../utils/api')

Page({
  data: {
    loading: true,
    error: null,
    doctor: null,
    department: null,
    selectedDate: '',
    formattedSelectedDate: '--月--日', // 新增字段，手动维护
    selectedWeek: '--',                // 新增字段，手动维护
    selectedTime: null,
    timeSlots: [],
    startDate: '', // 先初始化为空
    endDate: ''    // 先初始化为空
  },

 onLoad() {
  const initialDate = this.getStartDate();
  console.log('初始日期:', initialDate);
  
  this.setData({
    startDate: initialDate,
    endDate: this.getEndDate(),
    selectedDate: initialDate
  }, () => {
    this.updateFormattedDate(); // 手动触发格式化
    this.initData();
    this.loadTimeSlots();
  });
},

  getStartDate() {
    const today = new Date()
    return this.formatDate(today)
  },

  getEndDate() {
    const endDate = new Date()
    endDate.setDate(endDate.getDate() + 14) // 允许预约未来14天
    return this.formatDate(endDate)
  },

  formatDate(date) {
    const year = date.getFullYear()
    const month = (date.getMonth() + 1).toString().padStart(2, '0')
    const day = date.getDate().toString().padStart(2, '0')
    return `${year}-${month}-${day}`
  },

  async initData() {
    try {
      const doctor = wx.getStorageSync('tempDoctor');
      const department = wx.getStorageSync('tempDepartment');
      
      if (!doctor || !department) {
        wx.showToast({ title: '请先选择医生', icon: 'none' });
        setTimeout(() => wx.navigateBack({ delta: 2 }), 1500);
        return;
      }
  
      // 仅更新医生和科室信息
      this.setData({ doctor, department });
    } catch (error) {
      this.handleError('初始化失败');
    }
  },

  async loadTimeSlots() {
    console.log('[调试] loadTimeSlots 触发，当前 selectedDate:', this.data.selectedDate);
    try {
      this.setData({ 
        loading: true,
        error: null,
        selectedTime: null
      });
  
      const response = await getTimeSlots({
        doctorId: this.data.doctor.id,
        date: this.data.selectedDate
      });
  
      if (response.code !== 200 || !Array.isArray(response.data)) {
        throw new Error('数据格式错误');
      }
  
      this.setData({
        timeSlots: response.data.map(slot => ({
          ...slot,
          displayTime: this.formatTime(slot.time_slot)
        })),
        loading: false
      }, () => {
        // 数据渲染完成后触发动画
        this.animateTimeSlots();
      });
  
    } catch (error) {
      console.error('加载失败:', error);
      this.setData({
        loading: false,
        error: error.message || '加载时间段失败'
      });
    }
  },

  // 新增方法：时间段入场动画
  animateTimeSlots() {
    const query = wx.createSelectorQuery();
    query.selectAll('.time-item').boundingClientRect();

    query.exec((res) => {
      const items = res[0];
      items.forEach((item, index) => {
        const animation = wx.createAnimation({
          duration: 300,
          timingFunction: 'ease',
          delay: index * 50 // 每个元素间隔50ms触发动画
        });

        animation
          .opacity(1)
          .translateY(0)
          .step();

        // 初始化隐藏元素
        this.setData({
          [`timeSlots[${index}].animate`]: animation.export()
        });

        // 执行动画
        setTimeout(() => {
          const showAnimation = wx.createAnimation({
            duration: 300,
            timingFunction: 'ease'
          });
          showAnimation
            .opacity(1)
            .translateY(0)
            .step();

          this.setData({
            [`timeSlots[${index}].animate`]: showAnimation.export()
          });
        }, 10);
      });
    });
  },

  formatTime(timeString) {
    const [start] = timeString.split('-')
    return start
  },

  dateChange(e) {
    const selectedDate = e.detail.value;
    console.log('新选择的日期:', selectedDate);
    if (selectedDate === this.data.selectedDate) return;
    
    this.setData({ 
      selectedDate,
      timeSlots: [],
      loading: true,
      _forceUpdate: Date.now()
    }, () => {
      this.updateFormattedDate(); // 手动触发格式化
      this.loadTimeSlots();
    });
  },

  selectTime(e) {
    const { time, id } = e.currentTarget.dataset; // 获取时间段的 schedule_id
    const slot = this.data.timeSlots.find(t => t.id === id);
  
    // 有效性校验
    if (!slot || !slot.available) {
      wx.showToast({ title: '该时段不可预约', icon: 'none' });
      return;
    }
  
    // 存储完整预约信息
    wx.setStorageSync('tempTime', {
      date: this.data.selectedDate,
      time: slot.time_slot,       // 原始时间段字符串
      schedule_id: slot.id        // 新增 schedule_id
    });
  
    // 更新选中状态
    this.setData({ 
      selectedTime: slot.time_slot,
      selectedScheduleId: slot.id // 存储到 data 用于调试
    });
  
    // 调试输出
    console.log('[DEBUG] 已选择时段:', {
      time: slot.time_slot,
      schedule_id: slot.id,
      doctor_id: this.data.doctor.id,
      date: this.data.selectedDate
    });
  },

  handleNextStep() {
    if (!this.data.selectedTime) {
      wx.showToast({ title: '请选择时间段', icon: 'none' })
      return
    }
  
    // 从 data 中获取已存储的 schedule_id
    const tempTime = wx.getStorageSync('tempTime') || {};
    if (!tempTime.schedule_id) {
      wx.showToast({ title: '请重新选择时间段', icon: 'none' });
      return;
    }
  
    // 保留所有参数
    wx.setStorageSync('tempTime', {
      ...tempTime, // 保留已有参数
      date: this.data.selectedDate,
      time: this.data.selectedTime
    });
    
    wx.navigateTo({
      url: '/pages/appointment/create/step4-confirm/index'
    })
  },

  navigateBack() {
    wx.navigateBack()
  },

  /*get selectedWeek() {
    if (!this.data.selectedDate) {
      console.log('[警告] selectedWeek: selectedDate 为空');
      return '--';
    }
    // 直接按 '-' 分割
    const [year, month, day] = this.data.selectedDate.split('-');
    const date = new Date(year, month - 1, day); // 注意月份需减1
    const weeks = ['周日','周一','周二','周三','周四','周五','周六'];
    return weeks[date.getDay()];
  },

  get formattedSelectedDate() {
    if (!this.data.selectedDate) {
      console.log('[警告] formattedSelectedDate: selectedDate 为空');
      return '--月--日';
    }
    // 直接按 '-' 分割，无需 replace
    const [year, month, day] = this.data.selectedDate.split('-');
    return `${month}月${day}日`;
  },*/
  // 新增方法：更新日期格式化数据
  updateFormattedDate() {
    const { selectedDate } = this.data;
    if (!selectedDate) {
      this.setData({ 
        formattedSelectedDate: '--月--日',
        selectedWeek: '--'
      });
      return;
    }

    // 格式化日期
    const [year, month, day] = selectedDate.split('-');
    const formattedDate = `${month.padStart(2, '0')}月${day.padStart(2, '0')}日`;

    // 计算星期
    const date = new Date(year, month - 1, day);
    const weeks = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
    const week = weeks[date.getDay()];

    this.setData({ 
      formattedSelectedDate: formattedDate,
      selectedWeek: week
    });
  },
  handleError(msg) {
    wx.showToast({ title: msg, icon: 'none' })
    setTimeout(() => wx.navigateBack(), 1500)
  }
})