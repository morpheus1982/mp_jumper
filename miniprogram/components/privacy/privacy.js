Component({
  data: {
    showPrivacy: false
  },

  lifetimes: {
    attached() {
      // 检查是否需要隐私授权
      if (wx.onNeedPrivacyAuthorization) {
        wx.onNeedPrivacyAuthorization((resolve, eventInfo) => {
          console.log('需要隐私授权:', eventInfo)
          this.setData({ showPrivacy: true })
          this.resolvePrivacyAuthorization = resolve
        })
      }
    }
  },

  methods: {
    handleDisagree() {
      this.setData({ showPrivacy: false })
      if (this.resolvePrivacyAuthorization) {
        this.resolvePrivacyAuthorization({ event: 'disagree' })
      }
    },

    handleAgree() {
      this.setData({ showPrivacy: false })
      if (this.resolvePrivacyAuthorization) {
        this.resolvePrivacyAuthorization({ event: 'agree', buttonId: 'agree-btn' })
      }
    }
  }
})
