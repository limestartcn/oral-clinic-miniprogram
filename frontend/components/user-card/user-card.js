Component({
  properties: {
    userInfo: {
      type: Object,
      value: {}
    }
  },

  methods: {
    // 预览头像
    previewAvatar() {
      const url = this.properties.userInfo.avatar || '/images/default-avatar.png'
      wx.previewImage({ urls: [url] })
    },

    // 触发修改昵称
    onEditNickname() {
      this.triggerEvent('editNickname')
    },

    // 触发绑定手机
    onBindMobile() {
      this.triggerEvent('bindMobile')
    }
  }
})