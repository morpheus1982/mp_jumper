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
