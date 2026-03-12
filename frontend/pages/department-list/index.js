const { getDepartments } = require('../../utils/api')

Page({
  data: {
    loading: true,           // 加载状态
    error: null,             // 错误信息
    departments: [],         // 科室列表数据
    searchKeyword: '',       // 搜索关键词
    showSearch: false,       // 是否显示搜索框
    filteredDepartments: [] // 新增字段存储筛选结果
  },

  onLoad() {
    this.loadDepartments()
  },

  // 加载科室数据
  async loadDepartments() {
    try {
      const res = await getDepartments();
      if (res.code !== 200) throw new Error('数据异常');
  
      // 直接计算筛选结果
      const departments = res.data.map(item => ({
        ...item,
        iconUrl: item.icon ? `/images/departments/${item.icon}.png` : '/images/departments/default.png'
      }));
  
      this.setData({
        departments,
        filteredDepartments: departments, // 初始化筛选结果
        loading: false
      });
    } catch (error) {
      this.handleError(error);
    }
  },

  // 跳转到医生列表
  navigateToDoctorList(e) {
    const { id, name } = e.currentTarget.dataset
    wx.navigateTo({
      url: `/pages/doctor-list/index?departmentId=${id}&departmentName=${encodeURIComponent(name)}`
    })
  },

  // 触发搜索
  toggleSearch() {
    this.setData({ showSearch: !this.data.showSearch })
  },

  // 输入搜索关键词
  onSearchInput(e) {
    const keyword = e.detail.value.trim().toLowerCase();
    const filtered = this.data.departments.filter(item => {
      const desc = item.description || '';
      return (
        item.name.toLowerCase().includes(keyword) ||
        desc.toLowerCase().includes(keyword)
      );
    });
    
    this.setData({ 
      searchKeyword: keyword,
      filteredDepartments: filtered 
    });
  },

  // // 获取筛选后的科室列表
  // getFilteredDepartments() {
  //   const keyword = this.data.searchKeyword.toLowerCase()
  //   return this.data.departments.filter(item => {
  //     const desc = item.description || '';
  //     return (
  //       item.name.toLowerCase().includes(keyword) ||
  //       desc.toLowerCase().includes(keyword)
  //     );
  //   });
  // },

  // 下拉刷新
  onPullDownRefresh() {
    this.loadDepartments().finally(() => {
      wx.stopPullDownRefresh()
    })
  }
})