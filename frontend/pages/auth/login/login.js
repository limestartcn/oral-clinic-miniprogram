const app = getApp()
const { login, getCode, wechatLogin } = require('../../../utils/api')

Page({
  data: {
    codeText: '获取验证码',
    codeDisabled: false,
    loading: false
  },

  // 表单提交
  async formSubmit(e) {
    const { mobile, password, code } = e.detail.value
    if (!this.validateForm(mobile, password, code)) return

    this.setData({ loading: true })
    
    try {
      const res = await login({
        mobile,
        password,
        code
      });
    // 添加数据校验
    if (!res.data || !res.data.token) {
      throw new Error('接口返回数据格式异常');
    }
      // 存储数据
      const { token, userInfo } = res.data;

      wx.setStorageSync('token', token);
      wx.setStorageSync('userInfo', userInfo);
      // 更新全局状态
      app.globalData.userInfo = userInfo;
      app.globalData.hasLogin = true;
      app.updateLoginStatus(true);

      wx.showToast({
        title: '登录成功',
        icon: 'success',
        complete: () => {
          wx.navigateBack()
        }
      })

      wx.navigateBack({
        success: () => {
          const pages = getCurrentPages();
          if (pages.length > 0) {
            const prevPage = pages[pages.length - 1];
            prevPage.onShow();
          }
        }
      });
      this.handleLoginSuccess(res.data); // 调用统一处理方法
    } catch (error) {
      console.error('登录失败:', error)
      wx.showToast({
        title: error.message || '登录失败',
        icon: 'none'
      })
    } finally {
      this.setData({ loading: false })
    }
    
  },
  // 新增全局状态更新方法
  updateAllPages() {
    const pages = getCurrentPages();
    pages.forEach(page => {
      if (page.updateLoginStatus) {
        page.updateLoginStatus();
      }
    });
  },

  // 表单验证
  validateForm(mobile, password, code) {
    if (!/^1[3-9]\d{9}$/.test(mobile)) {
      wx.showToast({ title: '手机号格式错误', icon: 'none' })
      return false
    }
    if (password.length < 6 || password.length > 20) {
      wx.showToast({ title: '密码长度6-20位', icon: 'none' })
      return false
    }
    if (!/^\d{6}$/.test(code)) {
      wx.showToast({ title: '验证码格式错误', icon: 'none' })
      return false
    }
    return true
  },

  // 获取验证码
  getSmsCode() {
    if (this.data.codeDisabled) return; // 防止重复点击
  
    // 使用页面实例绑定 timer
    this.countDownTimer = setInterval(() => {
      if (this.data.count <= 0) {
        clearInterval(this.countDownTimer);
        this.setData({ 
          codeText: '重新获取',
          codeDisabled: false,
          count: 60
        });
        return;
      }
      this.setData({
        codeText: `${this.data.count}s后重发`,
        count: this.data.count - 1
      });
    }, 1000);
  
    // 初始化倒计时状态
    this.setData({
      codeDisabled: true,
      count: 60
    });
  },

  // 微信登录
  async wechatLogin() {
    try {
      const { code } = await wx.login()
      const res = await wechatLogin({ code })
      // 添加数据结构校验
      if (!res.data || !res.data.token) {
        throw new Error('微信登录返回数据异常');
      }
      wx.setStorageSync('token', res.token)
      app.globalData.userInfo = res.userInfo
      
      wx.showToast({
        title: '登录成功',
        icon: 'success',
        complete: () => {
          wx.navigateBack()
        }
      })
      this.handleLoginSuccess(res.data);
    } catch (error) {
      console.error('微信登录失败:', error);
      wx.showToast({
        title: error.message || '微信登录失败',
        icon: 'none'
      });
    }
    
  },
  async handleLoginSuccess(res) {
    try {
      // 1. 基础数据校验
      if (!res || (!res.data && !res.token)) {
        throw new Error('登录响应数据格式错误');
      }

      // 2. 统一数据结构（兼容不同接口返回格式）
      const data = res.data || res;
      const requiredFields = ['token', 'userInfo'];
      requiredFields.forEach(field => {
        if (!data[field]) {
          throw new Error(`接口返回缺少必要字段: ${field}`);
        }
      });

      // 3. 存储基础数据（增强容错处理）
      const safeUserInfo = {
        ...(data.userInfo || {}),
        roleId: data.roleId || 1,          // 默认普通用户
        roleName: data.roleName || '普通用户',
        permissions: data.permissions || []
      };

      wx.setStorageSync('token', data.token);
      wx.setStorageSync('userInfo', safeUserInfo);

      // 4. 更新全局状态（包含管理员标识）
      app.globalData.userInfo = {
        ...safeUserInfo,
        isAdmin: (data.roleId === 3)       // 管理员角色ID为3
      };
      app.globalData.hasLogin = true;
      app.updateLoginStatus(true);

      // 5. 初始化权限（必须等待完成）
      await app.initPermissions();

      // 6. 获取页面栈分析跳转来源
      const pages = getCurrentPages();
      const currentPage = pages[pages.length - 1];
      
      // 7. 检查预约意图（从本地存储获取）
      const pendingAction = wx.getStorageSync('pendingAction');
      
      // 8. 决定跳转策略
      if (pendingAction === 'createAppointment') {
        // 场景1: 从预约流程触发的登录
        wx.removeStorageSync('pendingAction');
        wx.redirectTo({
          url: '/pages/appointment/create/step1-department/index'
        });
      } else if (pages.length > 1) {
        // 场景2: 从需要登录的页面跳转过来
        wx.navigateBack({
          delta: 1,
          success: () => {
            const prevPage = pages[pages.length - 2];
            if (prevPage.onShow) prevPage.onShow();
          }
        });
      } else {
        // 场景3: 直接打开登录页的情况
        wx.switchTab({ url: '/pages/index/index' });
      }

      // 9. 统一成功提示
      wx.showToast({
        title: '登录成功',
        icon: 'success',
        duration: 1500
      });

    } catch (error) {
      // 10. 异常处理（包含错误日志）
      console.error('登录处理失败:', error);
      wx.showToast({
        title: error.message || '登录处理异常',
        icon: 'none',
        duration: 2000
      });

      // 11. 状态回滚
      this.clearLoginState();
    }
  }
})