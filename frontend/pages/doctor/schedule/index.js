const { getSchedule, updateSchedule } = require('../../../utils/api')

Page({
  data: {
    schedule: [],
    currentDate: new Date().toISOString().slice(0,10)
  },

  onLoad() {
    this.loadSchedule()
  },

  async loadSchedule() {
    try {
      const res = await getSchedule({
        date: this.data.currentDate
      })
      this.setData({ schedule: res.data })
    } catch (error) {
      wx.showToast({ title: '加载失败', icon: 'none' })
    }
  },

  dateChange(e) {
    this.setData({ currentDate: e.detail.value }, () => {
      this.loadSchedule()
    })
  },

  async toggleTimeSlot(e) {
    const { time, index } = e.currentTarget.dataset
    const newSchedule = [...this.data.schedule]
    newSchedule[index].available = !newSchedule[index].available
    
    try {
      await updateSchedule({
        date: this.data.currentDate,
        time,
        available: newSchedule[index].available
      })
      this.setData({ schedule: newSchedule })
    } catch (error) {
      wx.showToast({ title: '更新失败', icon: 'none' })
    }
  }
})