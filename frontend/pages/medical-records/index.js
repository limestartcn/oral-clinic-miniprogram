// pages/medical-records/index.js
const app = getApp()
const { getMedicalRecords } = require('../../utils/api')

Page({
  data: {
    records: [],          // 病例记录列表
    currentRecord: null,  // 当前查看的病例详情
    showDetail: false,    // 是否显示详情弹窗
    loading: true,       // 加载状态
    error: null          // 错误信息
  },

  onLoad() {
    this.loadMedicalRecords()
  },

  // 加载健康档案数据
  async loadMedicalRecords() {
    try {
      const res = await getMedicalRecords()
      if (res.code === 200) {
        this.setData({
          records: this.processRecords(res.data),
          loading: false
        })
      } else {
        this.handleError('数据加载失败，请稍后重试')
      }
    } catch (error) {
      console.error('接口请求失败:', error)
      this.handleError('网络请求失败，请检查网络连接')
    }
  },

  // 处理病例数据格式
  processRecords(records) {
    return records.map(record => ({
      ...record,
      create_time: this.formatDate(record.create_time),
      attachments: this.parseAttachments(record.attachments),
      formattedPrescription: this.formatPrescription(record.prescription)
    }))
  },

  // 日期格式化
  formatDate(dateStr) {
    const date = new Date(dateStr)
    const year = date.getFullYear()
    const month = (date.getMonth() + 1).toString().padStart(2, '0')
    const day = date.getDate().toString().padStart(2, '0')
    return `${year}-${month}-${day}`
  },

  // 格式化处方信息
  formatPrescription(prescription) {
    if (!prescription) return null;
    
    // 如果已经是对象直接返回
    if (typeof prescription === 'object') {
      return {
        followUp: prescription.follow_up,
        medications: prescription.medications?.map(m => ({
          name: m.name,
          usage: `${m.usage}（${m.dosage || m.concentration}）`
        })) || []
      };
    }
  
    // 仅当是字符串时尝试解析
    try {
      const parsed = JSON.parse(prescription);
      return {
        followUp: parsed.follow_up,
        medications: parsed.medications?.map(m => ({
          name: m.name,
          usage: `${m.usage}（${m.dosage || m.concentration}）`
        })) || []
      };
    } catch (e) {
      console.warn('处方数据解析失败:', e);
      return null;
    }
  },

  // 解析附件数据
  parseAttachments(attachments) {
    try {
      const parsed = JSON.parse(attachments)
      return parsed.map(url => ({
        url,
        type: url.match(/\.(pdf|jpg|jpeg|png)$/i)?.[1] || 'unknown'
      }))
    } catch (e) {
      return []
    }
  },

  // 查看详情
  onViewDetail(e) {
    const { id } = e.currentTarget.dataset;
    const record = this.data.records.find(r => r.id === id);
    if (record) {
      this.setData({ currentRecord: record, showDetail: true });
    }
  },

  // 关闭详情弹窗
  onCloseDetail() {
    this.setData({ showDetail: false })
  },

  // 预览附件
  onPreviewAttachment(e) {
    const { index } = e.currentTarget.dataset
    const attachments = this.data.currentRecord.attachments
    const current = attachments[index].url
    
    if (attachments[index].type === 'pdf') {
      wx.showModal({
        title: 'PDF文件预览',
        content: '当前文件格式需要下载查看，是否继续？',
        success(res) {
          if (res.confirm) {
            wx.downloadFile({
              url: current,
              success: res => {
                wx.openDocument({
                  filePath: res.tempFilePath
                })
              }
            })
          }
        }
      })
    } else {
      wx.previewImage({
        urls: attachments.map(a => a.url),
        current
      })
    }
  },

  // 错误处理
  handleError(msg) {
    this.setData({
      loading: false,
      error: msg
    })
  },

  // 重新加载
  onRetry() {
    this.setData({ loading: true, error: null })
    this.loadMedicalRecords()
  }
})