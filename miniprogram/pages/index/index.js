const api = require('../../utils/api')

Page({
  data: {
    state: 'loading',      // loading | preview | empty | exists | result | error
    articleUrl: '',
    articleTitle: '',
    result: null,
    errorMessage: ''
  },

  onLoad() {
    // 页面加载时不处理，等 onShow
  },

  onShow() {
    this.autoReadClipboard()
  },

  /**
   * 自动读取剪贴板
   */
  autoReadClipboard() {
    this.setData({ state: 'loading' })

    wx.getClipboardData({
      success: (res) => {
        const text = res.data.trim()
        if (this.isValidUrl(text)) {
          this.previewArticle(text)
        } else {
          this.setData({ state: 'empty' })
        }
      },
      fail: () => {
        this.setData({ state: 'empty' })
      }
    })
  },

  /**
   * 校验 URL 格式
   */
  isValidUrl(url) {
    if (!url || typeof url !== 'string') return false
    return url.startsWith('http://') || url.startsWith('https://')
  },

  /**
   * 预览文章
   */
  previewArticle(url) {
    this.setData({ state: 'loading' })

    api.previewArticle(url)
      .then((res) => {
        if (res.status_code === 0 && res.data) {
          this.setData({
            state: res.data.exists ? 'exists' : 'preview',
            articleUrl: res.data.article_url,
            articleTitle: res.data.article_title
          })
        } else if (res.status_code === 1001) {
          // URL 已存在
          this.setData({
            state: 'exists',
            articleUrl: url,
            articleTitle: res.data?.article_title || ''
          })
        } else {
          this.setData({
            state: 'error',
            errorMessage: res.status_msg || '获取文章信息失败'
          })
        }
      })
      .catch((err) => {
        this.setData({
          state: 'error',
          errorMessage: err.message || '网络请求失败'
        })
      })
  },

  /**
   * 粘贴按钮点击
   */
  onPaste() {
    wx.getClipboardData({
      success: (res) => {
        const text = res.data.trim()
        if (this.isValidUrl(text)) {
          this.previewArticle(text)
        } else {
          wx.showToast({
            title: '剪贴板不是有效链接',
            icon: 'none'
          })
        }
      },
      fail: () => {
        wx.showToast({
          title: '读取剪贴板失败',
          icon: 'none'
        })
      }
    })
  },

  /**
   * 添加按钮点击
   */
  onAdd() {
    const { articleUrl } = this.data

    wx.showLoading({ title: '添加中...' })

    api.insertArticle(articleUrl)
      .then((res) => {
        wx.hideLoading()

        if (res.status_code === 0) {
          this.setData({
            state: 'result',
            result: res.data
          })
        } else {
          wx.showToast({
            title: res.status_msg || '添加失败',
            icon: 'none'
          })
        }
      })
      .catch((err) => {
        wx.hideLoading()
        wx.showToast({
          title: err.message || '网络请求失败',
          icon: 'none'
        })
      })
  },

  /**
   * 继续添加 / 粘贴新链接
   */
  onContinue() {
    this.autoReadClipboard()
  }
})
