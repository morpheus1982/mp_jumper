# 文章收藏小程序实现计划

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 重构小程序为文章收藏工具，支持自动读取剪贴板 URL、预览标题、添加到后台

**Architecture:** 单页面应用，通过状态机管理 5 种页面状态，API 封装统一处理请求

**Tech Stack:** 微信小程序原生框架、wx.request、wx.getClipboardData

---

## Task 1: 创建 API 请求封装

**Files:**
- Create: `miniprogram/utils/api.js`

**Step 1: 创建 API 封装模块**

```javascript
/**
 * API 请求封装
 */

const BASE_URL = 'https://www.512028.xyz/weshareh'

/**
 * 通用请求方法
 */
function request(options) {
  return new Promise((resolve, reject) => {
    wx.request({
      url: BASE_URL + options.url,
      method: options.method || 'GET',
      data: options.data || {},
      header: {
        'Content-Type': 'application/json'
      },
      success: (res) => {
        if (res.statusCode === 200) {
          resolve(res.data)
        } else {
          reject(new Error(`请求失败: ${res.statusCode}`))
        }
      },
      fail: (err) => {
        reject(new Error(err.errMsg || '网络请求失败'))
      }
    })
  })
}

/**
 * 预览文章（获取标题）
 * @param {string} articleUrl - 文章链接
 */
function previewArticle(articleUrl) {
  return request({
    url: '/api/v1/article/insert',
    method: 'POST',
    data: {
      article_url: articleUrl,
      preview: true
    }
  })
}

/**
 * 添加文章
 * @param {string} articleUrl - 文章链接
 */
function insertArticle(articleUrl) {
  return request({
    url: '/api/v1/article/insert',
    method: 'POST',
    data: {
      article_url: articleUrl
    }
  })
}

module.exports = {
  previewArticle,
  insertArticle
}
```

**Step 2: 验证文件创建**

Run: `ls miniprogram/utils/`
Expected: `api.js  base64.js`

**Step 3: Commit**

```bash
git add miniprogram/utils/api.js
git commit -m "feat: 添加 API 请求封装模块"
```

---

## Task 2: 重写 index 页面逻辑

**Files:**
- Modify: `miniprogram/pages/index/index.js`

**Step 1: 重写页面逻辑**

```javascript
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
```

**Step 2: 验证语法**

Run: `node -c miniprogram/pages/index/index.js`
Expected: 无语法错误

**Step 3: Commit**

```bash
git add miniprogram/pages/index/index.js
git commit -m "feat: 重写 index 页面逻辑"
```

---

## Task 3: 重写 index 页面模板

**Files:**
- Modify: `miniprogram/pages/index/index.wxml`

**Step 1: 重写页面模板**

```xml
<view class="container">
  <!-- 加载状态 -->
  <view wx:if="{{state === 'loading'}}" class="state-container">
    <view class="loading-spinner"></view>
    <text class="loading-text">读取剪贴板 + 获取标题...</text>
  </view>

  <!-- 空状态 -->
  <view wx:if="{{state === 'empty'}}" class="state-container">
    <button class="paste-btn" bindtap="onPaste">粘贴</button>
    <view class="empty-icon">📋</view>
    <text class="empty-text">未检测到文章链接</text>
    <text class="empty-hint">请复制公众号文章链接后点击粘贴</text>
  </view>

  <!-- 预览状态 -->
  <view wx:if="{{state === 'preview'}}" class="state-container">
    <button class="paste-btn" bindtap="onPaste">粘贴</button>
    <view class="article-card">
      <text class="article-icon">📄</text>
      <text class="article-title">{{articleTitle}}</text>
      <text class="article-url">{{articleUrl}}</text>
    </view>
    <button class="add-btn" bindtap="onAdd">添加</button>
  </view>

  <!-- 已存在状态 -->
  <view wx:if="{{state === 'exists'}}" class="state-container">
    <button class="paste-btn" bindtap="onPaste">粘贴</button>
    <view class="warning-text">⚠️ 该文章已添加过</view>
    <view class="article-card">
      <text class="article-icon">📄</text>
      <text class="article-title">{{articleTitle}}</text>
      <text class="article-url">{{articleUrl}}</text>
    </view>
    <button class="add-btn" bindtap="onContinue">粘贴新链接</button>
  </view>

  <!-- 结果状态 -->
  <view wx:if="{{state === 'result'}}" class="state-container">
    <view class="result-icon">✅</view>
    <text class="result-text">文章已插入</text>
    <text class="result-id" wx:if="{{result.id}}">ID: {{result.id}}</text>
    <button class="add-btn" bindtap="onContinue">继续添加</button>
  </view>

  <!-- 错误状态 -->
  <view wx:if="{{state === 'error'}}" class="state-container">
    <button class="paste-btn" bindtap="onPaste">粘贴</button>
    <view class="error-icon">❌</view>
    <text class="error-text">{{errorMessage}}</text>
  </view>
</view>
```

**Step 2: Commit**

```bash
git add miniprogram/pages/index/index.wxml
git commit -m "feat: 重写 index 页面模板"
```

---

