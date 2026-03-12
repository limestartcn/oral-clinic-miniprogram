const app = getApp();
const { getChatSessions } = require('../../utils/api');

Page({
  data: {
    sessions: [] // 聊天会话列表
  },

  onLoad() {
    this.loadSessions();
  },

  // 加载会话列表
  async loadSessions() {
    try {
      console.log('[DEBUG] 开始加载会话列表');
      const res = await wx.$api.getChatSessions();
      console.log('[DEBUG] 接口响应:', res);
      
      if (res.code === 200) {
        this.setData({ sessions: res.data });
      } else {
        console.error('[ERROR] 接口返回异常:', res.msg);
        wx.showToast({ title: res.msg || '加载失败', icon: 'none' });
      }
    } catch (error) {
      console.error('[ERROR] 请求失败:', error); // 输出完整错误对象
      wx.showToast({ title: '网络异常', icon: 'none' });
    }
  },

  // 跳转到聊天界面
  navigateToChat(e) {
    const { conversationid, doctorid } = e.currentTarget.dataset;
    wx.navigateTo({
      url: `/pages/chat/index?conversationId=${conversationid}&doctorId=${doctorid}`
    });
  }
});