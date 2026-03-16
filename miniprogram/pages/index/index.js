const api = require('../../utils/api')

Page({
  data: {
    state: 'input',        // input | loading | preview | exists | result | error
    inputUrl: '',          // 用户输入的 URL
    inputFocus: false,     // 输入框焦点
    articleUrl: '',
    articleTitle: '',
    result: null,
    errorMessage: ''
  },

  // 隐私授权相关
  privacyResolve: null,
  needPrivacy: false,

  onLoad() {
    // 页面加载时不处理
  },

  onShow() {
    // 每次显示页面时自动粘贴
    this._tryReadClipboard()
  },

  /**
   * 输入框内容变化
   */
  onInputChange(e) {
    this.setData({
      inputUrl: e.detail.value.trim()
    })
  },

  /**
   * 点击粘贴按钮 - 刷新剪贴板内容
   */
  onPasteClick() {
    this._tryReadClipboard()
  },

  /**
   * 尝试读取剪贴板（检查隐私授权）
   */
  _tryReadClipboard() {
    if (wx.getPrivacySetting) {
      wx.getPrivacySetting({
        success: (res) => {
          if (res.needAuthorization) {
            // 需要授权，显示隐私弹窗
            this.setData({ showPrivacy: true })
          } else {
            // 已授权，直接读取
            this._readClipboard()
          }
        },
        fail: () => {
          this._readClipboard()
        }
      })
    } else {
      this._readClipboard()
    }
  },

  /**
   * 隐私协议同意
   */
  onPrivacyAgree() {
    this.setData({ showPrivacy: false })
    this._readClipboard()
  },

  /**
   * 隐私协议拒绝
   */
  onPrivacyDisagree() {
    this.setData({ showPrivacy: false })
  },

  /**
   * 读取剪贴板内容
   */
  _readClipboard() {
    wx.getClipboardData({
      success: (res) => {
        const text = res.data.trim()
        if (text) {
          this.setData({ inputUrl: text })
          // 成功读取后自动获取标题
          this._autoFetchTitle(text)
        }
      },
      fail: (err) => {
        console.error('读取剪贴板失败:', err)
      }
    })
  },

  /**
   * 自动获取标题（如果内容是有效URL）
   */
  _autoFetchTitle(text) {
    // 检查是否是有效URL
    if (this.isValidUrl(text)) {
      // 延迟一点执行，让用户看到URL已填入
      setTimeout(() => {
        this.previewArticle(text)
      }, 300)
    }
  },

  /**
   * 从文本中提取 URL
   */
  extractUrl(text) {
    if (!text || typeof text !== 'string') return null

    // 直接是 URL
    if (this.isValidUrl(text)) {
      return text
    }

    // 尝试从文本中匹配 URL
    const urlPattern = /(https?:\/\/[^\s<>"{}|\\^`\[\]]+)/gi
    const match = text.match(urlPattern)
    if (match && match.length > 0) {
      return match[0]
    }

    return null
  },

  /**
   * 校验 URL 格式
   */
  isValidUrl(url) {
    if (!url || typeof url !== 'string') return false
    return url.startsWith('http://') || url.startsWith('https://')
  },

  /**
   * 获取标题按钮点击
   */
  onFetchTitle() {
    const { inputUrl } = this.data

    if (!inputUrl) {
      wx.showToast({
        title: '请输入文章链接',
        icon: 'none'
      })
      return
    }

    if (!this.isValidUrl(inputUrl)) {
      wx.showToast({
        title: '请输入有效的链接',
        icon: 'none'
      })
      return
    }

    this.previewArticle(inputUrl)
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
            articleTitle: res.data.article_title,
            inputUrl: res.data.article_url
          })
        } else if (res.status_code === 1001) {
          // URL 已存在
          this.setData({
            state: 'exists',
            articleUrl: url,
            articleTitle: res.data?.article_title || '',
            inputUrl: url
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
   * 继续添加 / 重新输入
   */
  onContinue() {
    this.setData({
      state: 'input',
      inputUrl: '',
      articleUrl: '',
      articleTitle: '',
      result: null,
      errorMessage: ''
    })
  },

  /**
   * 重新输入（从预览/存在状态返回）
   */
  onReInput() {
    this.setData({
      state: 'input'
    })
  }
})