## Task 4: 重写 index 页面样式

**Files:**
- Modify: `miniprogram/pages/index/index.wxss`

**Step 1: 重写页面样式**

```css
.container {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  padding: 40rpx;
  box-sizing: border-box;
  background-color: #f5f5f5;
}

.state-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
  padding-top: 80rpx;
}

/* 加载状态 */
.loading-spinner {
  width: 80rpx;
  height: 80rpx;
  border: 6rpx solid #e0e0e0;
  border-top-color: #07c160;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 30rpx;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.loading-text {
  font-size: 28rpx;
  color: #666;
}

/* 粘贴按钮 */
.paste-btn {
  align-self: flex-end;
  background-color: #f0f0f0;
  color: #666;
  font-size: 26rpx;
  padding: 12rpx 30rpx;
  border-radius: 30rpx;
  margin-bottom: 40rpx;
}

.paste-btn::after {
  border: none;
}

/* 空状态 */
.empty-icon {
  font-size: 120rpx;
  margin-bottom: 30rpx;
}

.empty-text {
  font-size: 32rpx;
  color: #333;
  margin-bottom: 16rpx;
}

.empty-hint {
  font-size: 26rpx;
  color: #999;
}

/* 文章卡片 */
.article-card {
  width: 100%;
  background-color: #fff;
  border-radius: 16rpx;
  padding: 30rpx;
  box-sizing: border-box;
  margin-bottom: 40rpx;
  box-shadow: 0 2rpx 10rpx rgba(0, 0, 0, 0.05);
}

.article-icon {
  font-size: 48rpx;
  margin-bottom: 16rpx;
}

.article-title {
  display: block;
  font-size: 32rpx;
  color: #333;
  line-height: 1.5;
  margin-bottom: 16rpx;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.article-url {
  display: block;
  font-size: 22rpx;
  color: #999;
  word-break: break-all;
}

/* 警告文字 */
.warning-text {
  font-size: 28rpx;
  color: #fa8c16;
  margin-bottom: 20rpx;
}

/* 添加按钮 */
.add-btn {
  width: 100%;
  background-color: #07c160;
  color: #fff;
  font-size: 32rpx;
  padding: 24rpx 0;
  border-radius: 50rpx;
  border: none;
}

.add-btn::after {
  border: none;
}

/* 结果状态 */
.result-icon {
  font-size: 120rpx;
  margin-bottom: 30rpx;
}

.result-text {
  font-size: 36rpx;
  color: #333;
  margin-bottom: 16rpx;
}

.result-id {
  font-size: 26rpx;
  color: #999;
  margin-bottom: 40rpx;
}

/* 错误状态 */
.error-icon {
  font-size: 100rpx;
  margin-bottom: 30rpx;
}

.error-text {
  font-size: 28rpx;
  color: #666;
  text-align: center;
  max-width: 80%;
}
```

**Step 2: Commit**

```bash
git add miniprogram/pages/index/index.wxss
git commit -m "feat: 重写 index 页面样式"
```

---

## Task 5: 更新 app.json 配置

**Files:**
- Modify: `miniprogram/app.json`

**Step 1: 移除 webview 页面**

```json
{
  "pages": [
    "pages/index/index"
  ],
  "window": {
    "navigationBarTitleText": "文章收藏",
    "navigationBarBackgroundColor": "#ffffff",
    "navigationBarTextStyle": "black",
    "backgroundColor": "#f5f5f5",
    "backgroundTextStyle": "dark"
  },
  "style": "v2",
  "sitemapLocation": "sitemap.json",
  "lazyCodeLoading": "requiredComponents"
}
```

**Step 2: Commit**

```bash
git add miniprogram/app.json
git commit -m "refactor: 移除 webview 页面配置"
```

---

## Task 6: 删除 webview 页面

**Files:**
- Delete: `miniprogram/pages/webview/`

**Step 1: 删除 webview 目录**

```bash
rm -rf miniprogram/pages/webview
```

**Step 2: 验证删除**

Run: `ls miniprogram/pages/`
Expected: `index`

**Step 3: Commit**

```bash
git add -A miniprogram/pages/webview
git commit -m "refactor: 删除 webview 页面"
```

---

## Task 7: 最终验证

**Step 1: 检查文件结构**

Run: `ls miniprogram/`
Expected: `app.js  app.json  app.wxss  pages  project.config.json  project.private.config.json  sitemap.json  utils`

Run: `ls miniprogram/pages/`
Expected: `index`

Run: `ls miniprogram/utils/`
Expected: `api.js  base64.js`

**Step 2: 检查语法**

Run: `node -c miniprogram/utils/api.js && node -c miniprogram/pages/index/index.js`
Expected: 无语法错误

**Step 3: 最终提交**

```bash
git add -A
git status
```

---

## 验收清单

- [ ] 打开小程序自动读取剪贴板 URL
- [ ] 成功获取标题显示预览状态
- [ ] 剪贴板无 URL 显示空状态
- [ ] URL 已存在显示提示
- [ ] 点击添加成功插入并显示结果
- [ ] 网络错误正确提示
- [ ] 粘贴按钮兜底可用
