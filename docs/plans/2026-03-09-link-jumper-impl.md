# 小程序链接跳转器 Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 构建一个微信小程序链接跳转器，通过小程序包装外网链接，实现从微信内部跳转到外部浏览器。

**Architecture:** 小程序负责解析 Base64 编码的 scene 参数并加载 webview，H5 中转页负责域名白名单校验和跳转逻辑。白名单配置存储在 JSON 文件中，更新白名单无需修改小程序代码。

**Tech Stack:** 微信小程序原生开发、HTML/CSS/JavaScript、静态文件部署

---

## Task 1: 初始化小程序项目结构

**Files:**
- Create: `miniprogram/app.js`
- Create: `miniprogram/app.json`
- Create: `miniprogram/app.wxss`
- Create: `miniprogram/project.config.json`
- Create: `miniprogram/sitemap.json`

**Step 1: 创建项目配置文件**

`miniprogram/project.config.json`:
```json
{
  "miniprogramRoot": "./",
  "projectname": "mp-jumper",
  "description": "链接跳转小程序",
  "appid": "请填写你的AppID",
  "setting": {
    "urlCheck": true,
    "es6": true,
    "enhance": true,
    "postcss": true,
    "preloadBackgroundData": false,
    "minified": true,
    "newFeature": true,
    "coverView": true,
    "nodeModules": false,
    "autoAudits": false,
    "showShadowRootInWxmlPanel": true,
    "scopeDataCheck": false,
    "uglifyFileName": false,
    "checkInvalidKey": true,
    "checkSiteMap": true,
    "uploadWithSourceMap": true,
    "compileHotReLoad": false,
    "useMultiFrameRuntime": true,
    "useApiHook": true,
    "useApiHostProcess": true,
    "babelSetting": {
      "ignore": [],
      "disablePlugins": [],
      "outputPath": ""
    },
    "bundle": false,
    "useIsolateContext": true,
    "useCompilerModule": true,
    "userConfirmedUseCompilerModuleSwitch": false,
    "userConfirmedBundleSwitch": false,
    "packNpmManually": false,
    "packNpmRelationList": [],
    "minifyWXSS": true
  },
  "compileType": "miniprogram",
  "libVersion": "3.3.4",
  "condition": {}
}
```

**Step 2: 创建小程序全局配置**

`miniprogram/app.json`:
```json
{
  "pages": [
    "pages/index/index",
    "pages/webview/webview"
  ],
  "window": {
    "navigationBarTitleText": "链接跳转",
    "navigationBarBackgroundColor": "#ffffff",
    "navigationBarTextStyle": "black",
    "backgroundColor": "#f5f5f5",
    "backgroundTextStyle": "dark"
  },
  "style": "v2",
  "sitemapLocation": "sitemap.json"
}
```

**Step 3: 创建应用入口**

`miniprogram/app.js`:
```javascript
App({
  onLaunch() {
    // 小程序启动时执行
    console.log('小程序启动')
  },

  globalData: {
    // 全局数据
  }
})
```

**Step 4: 创建全局样式**

`miniprogram/app.wxss`:
```css
/* 全局样式 */
page {
  background-color: #f5f5f5;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  font-size: 14px;
  color: #333;
}

.container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  padding: 20px;
  box-sizing: border-box;
}
```

**Step 5: 创建 sitemap 配置**

`miniprogram/sitemap.json`:
```json
{
  "desc": "关于本文件的更多信息，请参考文档 https://developers.weixin.qq.com/miniprogram/dev/framework/sitemap.html",
  "rules": [
    {
      "action": "allow",
      "page": "*"
    }
  ]
}
```

**Step 6: 提交**

```bash
git add miniprogram/
git commit -m "feat: 初始化小程序项目结构"
```

---

## Task 2: 创建 Base64 工具函数

**Files:**
- Create: `miniprogram/utils/base64.js`

**Step 1: 创建 Base64 编解码工具**

