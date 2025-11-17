/**
 * Cookie 工具类
 * 提供设置和获取 cookie 的通用方法
 */

export interface CookieOptions {
  /** 过期时间（天数） */
  expires?: number
  /** 过期时间（Date 对象） */
  expiresDate?: Date
  /** 路径 */
  path?: string
  /** 域名 */
  domain?: string
  /** 是否安全传输 */
  secure?: boolean
  /** SameSite 策略 */
  sameSite?: 'strict' | 'lax' | 'none'
  /** 是否 HttpOnly */
  httpOnly?: boolean
}

/**
 * 设置 cookie
 * @param name cookie 名称
 * @param value cookie 值
 * @param options cookie 选项
 */
export function setCookie(name: string, value: string, options: CookieOptions = {}): void {
  const {
    expires,
    expiresDate,
    path = '/',
    domain,
    secure = true,
    sameSite = 'strict',
    httpOnly = false
  } = options

  let cookieString = `${name}=${encodeURIComponent(value)}`

  // 处理过期时间
  if (expiresDate) {
    cookieString += `; expires=${expiresDate.toUTCString()}`
  } else if (expires) {
    const date = new Date()
    date.setDate(date.getDate() + expires)
    cookieString += `; expires=${date.toUTCString()}`
  }

  // 添加其他选项
  if (path) {
    cookieString += `; path=${path}`
  }

  if (domain) {
    cookieString += `; domain=${domain}`
  }

  if (secure) {
    cookieString += '; secure'
  }

  if (sameSite) {
    cookieString += `; samesite=${sameSite}`
  }

  if (httpOnly) {
    cookieString += '; httponly'
  }

  document.cookie = cookieString
}

/**
 * 获取 cookie 值
 * @param name cookie 名称
 * @returns cookie 值，如果不存在则返回 null
 */
export function getCookie(name: string): string | null {
  const value = `; ${document.cookie}`
  const parts = value.split(`; ${name}=`)
  
  if (parts.length === 2) {
    const cookieValue = parts.pop()?.split(';').shift()
    return cookieValue ? decodeURIComponent(cookieValue) : null
  }
  
  return null
}

/**
 * 删除 cookie
 * @param name cookie 名称
 * @param options cookie 选项（主要是 path 和 domain）
 */
export function removeCookie(name: string, options: Pick<CookieOptions, 'path' | 'domain'> = {}): void {
  setCookie(name, '', {
    ...options,
    expires: -1
  })
}

/**
 * 检查 cookie 是否存在
 * @param name cookie 名称
 * @returns 是否存在
 */
export function hasCookie(name: string): boolean {
  return getCookie(name) !== null
}

/**
 * 获取所有 cookie
 * @returns cookie 对象
 */
export function getAllCookies(): Record<string, string> {
  const cookies: Record<string, string> = {}
  
  if (document.cookie) {
    document.cookie.split(';').forEach(cookie => {
      const [name, value] = cookie.trim().split('=')
      if (name && value) {
        cookies[name] = decodeURIComponent(value)
      }
    })
  }
  
  return cookies
}

/**
 * 清除所有 cookie
 * @param options cookie 选项（主要是 path 和 domain）
 */
export function clearAllCookies(options: Pick<CookieOptions, 'path' | 'domain'> = {}): void {
  const cookies = getAllCookies()
  
  Object.keys(cookies).forEach(name => {
    removeCookie(name, options)
  })
}
