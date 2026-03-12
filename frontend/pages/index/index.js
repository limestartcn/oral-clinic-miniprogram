const app = getApp()
import { MENU_CONFIG } from '../../utils/menu-config'
const { 
  login, 
  getCode, 
  wechatLogin, 
  logout,
  getUserInfo,       // 新增
  updateUserInfo,    // 新增
  getAppointmentCount // 新增 
} = require('../../utils/api') // 确保路径正确
Page({
  data: {
    hasLogin: false,
    userInfo: {},
    requestCount: 0,
    requestTask: null,
    dynamicMenus: [],
    banners: [
      { imgUrl: '/images/banner1.png' },
      { imgUrl: '/images/banner2.png' },
      { imgUrl: '/images/banner3.png' }
    ],
    services: [
      { id: 1, name: '牙齿美白',/* price: 599,*/ thumbnail: '/images/service1.png' },
      { id: 2, name: '隐形矫正',/* price: 1999,*/ thumbnail: '/images/service2.png' },
      { id: 3, name: '儿童牙科',/* price: 399,*/ thumbnail: '/images/service3.png' },
      { id: 4, name: '种植牙',/* price: 2999,*/ thumbnail: '/images/service4.png' }
    ],
    roleMenus: {
      1: [{name: '预约记录', icon: 'appointment'}],     // 用户
      2: [                                             // 医生
        {name: '我的预约', icon: 'appointment', path: '/pages/doctor/appointments/index'}, // 新增
        {name: '患者管理', icon: 'patient'}
      ],
      3: [{name: '系统设置', icon: 'setting'}],        // 管理员
      4: [{name: '数据报表', icon: 'chart'}]           // 监管
    }
  },

  onLoad() {
    // ✅ 安全访问方式
    const eventBus = app.initEvent()
    
    // ✅ 使用具名函数保持引用
    this.handleLoginStatusChange = (status) => {
      this.setData({ hasLogin: status })
    }
    
    // ✅ 安全监听
    app.watchLoginStatus((status) => {
      this.setData({ hasLogin: status });
      if (status) {
        this.loadUserInfo();
      }
    });
  },

  onShow() {
    const { roleId } = app.globalData.userInfo
    this.setData({
      hasLogin: wx.getStorageSync('token') !== '',
      userInfo: wx.getStorageSync('userInfo') || {}
    })
    if (this.data.needRefresh) {
      this.loadData()
      this.setData({ needRefresh: false })
    }
  },

  onUnload() {
    // 新增事件监听
    app.eventBus.on('refresh-home', () => {
      this.loadData(true) // 强制刷新数据
    })
    // 中断请求并重置状态
    if (this.data.requestTask) {
      this.data.requestTask.abort()
      this.setData({ 
        requestTask: null,
        requestCount: Infinity
      })
    }
  },

  updateTabBar() {
    if (typeof this.getTabBar === 'function') {
      const tabBar = this.getTabBar()
      if (tabBar && tabBar.setData) {
        tabBar.setData({ selected: 0 })
      }
    }
  },

  async checkLoginStatus() {
    try {
      const token = wx.getStorageSync('token')
      if (!token) {
        this.clearLoginState()
        return
      }
      const res = await Promise.race([
        wx.$api.checkToken(),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('请求超时')), 5000)
      )])
      if (res.code === 200) {
        // 确保userInfo存在
        app.globalData.userInfo = app.globalData.userInfo || {}
        await app.initPermissions()
        
        this.setData({
          hasLogin: true,
          userInfo: {
            ...wx.getStorageSync('userInfo'),
            roleName: app.globalData.userInfo.roleName || '普通用户'
          }
        })
      }
    } catch (error) {
      this.clearLoginState()
    }
  },
  clearLoginState() {
    this.setData({ 
      hasLogin: false,
      userInfo: {}
    });
    app.globalData.hasLogin = false;
  },
  // 添加Token验证方法
  async verifyToken(token) {
    try {
      const res = await wx.request({
        url: 'http://localhost:8000/auth/check',
        header: {
          'Authorization': token
        }
      })
      return res.statusCode === 200
    } catch (error) {
      return false
    }
  },

  handleLogin() {
    wx.getUserProfile({
      desc: '用于完善会员资料',
      success: res => {
        wx.setStorageSync('userInfo', res.userInfo);
        this.setData({ hasLogin: true, userInfo: res.userInfo });
      }
    })
    wx.navigateTo({
      url: '/pages/auth/login/login' // 确保路径与app.json一致
    })
  },

  navigateToAppointment() {
    if (!this.data.hasLogin) {
      wx.showToast({ title: '请先登录', icon: 'none' });
      return;
    }
    // 跳转到预约流程第一步
    wx.navigateTo({ 
      url: '/pages/appointment/create/step1-department/index' 
    });
  },

  navigateToDepartmentList() {
    wx.navigateTo({ url: '/pages/department-list/index' });
  },

  navigateToProfile() {
    wx.navigateTo({ url: '/pages/profile/profile' });
  },

  navigateToRegister() {
    wx.navigateTo({ url: '/pages/register/register' });
  },
  // 返回时触发
  navigateToHome() {
    const pages = getCurrentPages()
    const homePage = pages.find(p => p.route === 'pages/index/index')
    if (homePage) {
      homePage.setData({ needRefresh: true })
    }
    wx.switchTab({ url: '/pages/index/index' })
  },
  showServiceDetail(e) {
    const { id } = e.currentTarget.dataset;
    wx.navigateTo({
      url: `/pages/service-detail/service-detail?id=${id}`
    });
  },
  async loadUserInfo() {
    try {
      const res = await getUserInfo() // 现在可正确调用
      this.setData({ 
        userInfo: res.data 
      })
      app.globalData.userInfo = res.data
    } catch (error) {
      console.error('获取用户信息失败:', error)
    }
  },
  // 添加状态监听方法
  onLoginStatusChange(status) {
    this.setData({ hasLogin: status });
    if (status) {
      this.loadUserInfo();
    }
  },
  handleLoginStatusChange(status) {
    this.setData({ hasLogin: status });
    if (status) {
      this.loadUserInfo();
    }
  },

  checkAuthBeforeNavigate() {
    // 添加双重验证
    const tokenValid = wx.getStorageSync('token') && this.data.hasLogin;
    const globalValid = app.globalData.hasLogin;
  
    if (tokenValid && globalValid) {
      this.navigateToProfile()
    } else {
      wx.showModal({
        title: '未登录',
        content: '需要登录后才能查看个人中心',
        confirmText: '去登录',
        cancelText: '再看看',
        success: (res) => {
          if (res.confirm) {
            wx.navigateTo({
              url: '/pages/auth/login/login'
            })
          }
        }
      })
    }
  },
  // 保持方法引用
  handleLoginStatus: function(status) {
    this.setData({ hasLogin: status })
    if (status) {
      this.loadUserInfo()
    }
  }.bind(this), // 使用bind固定this指向

  // 新增自定义更新方法
  updateLoginStatus() {
    this.checkLoginStatus();
    this.setData({ hasLogin: app.globalData.hasLogin });
  },
  navigateToProfile() {
    wx.navigateTo({
      url: '/pages/profile/profile'
    })
  },
  getRoleMenu() {
    const { roleId } = app.globalData.userInfo
    return this.data.roleMenus[roleId] || []
  }
})