# 小程序链接跳转器 - 设计文档

## 概述

开发一个微信小程序链接跳转器，用于规避微信对外网链接的审核限制。通过小程序包装外网链接，实现从微信内部跳转到外部浏览器打开目标地址。

## 需求背景

- 原方式：用户扫描二维码直接跳转外部浏览器，会被微信审核拦截
- 新方式：通过小程序作为中转，规避微信审核限制

## 系统架构

```
┌─────────────────────────────────────────────────────────────┐
│                        三方使用方                            │
│  目标链接 → Base64编码 → 生成小程序码/链接 → 发布推广        │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                        微信小程序                            │
│  扫码进入 → 解析scene参数 → Base64解码 → 加载webview       │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                   H5中转页 (512028.xyz)                      │
│  加载白名单 → 校验域名 → 尝试自动跳转 → 失败则显示按钮      │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                      外部浏览器                              │
│  打开三方目标链接（夸克网盘/任意外网）                       │
└─────────────────────────────────────────────────────────────┘
```

## 组件设计

### 1. 微信小程序

**项目结构：**

```
miniprogram/
├── app.js
├── app.json
├── app.wxss
├── pages/
│   ├── index/              # 入口页
│   │   ├── index.js
│   │   ├── index.json
│   │   ├── index.wxml
│   │   └── index.wxss
│   └── webview/            # webview容器
│       ├── webview.js
│       ├── webview.json
│       ├── webview.wxml
│       └── webview.wxss
└── utils/
    └── base64.js           # Base64编解码工具
```

**入口页逻辑（index.js）：**

```javascript
onLoad(options) {
  // 1. 获取scene参数
  let scene = options.scene || decodeURIComponent(options.scene || '')

  // 2. Base64解码
  const targetUrl = Base64.decode(scene)

  // 3. 简单校验格式
  if (!targetUrl.startsWith('http')) {
    this.showError('链接格式错误')
    return
  }

  // 4. 跳转webview页
  wx.navigateTo({
    url: `/pages/webview/webview?t=${encodeURIComponent(targetUrl)}`
  })
}
```

**Webview页逻辑（webview.js）：**

```javascript
onLoad(options) {
  const targetUrl = decodeURIComponent(options.t || '')
  this.setData({
    webviewUrl: `https://512028.xyz/redirect.html?t=${encodeURIComponent(targetUrl)}`
  })
}
```

### 2. H5中转页

**文件结构：**

```
h5/
├── redirect.html      # 中转跳转页（frontend-design设计）
└── whitelist.json     # 白名单配置
```

**核心逻辑：**

```javascript
// 1. 获取URL参数中的目标链接
const targetUrl = getUrlParam('t')

// 2. 加载白名单
const whitelist = await fetch('/whitelist.json').then(r => r.json())

// 3. 校验域名
const targetDomain = new URL(targetUrl).hostname
if (!whitelist.includes(targetDomain)) {
  showError('链接不在允许范围内')
  return
}

// 4. 尝试自动跳转
tryAutoJump(targetUrl)

// 5. 自动跳转失败，显示手动按钮
showManualButton(targetUrl)
```

**页面状态：**

| 状态 | 显示内容 |
|------|----------|
| 加载中 | 加载动画 + "正在跳转..." |
| 自动跳转成功 | （用户已离开） |
| 自动跳转失败 | 大按钮 + "点击在浏览器打开" |
| 白名单校验失败 | 错误提示 + "链接不在允许范围内" |

**UI设计要求：**
- 使用 frontend-design 技能进行高质量UI设计
- 现代简洁风格
- 品牌感
- 高转化率
- 响应式布局

### 3. 白名单配置

**whitelist.json 格式：**

```json
[
  "pan.quark.cn",
  "pan.baidu.com",
  "www.aliyundrive.com"
]
```

**更新方式：** 直接修改服务器上的 `whitelist.json` 文件，无需更新小程序代码。

## 使用流程

### 三方生成链接

```
目标链接 → Base64编码 → 小程序码生成工具 → 带参数小程序码/链接
```

示例：
```
目标链接: https://pan.quark.cn/s/7689abcd
Base64编码: aHR0cHM6Ly9wYW4ucXVhcmsuY24vcy83Njg5YWJjZA==
小程序码参数: scene=aHR0cHM6Ly9wYW4ucXVhcmsuY24vcy83Njg5YWJjZA==
```

### 终端用户使用

```
扫描小程序码
    ↓
小程序入口页：解析scene → Base64解码
    ↓
小程序webview页：加载中转页
    ↓
H5中转页：加载白名单 → 校验域名
    ↓
    ├─ 白名单内 → 尝试自动跳转 → 成功/显示按钮
    └─ 白名单外 → 显示错误提示
    ↓
外部浏览器打开目标链接
```

## 部署清单

### 小程序配置

1. 在微信小程序后台配置业务域名：`512028.xyz`
2. 在 `512028.xyz` 根目录放置域名验证文件

### 服务器部署

1. 将 `h5/redirect.html` 和 `h5/whitelist.json` 部署到 `512028.xyz`
3. 配置 HTTPS（微信要求）

## 技术栈

| 组件 | 技术 |
|------|------|
| 小程序 | 微信小程序原生开发 |
| H5中转页 | HTML + CSS + JavaScript |
| 部署 | 静态文件托管（512028.xyz） |

## 后续扩展

- [ ] 小程序码生成工具（供三方使用）
- [ ] 访问统计功能
- [ ] 多主题支持