`miniprogram/utils/base64.js`:
```javascript
/**
 * Base64 编解码工具
 * 兼容小程序环境
 */

const CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'

/**
 * Base64 解码
 * @param {string} input Base64 编码字符串
 * @returns {string} 解码后的字符串
 */
function decode(input) {
  if (!input) return ''

  // 移除无效字符
  input = input.replace(/[^A-Za-z0-9\+\/\=]/g, '')

  let output = ''
  let i = 0

  while (i < input.length) {
    const enc1 = CHARS.indexOf(input.charAt(i++))
    const enc2 = CHARS.indexOf(input.charAt(i++))
    const enc3 = CHARS.indexOf(input.charAt(i++))
    const enc4 = CHARS.indexOf(input.charAt(i++))

    const chr1 = (enc1 << 2) | (enc2 >> 4)
    const chr2 = ((enc2 & 15) << 4) | (enc3 >> 2)
    const chr3 = ((enc3 & 3) << 6) | enc4

    output += String.fromCharCode(chr1)

    if (enc3 !== 64) {
      output += String.fromCharCode(chr2)
    }
    if (enc4 !== 64) {
      output += String.fromCharCode(chr3)
    }
  }

  return utf8Decode(output)
}

/**
 * Base64 编码
 * @param {string} input 原始字符串
 * @returns {string} Base64 编码字符串
 */
function encode(input) {
  if (!input) return ''

  input = utf8Encode(input)
  let output = ''
  let i = 0

  while (i < input.length) {
    const chr1 = input.charCodeAt(i++)
    const chr2 = input.charCodeAt(i++)
    const chr3 = input.charCodeAt(i++)

    const enc1 = chr1 >> 2
    const enc2 = ((chr1 & 3) << 4) | (chr2 >> 4)
    let enc3 = ((chr2 & 15) << 2) | (chr3 >> 6)
    let enc4 = chr3 & 63

    if (isNaN(chr2)) {
      enc3 = enc4 = 64
    } else if (isNaN(chr3)) {
      enc4 = 64
    }

    output += CHARS.charAt(enc1) + CHARS.charAt(enc2) + CHARS.charAt(enc3) + CHARS.charAt(enc4)
  }

  return output
}

/**
 * UTF-8 解码
 */
function utf8Decode(utftext) {
  let string = ''
  let i = 0
  let c = 0
  let c2 = 0
  let c3 = 0

  while (i < utftext.length) {
    c = utftext.charCodeAt(i)

    if (c < 128) {
      string += String.fromCharCode(c)
      i++
    } else if ((c > 191) && (c < 224)) {
      c2 = utftext.charCodeAt(i + 1)
      string += String.fromCharCode(((c & 31) << 6) | (c2 & 63))
      i += 2
    } else {
      c2 = utftext.charCodeAt(i + 1)
      c3 = utftext.charCodeAt(i + 2)
      string += String.fromCharCode(((c & 15) << 12) | ((c2 & 63) << 6) | (c3 & 63))
      i += 3
    }
  }

  return string
}

/**
 * UTF-8 编码
 */
function utf8Encode(string) {
  string = string.replace(/\r\n/g, '\n')
  let utftext = ''

  for (let n = 0; n < string.length; n++) {
    const c = string.charCodeAt(n)

    if (c < 128) {
      utftext += String.fromCharCode(c)
    } else if ((c > 127) && (c < 2048)) {
      utftext += String.fromCharCode((c >> 6) | 192)
      utftext += String.fromCharCode((c & 63) | 128)
    } else {
      utftext += String.fromCharCode((c >> 12) | 224)
      utftext += String.fromCharCode(((c >> 6) & 63) | 128)
      utftext += String.fromCharCode((c & 63) | 128)
    }
  }

  return utftext
}

module.exports = {
  encode,
  decode
}
```

**Step 2: 提交**

```bash
git add miniprogram/utils/
git commit -m "feat: 添加 Base64 编解码工具"
```

---

## Task 3: 创建入口页面

**Files:**
- Create: `miniprogram/pages/index/index.js`
- Create: `miniprogram/pages/index/index.json`
- Create: `miniprogram/pages/index/index.wxml`
- Create: `miniprogram/pages/index/index.wxss`

**Step 1: 创建页面配置**

`miniprogram/pages/index/index.json`:
```json
{
  "navigationBarTitleText": "链接跳转",
  "usingComponents": {}
}
```

**Step 2: 创建页面模板**

`miniprogram/pages/index/index.wxml`:
```xml
<view class="container">
  <!-- 加载中状态 -->
  <view wx:if="{{loading}}" class="loading-container">
    <view class="loading-spinner"></view>
    <text class="loading-text">正在跳转...</text>
  </view>

  <!-- 错误状态 -->
  <view wx:if="{{error}}" class="error-container">
    <view class="error-icon">❌</view>
    <text class="error-text">{{errorMessage}}</text>
    <button class="retry-btn" bindtap="onRetry" wx:if="{{targetUrl}}">重试</button>
  </view>
</view>
```

**Step 3: 创建页面样式**

