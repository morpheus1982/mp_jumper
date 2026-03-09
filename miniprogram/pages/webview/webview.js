// 中转页地址
const REDIRECT_BASE_URL = 'https://512028.xyz/redirect.html'

Page({
  data: {
    webviewUrl: ''
  },

  onLoad(options) {
    // 获取目标链接
    const targetUrl = decodeURIComponent(options.t || '')

    if (!targetUrl) {
      wx.showToast({
        title: '缺少目标链接',
        icon: 'none'
      })
      setTimeout(() => {
        wx.navigateBack()
      }, 1500)
      return
    }

    // 构建 webview URL
    const webviewUrl = `${REDIRECT_BASE_URL}?t=${encodeURIComponent(targetUrl)}`

    console.log('WebView URL:', webviewUrl)

    this.setData({
      webviewUrl: webviewUrl
    })
  },

  /**
   * 接收 webview 消息
   */
  onMessage(e) {
    console.log('收到 webview 消息:', e.detail)
  },

  /**
   * webview 加载错误
   */
  onError(e) {
    console.error('WebView 加载错误:', e.detail)
    wx.showToast({
      title: '页面加载失败',
      icon: 'none'
    })
  }
})
