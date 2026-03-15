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