`miniprogram/pages/index/index.wxss`:
```css
.container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  padding: 40rpx;
  box-sizing: border-box;
}

/* 加载状态 */
.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 30rpx;
}

.loading-spinner {
  width: 80rpx;
  height: 80rpx;
  border: 6rpx solid #e0e0e0;
  border-top-color: #07c160;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.loading-text {
  font-size: 32rpx;
  color: #666;
}

/* 错误状态 */
.error-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 30rpx;
  text-align: center;
}

.error-icon {
  font-size: 100rpx;
}

.error-text {
  font-size: 32rpx;
  color: #666;
  max-width: 80%;
}

.retry-btn {
  margin-top: 20rpx;
  background-color: #07c160;
  color: #fff;
  font-size: 32rpx;
  padding: 20rpx 60rpx;
  border-radius: 8rpx;
  border: none;
}

.retry-btn::after {
  border: none;
}
```

**Step 4: 创建页面逻辑**

`miniprogram/pages/index/index.js`:
```javascript
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
```

**Step 5: 提交**

```bash
git add miniprogram/pages/index/
git commit -m "feat: 添加小程序入口页面"
```

---

## Task 4: 创建 WebView 容器页面

**Files:**
- Create: `miniprogram/pages/webview/webview.js`
- Create: `miniprogram/pages/webview/webview.json`
- Create: `miniprogram/pages/webview/webview.wxml`
- Create: `miniprogram/pages/webview/webview.wxss`

**Step 1: 创建页面配置**

`miniprogram/pages/webview/webview.json`:
```json
{
  "navigationBarTitleText": "正在跳转",
  "usingComponents": {}
}
```

**Step 2: 创建页面模板**

`miniprogram/pages/webview/webview.wxml`:
```xml
<web-view src="{{webviewUrl}}" bindmessage="onMessage" binderror="onError"></web-view>
```

**Step 3: 创建页面样式**

`miniprogram/pages/webview/webview.wxss`:
```css
/* webview 页面样式 */
page {
  height: 100%;
}
```

**Step 4: 创建页面逻辑**

`miniprogram/pages/webview/webview.js`:
```javascript
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
```

**Step 5: 提交**

```bash
git add miniprogram/pages/webview/
git commit -m "feat: 添加 WebView 容器页面"
```

---

## Task 5: 创建 H5 中转页 - 白名单配置

**Files:**
- Create: `h5/whitelist.json`

**Step 1: 创建白名单配置文件**

`h5/whitelist.json`:
```json
[
  "pan.quark.cn",
  "pan.baidu.com",
  "www.aliyundrive.com",
  "www.lanzou.com",
  "pan.lanzou.com"
]
```

**Step 2: 提交**

```bash
git add h5/whitelist.json
git commit -m "feat: 添加域名白名单配置"
```

---

## Task 6: 创建 H5 中转页 - 主页面

**Files:**
- Create: `h5/redirect.html`

**Step 1: 创建中转页 HTML**

使用 **@frontend-design** 技能设计高质量 UI。

