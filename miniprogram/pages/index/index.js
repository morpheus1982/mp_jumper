const Base64 = require('../../utils/base64')

Page({
  data: {
    loading: true,
    error: false,
    errorMessage: '',
    targetUrl: ''
  },

  onLoad(options) {
    this.processScene(options)
  },

  /**
   * 处理 scene 参数
   */
  processScene(options) {
    try {
      // 1. 获取 scene 参数
      let scene = options.scene || ''

      // 处理二维码扫码进入的情况（需要 decodeURIComponent）
      if (scene) {
        scene = decodeURIComponent(scene)
      }

      // 2. 如果没有 scene，显示错误
      if (!scene) {
        this.showError('缺少链接参数')
        return
      }

      // 3. Base64 解码
      const targetUrl = Base64.decode(scene)

      console.log('解码后的目标链接:', targetUrl)

      // 4. 校验链接格式
      if (!this.isValidUrl(targetUrl)) {
        this.showError('链接格式错误')
        return
      }

      // 5. 保存目标链接并跳转到 webview
      this.setData({
        targetUrl: targetUrl
      })

      // 6. 跳转到 webview 页面
      wx.navigateTo({
        url: `/pages/webview/webview?t=${encodeURIComponent(targetUrl)}`,
        fail: (err) => {
          console.error('跳转失败:', err)
          this.showError('页面跳转失败')
        }
      })

    } catch (err) {
      console.error('处理参数失败:', err)
      this.showError('参数解析失败')
    }
  },

  /**
   * 校验 URL 格式
   */
  isValidUrl(url) {
    if (!url || typeof url !== 'string') {
      return false
    }
    return url.startsWith('http://') || url.startsWith('https://')
  },

  /**
   * 显示错误信息
   */
  showError(message) {
    this.setData({
      loading: false,
      error: true,
      errorMessage: message
    })
  },

  /**
   * 重试按钮点击
   */
  onRetry() {
    if (this.data.targetUrl) {
      wx.navigateTo({
        url: `/pages/webview/webview?t=${encodeURIComponent(this.data.targetUrl)}`
      })
    }
  }
})
