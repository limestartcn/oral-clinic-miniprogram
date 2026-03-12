// components/calendar/index.js
Component({
  properties: {
    selectedDate: {  // 外部传入的选中日期
      type: String,
      value: ''
    }
  },

  data: {
    currentDate: new Date(),
    days: []
  },

  lifetimes: {
    attached() {
      this.generateCalendar()
    }
  },

  methods: {
    generateCalendar() {
      const date = new Date(this.data.currentDate)
      const year = date.getFullYear()
      const month = date.getMonth()
      
      // 生成当月日历
      const days = []
      const firstDay = new Date(year, month, 1)
      const lastDay = new Date(year, month + 1, 0)
      const startDay = firstDay.getDay()
      const endDate = lastDay.getDate()
      
      // 填充空白
      for (let i = 0; i < startDay; i++) {
        days.push({ day: '', date: '' })
      }

      // 填充日期
      for (let d = 1; d <= endDate; d++) {
        const currentDate = new Date(year, month, d)
        days.push({
          day: d,
          date: currentDate.toISOString().split('T')[0],
          isToday: this.isToday(currentDate),
          isSelected: this.isSelected(currentDate)
        })
      }

      this.setData({
        currentYear: year,
        currentMonth: month + 1,
        days: days
      })
    },

    isToday(date) {
      const today = new Date()
      return date.toDateString() === today.toDateString()
    },

    isSelected(date) {
      return this.data.selectedDate === date.toISOString().split('T')[0]
    },

    handlePrevMonth() {
      const date = new Date(this.data.currentDate)
      date.setMonth(date.getMonth() - 1)
      this.setData({ currentDate: date }, () => {
        this.generateCalendar()
        this.triggerEvent('monthChange', { 
          year: date.getFullYear(),
          month: date.getMonth() + 1
        })
      })
    },

    handleNextMonth() {
      const date = new Date(this.data.currentDate)
      date.setMonth(date.getMonth() + 1)
      this.setData({ currentDate: date }, () => {
        this.generateCalendar()
        this.triggerEvent('monthChange', {
          year: date.getFullYear(),
          month: date.getMonth() + 1
        })
      })
    },

    selectDate(e) {
      const selectedDate = e.currentTarget.dataset.date
      this.setData({
        days: this.data.days.map(day => ({
          ...day,
          isSelected: day.date === selectedDate
        }))
      })
      this.triggerEvent('dateSelect', { date: selectedDate })
    }
  }
})