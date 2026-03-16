# Articles 服务 - 手动录入文章接口

## 基本信息

| 项目 | 值 |
|------|-----|
| 服务 | articles |
| 本地端口 | 8082 |
| 接口 | `/api/v1/article/insert` |
| 方法 | POST |
| Content-Type | application/json |

## 访问地址

| 环境 | 地址 |
|------|------|
| 本地 | `http://localhost:8082/api/v1/article/insert` |
| 外网（Caddy 代理） | `https://www.512028.xyz/weshareh/api/v1/article/insert` |

## 请求参数

```json
{
  "article_url": "https://mp.weixin.qq.com/s/xxxxxx",
  "preview": false
}
```

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| article_url | string | 是 | 微信公众号文章 URL |
| preview | boolean | 否 | 为 true 时仅预览获取标题，不插入数据库 |

## 响应

### 成功 - 插入文章

```json
{
  "status_code": 0,
  "status_msg": "文章已插入",
  "data": {
    "id": 123,
    "source": "人工筛选",
    "article_title": "更新！2026春译林版英语八年级下册电子课本",
    "article_url": "https://mp.weixin.qq.com/s/xxxxxx",
    "article_time": 1710460800,
    "created_at": 1710460800,
    "updated_at": 1710460800
  }
}
```

### 成功 - 预览模式

```json
{
  "status_code": 0,
  "status_msg": "预览成功",
  "data": {
    "article_title": "更新！2026春译林版英语八年级下册电子课本",
    "article_url": "https://mp.weixin.qq.com/s/xxxxxx",
    "exists": false
  }
}
```

### 失败 - URL 已存在

```json
{
  "status_code": 1001,
  "status_msg": "文章URL已存在"
}
```

### 失败 - 参数为空

```json
{
  "status_code": 1000,
  "status_msg": "article_url 不能为空"
}
```

## 错误码

| status_code | status_msg | 说明 |
|-------------|------------|------|
| 0 | 文章已插入 / 预览成功 | 成功 |
| 1000 | 无效请求 / article_url 不能为空 | 参数错误 |
| 1001 | 文章URL已存在 | 重复插入 |
| 1002 | 数据库查询失败 | 内部错误 |
| 1003 | 获取文章内容失败 | URL 无法访问 |
| 1004 | 插入文章失败 | 内部错误 |

## 调用示例

### cURL - 插入文章

```bash
curl -X POST https://www.512028.xyz/weshareh/api/v1/article/insert \
  -H "Content-Type: application/json" \
  -d '{"article_url": "https://mp.weixin.qq.com/s/xxxxxx"}'
```

### cURL - 预览获取标题

```bash
curl -X POST https://www.512028.xyz/weshareh/api/v1/article/insert \
  -H "Content-Type: application/json" \
  -d '{"article_url": "https://mp.weixin.qq.com/s/xxxxxx", "preview": true}'
```

### JavaScript (小程序)

```javascript
// 预览文章（获取标题）
wx.request({
  url: 'https://www.512028.xyz/weshareh/api/v1/article/insert',
  method: 'POST',
  data: {
    article_url: 'https://mp.weixin.qq.com/s/xxxxxx',
    preview: true
  },
  success: (res) => {
    console.log('标题:', res.data.data.article_title)
    console.log('是否已存在:', res.data.data.exists)
  }
})

// 添加文章
wx.request({
  url: 'https://www.512028.xyz/weshareh/api/v1/article/insert',
  method: 'POST',
  data: {
    article_url: 'https://mp.weixin.qq.com/s/xxxxxx'
  },
  success: (res) => {
    if (res.data.status_code === 0) {
      console.log('添加成功, ID:', res.data.data.id)
    }
  }
})
```

### Python (requests)

```python
import requests

# 预览文章
resp = requests.post(
    'https://www.512028.xyz/weshareh/api/v1/article/insert',
    json={'article_url': 'https://mp.weixin.qq.com/s/xxxxxx', 'preview': True}
)
print(resp.json())

# 添加文章
resp = requests.post(
    'https://www.512028.xyz/weshareh/api/v1/article/insert',
    json={'article_url': 'https://mp.weixin.qq.com/s/xxxxxx'}
)
print(resp.json())
```

## 处理逻辑

### 插入模式（preview=false 或不传）

1. 验证 `article_url` 非空
2. 检查 URL 是否已存在于 articles 表
3. 请求 URL 获取 HTML 内容
4. 提取文章标题（优先级：`js_title_inner` > `activity-name` > `og:title` > `<title>`）
5. 插入数据库，`source = "人工筛选"`
6. 返回结果

### 预览模式（preview=true）

1. 验证 `article_url` 非空
2. 检查 URL 是否已存在
3. 获取 HTML 内容并提取标题
4. **不插入数据库**，仅返回预览信息
5. 返回结果包含 `exists` 字段标识是否已存在

## 后续流程

插入的文章会被现有流程自动处理：

1. **contents 服务**：读取 articles 表，提取网盘链接
2. **quark 服务**：转存到夸克网盘
3. **official 服务**：生成分享链接、创建微信草稿

## 部署说明

- 本地服务运行在 8082 端口
- 通过 SSH 隧道转发到服务器：`ssh -R 60082:localhost:8082 512`
- Caddy 反向代理 `/weshareh/*` → `10.0.0.11:60082`
