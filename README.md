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
