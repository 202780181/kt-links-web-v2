import { post } from './base'
import * as nacl from 'tweetnacl'
import { hkdf } from '@noble/hashes/hkdf'
import { sha384 } from '@noble/hashes/sha2'
import CryptoJS from 'crypto-js'
import * as forge from 'node-forge'
import { getCookie, setCookie, removeCookie } from '../utils/cookieUtils'

// 会话初始化响应接口
export interface ClientAuthResponse {
  code: number
  msg: string
  data: {
    nonce: string
    sign: string
    serverSigPub: string
    serverDhPub: string
  }
}

// 客户端认证响应接口
export interface ClientAuthenticateResponse {
  code: number
  msg: string
  data: {
    accessToken: string
  }
}

// 客户端认证信息存储
interface ClientAuthInfo {
  sessionKey: Uint8Array
  serverSigPub: string
  serverDhPub: string
  clientSessionId: string
  timestamp: number
}

// 客户端会话密钥对
interface ClientKeyPairs {
  sigKeyPair: {
    privateKey: Uint8Array
    publicKey: Uint8Array
  }
  dhKeyPair: {
    privateKey: Uint8Array
    publicKey: Uint8Array
  }
}

// 环境变量配置
const ENV_CONFIG = {
  SERVER_DH_PUBLIC_KEY: import.meta.env.VITE_APP_PUBLIC_DH_KEY,
  CLIENT_DH_PUBLIC_KEY: import.meta.env.VITE_APP_KT_WEB_DH_KEY,
  SERVER_SIGN_PUBLIC_KEY: import.meta.env.VITE_APP_SIGN_PUBLIC_KEY,
  CLIENT_SIGN_PUBLIC_KEY: import.meta.env.VITE_APP_KT_WEB_PUBLIC_KEY,
  CLIENT_KEY: import.meta.env.VITE_APP_CLIENT_KEY
}

class ClientAuthService {
  private static clientKeyPairs: ClientKeyPairs | null = null
  private static authInfo: ClientAuthInfo | null = null

