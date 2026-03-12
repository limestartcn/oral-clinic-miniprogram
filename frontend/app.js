// app.js
import * as api from './utils/api' // 确保路径正确
App({
  onLaunch() {
    wx.$api = api
    // 初始化时加载本地存储
    const token = wx.getStorageSync('token')
    const userInfo = wx.getStorageSync('userInfo')
    
    if (token && userInfo) {
      this.globalData.userInfo = {
        ...userInfo,
        roleId: userInfo.roleId || 1,
        roleName: userInfo.roleName || '普通用户'
      }
      // 异步初始化权限
      this.initPermissions().catch(err => {
        console.error('权限初始化失败:', err);
      });
    }
  },
  globalData: {
    userInfo: {
      roleId: null,      // 角色ID
      roleName: '',      // 新增角色名称
      permissions: [],   // 权限代码列表
      isAdmin: false     // 管理员标识
    },
    token: null,
    hasLogin: wx.getStorageSync('token') ? true : false,
    userInfo: wx.getStorageSync('userInfo') || {}
  },

  // 初始化权限
  initPermissions() {
    return new Promise((resolve) => {
      wx.request({
        url: 'http://localhost:8000/user/permissions', // 确保路径正确
        header: { 'Authorization': wx.getStorageSync('token') },
        success: (res) => {
          if (res.data.code === 200) {
            const data = res.data.data;
            this.globalData.userInfo = {
              ...this.globalData.userInfo,
              roleId: data.roleId,
              roleName: data.roleName,
              permissions: data.permissions,
              isAdmin: data.roleId === 3
            }
            resolve(true);
          }
        },
        fail: (err) => {
          console.error('权限初始化失败:', err);
          resolve(false);
        }
      });
    });
  },

  watchers: [],
  // 新增状态监听器
  loginStatusWatchers: [],
  watchLoginStatus(callback) {
    this.loginStatusWatchers.push(callback);
  },
  
  updateLoginStatus(status) {
    this.globalData.hasLogin = status;
    
    // 同步更新所有监听器
    this.loginStatusWatchers.forEach(cb => {
      try {
        cb(status);
      } catch (e) {
        console.error('状态更新错误:', e);
      }
    });
  
    // 触发事件总线
    this.eventBus.emit('loginStatusChange', status);
  },

  checkLogin() {
    return new Promise((resolve) => {
      if (this.globalData.userInfo && this.globalData.token) {
        resolve(true)
      } else {
        const token = wx.getStorageSync('token')
        const userInfo = wx.getStorageSync('userInfo')
        if (token && userInfo) {
          this.globalData.userInfo = userInfo
          this.globalData.token = token
          resolve(true)
        } else {
          resolve(false)
        }
      }
    })
  },
  
  // 完整事件系统
  _events: new Map(),

  on(event, callback) {
    if (!this._events.has(event)) {
      this._events.set(event, new Set())
    }
    this._events.get(event).add(callback)
  },

  off(event, callback) {
    if (this._events.has(event)) {
      const callbacks = this._events.get(event)
      callbacks.delete(callback)
      if (callbacks.size === 0) {
        this._events.delete(event)
      }
    }
  },
  // 初始化事件系统
  initEvent() {
    if (!this.eventBus) {
      this.eventBus = {
        events: new Map(),
        on(event, callback) {
          const handlers = this.events.get(event) || []
          handlers.push(callback)
          this.events.set(event, handlers)
        },
        off(event, callback) {
          const handlers = this.events.get(event);
          if (handlers) {
            this.events.set(
              event,
              handlers.filter(handler => handler !== callback)
            );
          }
        },
        emit(event, ...args) {
          const handlers = this.events.get(event) || []
          handlers.forEach(handler => handler(...args))
        }
      }
    }
    return this.eventBus
  },
  emit(event, data) {
    if (this._events.has(event)) {
      this._events.get(event).forEach(cb => {
        try {
          cb(data)
        } catch (e) {
          console.error(`Event ${event} handler error:`, e)
        }
      })
    }
  }
})
