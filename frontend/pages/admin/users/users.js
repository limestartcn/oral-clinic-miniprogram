import { checkPermission } from '../../utils/router'

Page({
  onLoad() {
    if (!checkPermission(PERMISSIONS.MANAGE_USERS)) {
      wx.showToast({ title: '无访问权限', icon: 'none' })
      wx.navigateBack()
    }
  }
})