`h5/redirect.html`:
```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <title>链接跳转</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    :root {
      --primary-color: #07c160;
      --error-color: #fa5151;
      --text-primary: #1a1a1a;
      --text-secondary: #666666;
      --bg-color: #f5f5f5;
      --card-bg: #ffffff;
    }

    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      background-color: var(--bg-color);
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }

    .container {
      width: 100%;
      max-width: 400px;
    }

    .card {
      background: var(--card-bg);
      border-radius: 16px;
      padding: 40px 24px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
      text-align: center;
    }

    /* 加载状态 */
    .loading-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 24px;
    }

    .spinner {
      width: 56px;
      height: 56px;
      border: 4px solid #e0e0e0;
      border-top-color: var(--primary-color);
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    .loading-text {
      font-size: 18px;
      color: var(--text-secondary);
    }

    /* 错误状态 */
    .error-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 20px;
    }

    .error-icon {
      width: 72px;
      height: 72px;
      background: #fff2f0;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .error-icon svg {
      width: 36px;
      height: 36px;
      color: var(--error-color);
    }

    .error-title {
      font-size: 20px;
      font-weight: 600;
      color: var(--text-primary);
    }

    .error-message {
      font-size: 15px;
      color: var(--text-secondary);
      line-height: 1.5;
    }

    /* 成功状态 - 显示按钮 */
    .success-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 20px;
    }

    .success-icon {
      width: 72px;
      height: 72px;
      background: #e8f7ed;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .success-icon svg {
      width: 36px;
      height: 36px;
      color: var(--primary-color);
    }

    .success-title {
      font-size: 20px;
      font-weight: 600;
      color: var(--text-primary);
    }

    .success-message {
      font-size: 15px;
      color: var(--text-secondary);
      line-height: 1.5;
    }

    .target-url {
      background: var(--bg-color);
      border-radius: 8px;
      padding: 12px 16px;
      font-size: 13px;
      color: var(--text-secondary);
      word-break: break-all;
      max-width: 100%;
      margin-top: 8px;
    }

    .open-btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      background: var(--primary-color);
      color: #fff;
      font-size: 17px;
      font-weight: 500;
      padding: 14px 48px;
      border-radius: 10px;
      border: none;
      cursor: pointer;
      transition: all 0.2s;
      text-decoration: none;
      margin-top: 8px;
    }

    .open-btn:hover {
      background: #06ad56;
    }

    .open-btn:active {
      transform: scale(0.98);
    }

    .open-btn svg {
      width: 20px;
      height: 20px;
    }

    /* 隐藏元素 */
    .hidden {
      display: none !important;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="card">
      <!-- 加载状态 -->
      <div id="loadingState" class="loading-state">
        <div class="spinner"></div>
        <p class="loading-text">正在跳转...</p>
      </div>

      <!-- 错误状态 -->
      <div id="errorState" class="error-state hidden">
        <div class="error-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"/>
            <line x1="15" y1="9" x2="9" y2="15"/>
            <line x1="9" y1="9" x2="15" y2="15"/>
          </svg>
        </div>
        <h2 class="error-title">无法跳转</h2>
        <p id="errorMessage" class="error-message">链接不在允许范围内</p>
      </div>

      <!-- 成功状态 - 显示按钮 -->
      <div id="successState" class="success-state hidden">
        <div class="success-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"/>
            <polyline points="16 10 11 15 8 12"/>
          </svg>
        </div>
        <h2 class="success-title">准备就绪</h2>
        <p class="success-message">点击下方按钮在浏览器中打开</p>
        <div id="targetUrlDisplay" class="target-url"></div>
        <a id="openBtn" class="open-btn" href="#">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/>
            <polyline points="15 3 21 3 21 9"/>
            <line x1="10" y1="14" x2="21" y2="3"/>
          </svg>
          在浏览器打开
        </a>
      </div>
    </div>
  </div>

  <script>
    (function() {
      'use strict'

      // DOM 元素
      const loadingState = document.getElementById('loadingState')
      const errorState = document.getElementById('errorState')
      const successState = document.getElementById('successState')
      const errorMessage = document.getElementById('errorMessage')
      const targetUrlDisplay = document.getElementById('targetUrlDisplay')
      const openBtn = document.getElementById('openBtn')

      /**
       * 获取 URL 参数
       */
      function getUrlParam(name) {
        const urlParams = new URLSearchParams(window.location.search)
        return urlParams.get(name)
      }

      /**
       * 显示状态
       */
      function showState(state) {
        loadingState.classList.add('hidden')
        errorState.classList.add('hidden')
        successState.classList.add('hidden')

        switch(state) {
          case 'loading':
            loadingState.classList.remove('hidden')
            break
          case 'error':
            errorState.classList.remove('hidden')
            break
          case 'success':
            successState.classList.remove('hidden')
            break
        }
      }

      /**
       * 显示错误
       */
      function showError(message) {
        errorMessage.textContent = message
        showState('error')
      }

      /**
       * 显示成功（显示打开按钮）
       */
      function showSuccess(url) {
        targetUrlDisplay.textContent = url
        openBtn.href = url
        showState('success')
      }

      /**
       * 加载白名单
       */
      async function loadWhitelist() {
        try {
          const response = await fetch('./whitelist.json')
          if (!response.ok) {
            throw new Error('加载白名单失败')
          }
          return await response.json()
        } catch (err) {
          console.error('加载白名单失败:', err)
          return []
        }
      }

      /**
       * 校验域名是否在白名单
       */
      function isDomainAllowed(url, whitelist) {
        try {
          const urlObj = new URL(url)
          const hostname = urlObj.hostname
          return whitelist.includes(hostname)
        } catch (err) {
          console.error('URL 解析失败:', err)
          return false
        }
      }

      /**
       * 尝试自动跳转
       */
      function tryAutoJump(url) {
        try {
          // 尝试直接跳转
          window.location.href = url

          // 如果跳转失败（用户仍在页面），延迟后显示按钮
          setTimeout(function() {
            showSuccess(url)
          }, 1500)
        } catch (err) {
          console.error('自动跳转失败:', err)
          showSuccess(url)
        }
      }

      /**
       * 主函数
       */
      async function main() {
        // 1. 获取目标链接
        const targetUrl = getUrlParam('t')

        if (!targetUrl) {
          showError('缺少目标链接参数')
          return
        }

        console.log('目标链接:', targetUrl)

        // 2. 加载白名单
        const whitelist = await loadWhitelist()
        console.log('白名单:', whitelist)

        // 3. 校验域名
        if (!isDomainAllowed(targetUrl, whitelist)) {
          showError('链接不在允许范围内')
          return
        }

        // 4. 尝试自动跳转
        tryAutoJump(targetUrl)
      }

      // 启动
      main()
    })()
  </script>
</body>
</html>
```

