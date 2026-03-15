# 文章收藏小程序设计文档

## 概述

重构小程序，实现公众号文章收藏功能。用户打开小程序时自动读取剪贴板 URL，获取文章标题后可一键添加到后台。

## 接口设计

### insert 接口扩展

在现有 `/api/v1/article/insert` 基础上增加 `preview` 参数。

**基础信息**

| 项目 | 值 |
|------|-----|
| 接口 | `/api/v1/article/insert` |
| 方法 | POST |
| 地址 | `https://www.512028.xyz/weshareh/api/v1/article/insert` |
| Content-Type | application/json |

**请求参数**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| article_url | string | 是 | 公众号文章 URL |
| preview | boolean | 否 | 为 true 时仅预览，不插入数据库 |

**preview 模式响应**

```json
{
  "status_code": 0,
  "status_msg": "预览成功",
  "data": {
    "article_title": "文章标题xxx",
    "article_url": "https://mp.weixin.qq.com/s/xxxxxx",
    "exists": false
  }
}
```

**preview 模式行为**
1. 校验 URL 格式
2. 检查 URL 是否已存在
3. 获取文章标题
4. 不插入数据库，仅返回预览信息

## 页面设计

### 页面状态

**状态1: 初始加载中**
```
┌─────────────────────────────────────┐
│  读取剪贴板 + 获取标题...             │
└─────────────────────────────────────┘
```

**状态2: 成功获取标题**
```
┌─────────────────────────────────────┐
│        [粘贴] (灰色小按钮)           │
│                                     │
│ 📄 更新！2026春译林版英语...         │
│ https://mp.weixin.qq.com/s/xxx      │
│                                     │
│      [添加] (绿色醒目按钮)           │
└─────────────────────────────────────┘
```

**状态3: 剪贴板无URL**
```
┌─────────────────────────────────────┐
│        [粘贴] (灰色按钮)             │
│                                     │
│ 未检测到文章链接                     │
│ 请复制公众号文章链接后点击粘贴        │
└─────────────────────────────────────┘
```

**状态4: URL已存在**
```
┌─────────────────────────────────────┐
│        [粘贴] (灰色小按钮)           │
│                                     │
│ ⚠️ 该文章已添加过                    │
│ 📄 更新！2026春译林版英语...         │
│ https://mp.weixin.qq.com/s/xxx      │
│                                     │
│      [粘贴新链接] (绿色按钮)         │
└─────────────────────────────────────┘
```

**状态5: 添加结果**
```
┌─────────────────────────────────────┐
│ ✅ 文章已插入                        │
│ ID: 123                             │
│                                     │
│      [继续添加] (绿色按钮)           │
└─────────────────────────────────────┘
```

### 按钮说明

| 按钮 | 样式 | 位置 | 行为 |
|------|------|------|------|
| 粘贴 | 灰色、较小 | 顶部 | 读取剪贴板 → 校验 → 调用 preview |
| 添加 | 绿色、醒目 | 底部 | 调用 insert 接口 → 显示结果 |

## 逻辑设计

### 状态管理

```javascript
data: {
  state: 'loading',      // loading | preview | empty | exists | result | error
  articleUrl: '',
  articleTitle: '',
  result: null,          // insert 接口返回结果
  errorMessage: ''
}
```

### 页面加载流程

```javascript
onShow() {
  wx.getClipboardData({
    success: (res) => {
      const text = res.data
      if (isValidUrl(text)) {
        this.previewArticle(text)
      } else {
        this.setData({ state: 'empty' })
      }
    },
    fail: () => {
      this.setData({ state: 'empty' })
    }
  })
}
```

### 按钮操作

| 按钮 | 行为 |
|------|------|
| 粘贴 | `wx.getClipboardData` → 校验 URL → 调用 preview |
| 添加 | 调用 insert 接口（无 preview 参数）→ 显示结果 |
| 粘贴新链接 / 继续添加 | 清空状态 → 重新读取剪贴板 |

## 错误处理

| 场景 | 提示 | 后续操作 |
|------|------|---------|
| 剪贴板无 URL | "未检测到文章链接" | 显示粘贴按钮 |
| URL 格式错误 | "链接格式不正确" | 显示粘贴按钮 |
| preview 接口失败 | "获取文章信息失败" | 显示粘贴按钮 |
| URL 已存在 | "该文章已添加过" | 显示粘贴新链接按钮 |
| insert 失败 | "添加失败" + 错误信息 | 重试 |
| 网络错误 | "网络连接失败" | 重试 |

### 接口错误码映射

| status_code | 小程序提示 |
|-------------|-----------|
| 0 | 成功 |
| 1000 | 链接格式错误 |
| 1001 | 该文章已存在 |
| 1002/1004 | 服务器错误，请稍后重试 |
| 1003 | 无法访问该链接 |

## 文件变更

### 删除
- `miniprogram/pages/webview/` - 不再需要 webview 页面

### 修改
- `miniprogram/pages/index/index.js` - 重写页面逻辑
- `miniprogram/pages/index/index.wxml` - 重写页面结构
- `miniprogram/pages/index/index.wxss` - 重写样式
- `miniprogram/app.json` - 移除 webview 页面配置

### 新增
- `miniprogram/utils/api.js` - API 请求封装
