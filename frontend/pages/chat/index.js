const app = getApp();
const { getMessages, sendMessage, uploadImage, getDoctorInfo } = require('../../utils/api');

Page({
  data: {
    messages: [],        // 消息列表
    inputText: '',       // 输入框内容
    conversationid: null,// 当前会话ID
    doctorId: null,      // 医生ID（关键参数）
    userInfo: {},        // 用户信息
    doctorInfo: {},      // 医生信息
    isSending: false     // 防抖标记
  },

  onLoad(options) {
    if (!options.conversationId || !options.doctorId) {
      wx.showToast({ title: '参数错误', icon: 'error' });
      wx.navigateBack();
      return;
    }
    this.setData({
      conversationId: options.conversationId,
      doctorId: options.doctorId,
      userInfo: app.globalData.userInfo
    });

    // 并行加载医生信息和历史消息
    Promise.all([this.loadDoctorInfo(), this.loadHistory()])
      .then(() => this.startPolling())
      .catch(err => console.error('初始化失败:', err));
  },

  onUnload() {
    this.stopPolling();
  },
  
  stopPolling() {
    if (this.pollTimer) {
      clearTimeout(this.pollTimer);
      this.pollTimer = null;
    }
  },
  // 新增：处理输入框变化
  onInputChange(e) {
    this.setData({
      inputText: e.detail
    });
  },
  // 加载医生信息（不再依赖预约单）
  async loadDoctorInfo() {
    try {
      const res = await getDoctorInfo(this.data.doctorId);
      if (res.code === 200) {
        this.setData({ doctorInfo: res.data });
      }
    } catch (error) {
      wx.showToast({ title: '加载医生信息失败', icon: 'none' });
    }
  },

  // 轮询逻辑（基于会话ID）
  startPolling() {
    if (this.pollTimer || !this.data.conversationId) return;

    const poll = async () => {
      if (!this.__isPageActive) return;
      await this.loadHistory(false);
      this.pollTimer = setTimeout(poll, 3000);
    };

    poll();
  },

  // 加载历史消息（基于会话ID）
  async loadHistory(showLoading = true) {
    if (this.data.isLoading) return;
    this.setData({ isLoading: true });

    try {
      if (showLoading) wx.showLoading({ title: '加载中...' });

      const res = await getMessages({
        conversation_id: this.data.conversationId
      });

      if (res.code === 200 && Array.isArray(res.data)) {
        this.setData({
          messages: res.data.map(msg => ({
            ...msg,
            create_time: this.formatTime(msg.create_time)
          }))
        });

        // 滚动到底部
        wx.nextTick(() => {
          this.setData({ scrollTop: 999999 });
        });
      }
    } catch (error) {
      console.error('加载消息失败:', error);
    } finally {
      this.setData({ isLoading: false });
      if (showLoading) wx.hideLoading();
    }
  },

  // 时间格式化（保持原逻辑）
  formatTime(timestamp) {
    // 关键修复：兼容 iOS 日期格式
    const sanitizedTimestamp = timestamp.replace(' ', 'T');
    const date = new Date(sanitizedTimestamp);
    
    // 兜底处理：如果解析失败，使用当前时间
    if (isNaN(date)) {
      console.warn('日期解析失败，使用当前时间替代:', timestamp);
      date = new Date();
    }
  
    return `${date.getHours()}:${date.getMinutes().toString().padStart(2, '0')}`;
  },
  // 处理输入框回车事件
  handleTextConfirm(e) {
    this.sendMessage({ type: 1 }); // 明确指定文本类型
  },

  // 处理文本发送按钮点击
  handleTextClick() {
    this.sendMessage({ type: 1 }); // 明确指定文本类型
  },

  // 处理图片按钮点击
  handleImageClick() {
    this.chooseImage(); // 原有图片上传逻辑
  },
  // 发送消息（不再需要预约单号）
  async sendMessage({ type = 1, content = null }) {
    const { inputText, conversationId, doctorId, isSending } = this.data;
    if (isSending) return;

    try {
      this.setData({ isSending: true });
      wx.showLoading({ title: '发送中...', mask: true });

      const finalContent = content !== null ? 
      content : 
      (type === 1 ? inputText.trim() : '');
      
      // ========== 动态构造参数 ==========
      const payload = {
        type,
        content: finalContent, // ✅ 使用传入的 content 或输入框内容
        conversation_id: conversationId,
        doctor_id: doctorId
      };

      // 空内容校验（仅文本）
      if (type === 1 && !payload.content) {
        throw new Error('消息内容不能为空');
      }

      const res = await sendMessage(payload);
      if (res.code === 200) {
        this.setData({
          messages: [...this.data.messages, res.data],
          inputText: type === 1 ? '' : this.data.inputText
        });
      }
    } catch (error) {
      wx.showToast({ title: error.msg || error.message, icon: 'none' });
    } finally {
      wx.hideLoading();
      this.setData({ isSending: false });
    }
  },

  // 图片上传逻辑（保持原逻辑）
  async chooseImage() {
    wx.chooseImage({
      count: 1,
      sizeType: ['compressed'],
      sourceType: ['album', 'camera'],
      success: async (res) => {
        const tempFilePath = res.tempFilePaths[0];
        wx.showLoading({ title: '上传中...', mask: true });

        try {
          // 1. 上传图片
          console.log('[DEBUG] 开始上传图片，临时路径:', tempFilePath);
          const uploadRes = await uploadImage(tempFilePath);
          console.log('[DEBUG] 上传结果:', uploadRes);
          if (uploadRes.code !== 200 || !uploadRes.data?.url) {
            throw new Error('图片上传失败');
          }
          const { conversationId, doctorId } = this.data;
          // 2. 发送图片消息
          console.log('[DEBUG] 准备发送消息，参数:', {
            type: 2,
            content: uploadRes.data.url,
            conversationId,
            doctorId
          });
          await this.sendMessage({ 
            type: 2,
            content: uploadRes.data.url, // ✅ 明确传递图片 URL
            conversation_id: conversationId,
            doctor_id: doctorId
          });
          await this.loadHistory();
          console.log('[DEBUG] 图片消息发送成功');
        } catch (error) {
          console.error('[ERROR] 图片发送失败:', error);
          wx.showToast({ 
            title: error.message || '发送失败', 
            icon: 'none' 
          });
        } finally {
          wx.hideLoading();
        }
      }
    });
  },
  // 新增专用方法发送图片消息
  async sendImageMessage(imageUrl, conversationId, doctorId) {
    const payload = {
      type: 2, // 图片类型
      content: imageUrl,
      conversation_id: conversationId, // ✅ 字段名与后端一致
      doctor_id: doctorId             // ✅ 字段名与后端一致
    };

    const res = await sendMessage(payload);
    if (res.code !== 200) throw new Error(res.msg);
  }

});