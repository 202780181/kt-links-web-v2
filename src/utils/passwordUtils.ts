import CryptoJS from 'crypto-js'

/**
 * 用户密码处理工具
 * 根据用户密码处理逻辑进行密码加密
 */

/**
 * 处理用户密码
 * @param password 原始密码
 * @returns 处理后的密码
 */
export function processUserPassword(password: string): string {
  // 使用 HMAC-SHA256 算法处理密码
  
  // 客户端固定安全盐（永远不变）
  const salt = 'tqkibXwah7Iq5igWIsTD2zEYcsGRsz93ktqR1m3elVEQwmRKZYsPdekQVSWzJFn9'
  
  // 第一步：对密码进行 UTF-8 编码
  const passwordBytes = CryptoJS.enc.Utf8.parse(password)
  
  // 第二步：对盐值进行 UTF-8 编码
  const saltBytes = CryptoJS.enc.Utf8.parse(salt)
  
  // 第三步：使用 HMAC-SHA256 进行哈希处理
  const hmacHash = CryptoJS.HmacSHA256(passwordBytes, saltBytes)
  
  // 第四步：转换为十六进制字符串
  const processedPassword = hmacHash.toString(CryptoJS.enc.Hex)
  
  return processedPassword
}

/**
 * 验证密码强度
 * @param password 密码
 * @returns 密码强度信息
 */
export interface PasswordStrength {
  isValid: boolean
  score: number // 0-4
  feedback: string[]
}

export function validatePasswordStrength(password: string): PasswordStrength {
  const feedback: string[] = []
  let score = 0

  // 长度检查
  if (password.length < 8) {
    feedback.push('密码长度至少需要8位')
  } else if (password.length >= 12) {
    score += 1
  }

  // 包含小写字母
  if (/[a-z]/.test(password)) {
    score += 1
  } else {
    feedback.push('密码需要包含小写字母')
  }

  // 包含大写字母
  if (/[A-Z]/.test(password)) {
    score += 1
  } else {
    feedback.push('密码需要包含大写字母')
  }

  // 包含数字
  if (/\d/.test(password)) {
    score += 1
  } else {
    feedback.push('密码需要包含数字')
  }

  // 包含特殊字符
  if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    score += 1
  } else {
    feedback.push('密码需要包含特殊字符')
  }

  const isValid = password.length >= 8 && score >= 3

  return {
    isValid,
    score: Math.min(score, 4),
    feedback
  }
}