**Step 2: 提交**

```bash
git add h5/redirect.html
git commit -m "feat: 添加 H5 中转跳转页面"
```

---

## Task 7: 创建使用说明文档

**Files:**
- Create: `README.md`

**Step 1: 创建 README**

`README.md`:
```markdown
# 小程序链接跳转器

微信小程序链接跳转器，用于规避微信对外网链接的审核限制。

## 项目结构

```
mp_jumper/
├── miniprogram/          # 小程序代码
│   ├── pages/
│   │   ├── index/        # 入口页
│   │   └── webview/      # WebView 容器
│   └── utils/
│       └── base64.js     # Base64 工具
│
├── h5/                   # H5 中转页（部署到服务器）
│   ├── redirect.html     # 中转页
│   └── whitelist.json    # 域名白名单
│
└── docs/
    └── plans/            # 设计文档
```

## 部署步骤

### 1. 部署 H5 中转页

将 `h5/` 目录下的文件部署到 `512028.xyz` 服务器：

- `redirect.html` - 中转跳转页
- `whitelist.json` - 域名白名单配置

确保服务器已配置 HTTPS（微信要求）。

### 2. 配置小程序业务域名

1. 登录 [微信公众平台](https://mp.weixin.qq.com/)
2. 进入「开发」→「开发管理」→「开发设置」
3. 在「业务域名」中添加 `512028.xyz`
4. 下载校验文件，放置到 `512028.xyz` 根目录

### 3. 导入小程序项目

1. 下载并安装 [微信开发者工具](https://developers.weixin.qq.com/miniprogram/dev/devtools/download.html)
2. 导入 `miniprogram/` 目录
3. 在 `project.config.json` 中填写你的 AppID
4. 编译并预览

### 4. 发布小程序

1. 在微信开发者工具中点击「上传」
2. 登录微信公众平台提交审核
3. 审核通过后发布

## 使用方法

### 生成跳转链接

1. 将目标链接进行 Base64 编码
2. 生成小程序码或小程序链接，参数为 `scene=<Base64编码的目标链接>`

**示例：**

```javascript
// 目标链接
const targetUrl = 'https://pan.quark.cn/s/7689abcd'

// Base64 编码（需要 UTF-8 支持）
const encodedUrl = btoa(unescape(encodeURIComponent(targetUrl)))
// 结果: aHR0cHM6Ly9wYW4ucXVhcmsuY24vcy83Njg5YWJjZA==

// 小程序链接
const miniProgramUrl = `weixin://dl/business/?t=your_appid&scene=${encodedUrl}`
```

### 更新白名单

修改服务器上的 `whitelist.json` 文件：

```json
[
  "pan.quark.cn",
  "pan.baidu.com",
  "www.aliyundrive.com"
]
```

更新后立即生效，无需修改小程序代码。

## 注意事项

1. 目标链接必须以 `http://` 或 `https://` 开头
2. 目标域名必须在白名单中，否则无法跳转
3. 小程序业务域名需要在小程序后台配置
4. H5 页面必须使用 HTTPS
```

**Step 2: 提交**

```bash
git add README.md
git commit -m "docs: 添加项目使用说明"
```

---

## Task 8: 最终验证与提交

**Step 1: 检查项目结构**

```bash
# 验证所有文件已创建
ls -la miniprogram/
ls -la miniprogram/pages/index/
ls -la miniprogram/pages/webview/
ls -la miniprogram/utils/
ls -la h5/
```

**Step 2: 确认所有更改已提交**

```bash
git status
git log --oneline
```

**Step 3: 最终提交（如有遗漏）**

```bash
git add -A
git commit -m "feat: 完成小程序链接跳转器开发"
```

---

## 完成检查清单

- [ ] 小程序项目结构初始化
- [ ] Base64 编解码工具
- [ ] 入口页面（参数解析）
- [ ] WebView 容器页面
- [ ] H5 中转页（含白名单校验）
- [ ] 域名白名单配置
- [ ] 项目使用说明文档

---

## 后续工作

1. 在微信开发者工具中测试小程序
2. 部署 H5 文件到 512028.xyz
3. 配置小程序业务域名
4. 提交小程序审核
5. 开发小程序码生成工具（可选）