  /**
   * 生成密码学安全的随机字符串
   */
  private static generateSecureRandomString(length: number): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
    const randomBytes = nacl.randomBytes(length)
    return Array.from(randomBytes, byte => chars[byte % chars.length]).join('')
  }

  /**
   * Base64 解码公钥
   */
  private static decodeBase64PublicKey(base64Key: string): Uint8Array {
    // 移除 ASN.1 DER 编码的前缀，提取实际的32字节公钥
    const decoded = CryptoJS.enc.Base64.parse(base64Key)
    const bytes = new Uint8Array(decoded.words.length * 4)
    for (let i = 0; i < decoded.words.length; i++) {
      const word = decoded.words[i]
      bytes[i * 4] = (word >>> 24) & 0xff
      bytes[i * 4 + 1] = (word >>> 16) & 0xff
      bytes[i * 4 + 2] = (word >>> 8) & 0xff
      bytes[i * 4 + 3] = word & 0xff
    }
    return bytes.slice(-32) // 取最后32字节作为公钥
  }

  /**
   * 将原始公钥转换为ASN.1 DER格式
   */
  private static encodePublicKeyToDER(publicKey: Uint8Array, keyType: 'ed25519' | 'x25519'): string {
    // ASN.1 DER 编码前缀
    const ed25519Prefix = new Uint8Array([0x30, 0x2a, 0x30, 0x05, 0x06, 0x03, 0x2b, 0x65, 0x70, 0x03, 0x21, 0x00])
    const x25519Prefix = new Uint8Array([0x30, 0x2a, 0x30, 0x05, 0x06, 0x03, 0x2b, 0x65, 0x6e, 0x03, 0x21, 0x00])
    
    const prefix = keyType === 'ed25519' ? ed25519Prefix : x25519Prefix
    const derEncoded = new Uint8Array(prefix.length + publicKey.length)
    derEncoded.set(prefix, 0)
    derEncoded.set(publicKey, prefix.length)
    
    return CryptoJS.enc.Base64.stringify(CryptoJS.lib.WordArray.create(derEncoded))
  }

  /**
   * 执行 X25519 密钥交换
   */
  private static performKeyAgreement(privateKey: Uint8Array, publicKey: Uint8Array): Uint8Array {
    return nacl.scalarMult(privateKey, publicKey)
  }

  /**
   * 使用 HKDF-SHA384 派生会话密钥
   */
  private static deriveSessionKey(
    sharedKey: Uint8Array,
    salt: string,
    info: string,
    keyLength: number
  ): Uint8Array {
    const saltBytes = new TextEncoder().encode(salt)
    const infoBytes = new TextEncoder().encode(info)
    return hkdf(sha384, sharedKey, saltBytes, infoBytes, keyLength / 8)
  }

  /**
   * AES-GCM 加密
   */
  private static encryptAESGCM(data: string, key: Uint8Array): string {
    // 使用 node-forge 实现真正的 AES-GCM 加密
    const keyBinary = forge.util.binary.raw.encode(key)
    const cipher = forge.cipher.createCipher('AES-GCM', forge.util.createBuffer(keyBinary))
    const iv = forge.random.getBytesSync(12) // 96-bit IV for GCM
    
    cipher.start({
      iv: iv,
      tagLength: 128 // 128-bit authentication tag
    })
    
    cipher.update(forge.util.createBuffer(data, 'utf8'))
    cipher.finish()
    
    // 获取密文和认证标签
    const encrypted = cipher.output.getBytes()
    const tag = cipher.mode.tag.getBytes()
    
    // 返回 IV + 密文 + Tag 的 base64 编码
    const combined = iv + encrypted + tag
    return forge.util.encode64(combined)
  }

  /**
   * Ed25519 签名
   */
  private static signEd25519(data: string, privateKey: Uint8Array): Uint8Array {
    const dataBytes = new TextEncoder().encode(data)
    // 继续使用 TweetNaCl 的签名，但确保使用正确的私钥格式
    return nacl.sign.detached(dataBytes, privateKey)
  }

  /**
   * Ed25519 验签
   */
  private static verifyEd25519(signature: Uint8Array, data: string, publicKey: Uint8Array): boolean {
    const dataBytes = new TextEncoder().encode(data)
    return nacl.sign.detached.verify(dataBytes, signature, publicKey)
  }


  /**
   * 生成客户端密钥对（启动时调用）
   */
  private static generateClientKeyPairs(): ClientKeyPairs {
    // 生成 Ed25519 签名密钥对
    const sigKeyPair = nacl.sign.keyPair()
    
    // 生成 X25519 DH 密钥对
    const dhKeyPair = nacl.box.keyPair()

    return {
      sigKeyPair: {
        privateKey: sigKeyPair.secretKey.slice(0, 32), // Ed25519 私钥是32字节
        publicKey: sigKeyPair.publicKey
      },
      dhKeyPair: {
        privateKey: dhKeyPair.secretKey,
        publicKey: dhKeyPair.publicKey
      }
    }
  }

  /**
   * 执行客户端认证
   */
  static async authenticate(): Promise<ClientAuthInfo> {
    // 第一步：生成密钥对（如果还没有生成）
    if (!this.clientKeyPairs) {
      this.clientKeyPairs = this.generateClientKeyPairs()
    }

    // 生成客户端会话ID（32位随机字符串）
    const clientSessionId = this.generateSecureRandomString(32)

    // 将 clientSessionId 存储到 cookie 中（30天过期）
    setCookie('clientSessionId', clientSessionId, { expires: 30 })
    
    // 第二步：客户端用自己的dh算法私钥与服务器长期dh算法公钥进行密钥交换
    const serverLongDhPublicKey = this.decodeBase64PublicKey(ENV_CONFIG.SERVER_DH_PUBLIC_KEY)
    // 使用第一步生成的客户端临时DH私钥
    const clientDhPrivateKey = this.clientKeyPairs.dhKeyPair.privateKey
    const sharedSecret1 = this.performKeyAgreement(
      clientDhPrivateKey,
      serverLongDhPublicKey
    )

    // 第三步：派生临时会话密钥
    const tempSessionKey = this.deriveSessionKey(
      sharedSecret1,
      clientSessionId, // salt
      ENV_CONFIG.CLIENT_KEY, // info
      256 // keyLength
    )

    // 第四步：生成nonce并用会话密钥加密
    const nonce = this.generateSecureRandomString(32)
    const encryptedNonce = this.encryptAESGCM(nonce, tempSessionKey)

    // 第五步：签名流程
    // 5.1 生成签名数据并签名
    const signData = this.generateSecureRandomString(32)
    const needSignData = signData + nonce
    // 使用完整的64字节私钥进行签名
    const fullPrivateKey = new Uint8Array(64)
    fullPrivateKey.set(this.clientKeyPairs.sigKeyPair.privateKey, 0)
    fullPrivateKey.set(this.clientKeyPairs.sigKeyPair.publicKey, 32)
    const signature = this.signEd25519(needSignData, fullPrivateKey)

    // 5.2 计算签名加密密钥
    const clientLongDhPublicKey = this.decodeBase64PublicKey(ENV_CONFIG.CLIENT_DH_PUBLIC_KEY)
    const shareSecretByte = this.performKeyAgreement(
      this.clientKeyPairs.dhKeyPair.privateKey,
      clientLongDhPublicKey
    )
    
    const signEncryptKey = this.deriveSessionKey(
      shareSecretByte,
      clientSessionId, // salt
      ENV_CONFIG.CLIENT_KEY, // info
      256 // keyLength
    )

    // 加密签名
    const signatureBinary = forge.util.binary.raw.encode(signature)
    const signatureBase64 = forge.util.encode64(forge.util.createBuffer(signatureBinary).getBytes())
    const encryptedSign = this.encryptAESGCM(
      signatureBase64,
      signEncryptKey
    )

    // 第六步：准备请求数据
    const requestData = {
      clientKey: ENV_CONFIG.CLIENT_KEY,
      clientSessionId: clientSessionId,
      clientSigPub: this.encodePublicKeyToDER(this.clientKeyPairs.sigKeyPair.publicKey, 'ed25519'),
      clientDhPub: this.encodePublicKeyToDER(this.clientKeyPairs.dhKeyPair.publicKey, 'x25519'),
      signData: signData,
      timestamp: Date.now(),
      sign: encryptedSign,
      nonce: encryptedNonce
    }

    // 发送认证请求
    const response = await post<ClientAuthResponse>('/api/auth/token/c/session', requestData)
    
    // 检查接口返回状态
    if (response.code !== 0) {
      if (response.code === -1) {
        throw new Error('SESSION_EXPIRED')
      } else {
        throw new Error('CLIENT_NOT_SUPPORTED')
      }
    }
    
    // 第七步：验证服务器响应
    const { nonce: serverNonce, sign: serverSign, serverSigPub, serverDhPub } = response.data
    
    // 验证服务器签名
    const serverNeedSignData = clientSessionId + serverNonce
    const serverLongSigPublicKey = this.decodeBase64PublicKey(ENV_CONFIG.SERVER_SIGN_PUBLIC_KEY)
    const serverSignatureBytes = CryptoJS.enc.Base64.parse(serverSign).words
    const serverSignatureUint8 = new Uint8Array(new ArrayBuffer(serverSignatureBytes.length * 4))
    
    for (let i = 0; i < serverSignatureBytes.length; i++) {
      const word = serverSignatureBytes[i]
      serverSignatureUint8[i * 4] = (word >>> 24) & 0xff
      serverSignatureUint8[i * 4 + 1] = (word >>> 16) & 0xff
      serverSignatureUint8[i * 4 + 2] = (word >>> 8) & 0xff
      serverSignatureUint8[i * 4 + 3] = word & 0xff
    }
    
    const isValidSignature = this.verifyEd25519(
      serverSignatureUint8.slice(0, 64), // Ed25519签名是64字节
      serverNeedSignData,
      serverLongSigPublicKey
    )
    
    if (!isValidSignature) {
      throw new Error('服务器签名验证失败')
    }

    // 第八步：计算最终会话密钥
    const serverDhPublicKey = CryptoJS.enc.Base64.parse(serverDhPub)
    const serverDhPubUint8 = new Uint8Array(serverDhPublicKey.words.length * 4)
    for (let i = 0; i < serverDhPublicKey.words.length; i++) {
      const word = serverDhPublicKey.words[i]
      serverDhPubUint8[i * 4] = (word >>> 24) & 0xff
      serverDhPubUint8[i * 4 + 1] = (word >>> 16) & 0xff
      serverDhPubUint8[i * 4 + 2] = (word >>> 8) & 0xff
      serverDhPubUint8[i * 4 + 3] = word & 0xff
    }
    
    const finalSharedSecret = this.performKeyAgreement(
      this.clientKeyPairs.dhKeyPair.privateKey,
      serverDhPubUint8.slice(-32) // 取最后32字节
    )
    
    const finalSessionKey = this.deriveSessionKey(
      finalSharedSecret,
      clientSessionId, // salt
      ENV_CONFIG.CLIENT_KEY, // info
      256 // keyLength
    )

    // 将 finalSessionKey 存储到 cookie 中，保存30天
    const sessionKeyBase64 = CryptoJS.enc.Base64.stringify(CryptoJS.lib.WordArray.create(finalSessionKey))
    setCookie('finalSessionKey', sessionKeyBase64, { expires: 30 })

    // 第九步：客户端认证接口
    // 9.1 计算需要签名的数据 (clientNonce + serverNonce)
    const clientNonce = nonce // 重命名：客户端的nonce
    const serverNonceFromSession = serverNonce // 重命名：服务器返回的nonce
    const needSignDataForAuth = clientNonce + serverNonceFromSession
    
    // 9.2 使用客户端签名私钥对数据签名
    const authSignature = this.signEd25519(needSignDataForAuth, fullPrivateKey)
    const authSignatureBinary = forge.util.binary.raw.encode(authSignature)
    const authSignatureBase64 = forge.util.encode64(forge.util.createBuffer(authSignatureBinary).getBytes())
    
    // 9.3 请求客户端认证接口
    const authRequestData = {
      clientKey: ENV_CONFIG.CLIENT_KEY,
      clientSessionId: clientSessionId,
      sign: authSignatureBase64,
      timestamp: Date.now()
    }
    
    let authResponse: ClientAuthenticateResponse
    let accessToken: string
    
    try {
      authResponse = await post<ClientAuthenticateResponse>('/api/auth/token/c/authenticate', authRequestData)
      
      // 检查接口返回状态
      if (authResponse.code !== 0) {
        if (authResponse.code === -1) {
          throw new Error('SESSION_EXPIRED')
        } else {
          throw new Error('CLIENT_NOT_SUPPORTED')
        }
      }
      
      accessToken = authResponse.data.accessToken
      
      // 将 accessToken 存储到 cookie 中，保存30天
      setCookie('accessToken', accessToken, { expires: 30 })
    } catch (error) {
      // 如果是我们抛出的错误，直接传递
      if (error instanceof Error && (error.message === 'SESSION_EXPIRED' || error.message === 'CLIENT_NOT_SUPPORTED')) {
        throw error
      }
      // 其他网络错误等，统一处理为客户端不支持
      throw new Error('CLIENT_NOT_SUPPORTED')
    }
    
    // 9.4 验证JWT token
    // 计算HMAC384验证密钥: key = sha1(客户端key + 客户端会话ID + 会话秘钥)
    const keyMaterial = ENV_CONFIG.CLIENT_KEY + clientSessionId + sessionKeyBase64
    const hmacKey = CryptoJS.SHA1(keyMaterial).toString()
    
    // 使用HMAC384验证JWT token
    try {
      // 分离JWT的header.payload.signature
      const tokenParts = accessToken.split('.')
      if (tokenParts.length !== 3) {
        throw new Error('Invalid JWT format')
      }
      
      const headerPayload = tokenParts[0] + '.' + tokenParts[1]
      const signature = tokenParts[2]
      
      // 计算期望的签名
      const expectedSignature = CryptoJS.HmacSHA384(headerPayload, hmacKey).toString(CryptoJS.enc.Base64url)
      
      if (signature !== expectedSignature) {
        throw new Error('JWT token验证失败')
      }
      
      console.log('客户端认证成功，JWT token验证通过')
    } catch (error) {
      throw new Error(`JWT token验证失败: ${error instanceof Error ? error.message : String(error)}`)
    }
    
    // 存储认证信息
    this.authInfo = {
      sessionKey: finalSessionKey,
      serverSigPub,
      serverDhPub,
      clientSessionId,
      timestamp: Date.now()
    }

    return this.authInfo
  }

  /**
   * 获取当前会话密钥
   */
  static getSessionKey(): Uint8Array | null {
    return this.authInfo?.sessionKey || null
  }

  /**
   * 获取客户端会话ID
   */
  static getClientSessionId(): string | null {
    return this.authInfo?.clientSessionId || null
  }

  /**
   * 获取通用请求头（包含认证信息）
   */
  static getAuthHeaders(): Record<string, string> {
    const headers: Record<string, string> = {}
    
    // 添加客户端认证相关的头部
    const accessToken = getCookie('accessToken')
    const userToken = getCookie('userToken')
    const clientKey = import.meta.env.VITE_APP_CLIENT_KEY
    const clientSessionId = getCookie('clientSessionId') || this.getClientSessionId()
    
    if (accessToken) {
      headers['kc-token'] = accessToken
    }
    if (userToken) {
      headers['ku-token'] = userToken
    }
    if (clientKey) {
      headers['ck'] = clientKey
    }
    
    if (clientSessionId) {
      headers['sId'] = clientSessionId
    }
    
    return headers
  }

  /**
   * 获取客户端Token（兼容旧接口）
   */
  static async getClientToken(): Promise<string | null> {
    // 避免循环调用，只返回已存在的token
    return this.authInfo?.clientSessionId || null
  }

  /**
   * 获取Token密钥（兼容旧接口）
   */
  static async getTokenSecretKey(): Promise<string | null> {
    // 避免循环调用，只返回已存在的密钥
    const sessionKey = this.authInfo?.sessionKey
    return sessionKey ? CryptoJS.enc.Base64.stringify(CryptoJS.lib.WordArray.create(sessionKey)) : null
  }

  /**
   * 检查认证是否有效
   */
  static isAuthenticated(): boolean {
    return this.authInfo !== null && this.clientKeyPairs !== null
  }

  /**
   * 清除认证信息
   */
  static clearAuth(): void {
    this.authInfo = null
    this.clientKeyPairs = null
    
    // 清除客户端认证相关的 cookies
    removeCookie('clientSessionId')
    removeCookie('finalSessionKey')
    removeCookie('accessToken')
  }


  /**
   * 初始化客户端认证 (应用启动时调用)
   */
  static async initialize(): Promise<void> {
    // 检查是否已有存储的认证信息
    const storedSessionKey = getCookie('finalSessionKey')
    const storedAccessToken = getCookie('accessToken')
    
    // 情况1：两个参数都存在，跳过接口调用
    if (storedSessionKey && storedAccessToken) {
      console.log('认证信息已存在，跳过接口调用')
      
      // 恢复认证状态
      const sessionKeyBytes = CryptoJS.enc.Base64.parse(storedSessionKey)
      const sessionKeyArray = new Uint8Array(sessionKeyBytes.words.length * 4)
      for (let i = 0; i < sessionKeyBytes.words.length; i++) {
        const word = sessionKeyBytes.words[i]
        sessionKeyArray[i * 4] = (word >>> 24) & 0xff
        sessionKeyArray[i * 4 + 1] = (word >>> 16) & 0xff
        sessionKeyArray[i * 4 + 2] = (word >>> 8) & 0xff
        sessionKeyArray[i * 4 + 3] = word & 0xff
      }
      
      // 从 cookie 中获取 clientSessionId，如果没有则使用 accessToken
      const storedClientSessionId = getCookie('clientSessionId')
      
      this.authInfo = {
        sessionKey: sessionKeyArray,
        serverSigPub: '', // 这些信息在跳过流程时不需要
        serverDhPub: '',
        clientSessionId: storedClientSessionId || storedAccessToken, // 优先使用存储的 clientSessionId
        timestamp: Date.now()
      }
      
      // 初始化客户端密钥对（虽然在跳过流程时不需要，但为了保持状态一致性）
      const sigKeys = nacl.sign.keyPair()
      const dhKeys = nacl.box.keyPair()
      this.clientKeyPairs = {
        sigKeyPair: {
          privateKey: sigKeys.secretKey,
          publicKey: sigKeys.publicKey
        },
        dhKeyPair: {
          privateKey: dhKeys.secretKey,
          publicKey: dhKeys.publicKey
        }
      }
      return
    }
    
    // 情况2：有 finalSessionKey 但没有 accessToken，只需要执行 authenticate 接口
    if (storedSessionKey && !storedAccessToken) {
      // 这里需要实现只调用 authenticate 接口的逻辑
      // 暂时调用完整流程，后续可以优化
      await this.authenticate()
      return
    }
    
    // 情况3：都没有或只有 accessToken，执行完整的两个接口流程
    await this.authenticate()
  }
}

export default ClientAuthService
