import {
  post,
  get,
  getAuthHeaders,
  mergeHeaders
} from './base';
import CryptoJS from 'crypto-js';
import ClientAuthService from './clientAuthService';
import { processUserPassword } from '../utils/passwordUtils';
import { setCookie, getCookie, removeCookie } from '../utils/cookieUtils';

// 用户登录请求接口
export interface UserLoginRequest {
  account: string;
  password: string;
}

// 用户登录响应接口
export interface UserLoginResponse {
  code: number;
  msg: string;
  data: {
    accessToken: string; // 用户 token
    tokenSecretKey: string; // token秘钥key (客户端公钥加密后的数据)
    expireTs: number; // 过期时间
  };
}

// 用户信息接口
export interface UserProfile {
  type: string; // 用户类型
  account: string; // 登录账号
  name: string; // 姓名
  email: string; // 邮箱
  phone: string; // 用户手机号
  attr: object; // 用户属性
  userStatus: number; // 用户状态
}

// 用户信息响应接口
export interface UserProfileResponse {
  code: number;
  msg: string;
  data: UserProfile;
}

// 用户认证信息存储
interface UserAuthInfo {
  userToken: string;
  tokenSecretKey: string;
  expireTs: number;
  userProfile?: UserProfile;
}

class UserAuthService {
  private static userAuthInfo: UserAuthInfo | null = null;

  /**
   * 用户登录
   */
  static async login(request: UserLoginRequest): Promise<UserAuthInfo> {
    // 确保客户端已认证
    if (!ClientAuthService.isAuthenticated()) {
      await ClientAuthService.initialize();
    }

    // 获取客户端认证信息
    const clientToken = getCookie('accessToken');
    const clientKey = import.meta.env.VITE_APP_CLIENT_KEY;
    const clientSessionId = await ClientAuthService.getClientToken();

    console.log('客户端认证状态检查:', {
      clientToken: !!clientToken,
      clientKey: !!clientKey,
      clientSessionId: !!clientSessionId,
      isAuthenticated: ClientAuthService.isAuthenticated(),
    });

    if (!clientToken || !clientKey || !ClientAuthService.isAuthenticated()) {
      throw new Error('CLIENT_NOT_SUPPORTED');
    }

    // 处理用户密码
    const processedPassword = processUserPassword(request.password);

    // 构建登录请求
    const loginData = {
      account: request.account,
      password: processedPassword,
    };

    try {
      // 发送登录请求
      const response = await post<UserLoginResponse>('/api/auth/token/u/login', loginData, {
        headers: getAuthHeaders(),
      });

      const { accessToken: userToken, tokenSecretKey, expireTs } = response.data;

      // 验证 JWT token
      await this.verifyUserToken(userToken);

      // 存储用户认证信息
      this.userAuthInfo = {
        userToken,
        tokenSecretKey,
        expireTs,
      };

      // 将用户token存储到cookie中，cookie本身的过期时间就是token的过期时间
      const expirationDate = new Date(expireTs); // expireTs已经是毫秒时间戳，无需乘以1000
      setCookie('userToken', userToken, { expiresDate: expirationDate });
      setCookie('userTokenSecretKey', tokenSecretKey, { expiresDate: expirationDate });

      return this.userAuthInfo;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('LOGIN_FAILED');
    }
  }

  /**
   * 验证用户 JWT token
   */
  private static async verifyUserToken(token: string): Promise<void> {
    try {
      // 获取会话密钥进行解密
      const sessionKey = ClientAuthService.getSessionKey();
      if (!sessionKey) {
        throw new Error('SESSION_KEY_NOT_FOUND');
      }

      // 从 cookie 中获取 finalSessionKey 作为 JWT 验证密钥
      const secretKey = getCookie('finalSessionKey');
      if (!secretKey) {
        throw new Error('FINAL_SESSION_KEY_NOT_FOUND');
      }

      // 分离JWT的header.payload.signature
      const tokenParts = token.split('.');
      if (tokenParts.length !== 3) {
        throw new Error('Invalid JWT format');
      }

      const headerPayload = tokenParts[0] + '.' + tokenParts[1];
      const signature = tokenParts[2];

      // 使用HMAC384验证JWT token
      const expectedSignature = CryptoJS.HmacSHA384(headerPayload, secretKey).toString(CryptoJS.enc.Base64url);

      if (signature !== expectedSignature) {
        throw new Error('JWT token验证失败');
      }

      console.log('用户JWT token验证成功');
    } catch (error) {
      throw new Error(`JWT token验证失败: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * 获取用户信息
   */
  static async getUserProfile(): Promise<UserProfile> {
    // 确保认证状态是最新的
    if (!this.isLoggedIn()) {
      throw new Error('USER_NOT_LOGGED_IN');
    }

    // 如果已缓存用户信息且认证信息有效，直接返回
    if (this.userAuthInfo?.userProfile) {
      return this.userAuthInfo.userProfile;
    }

    // 获取认证信息
    const userToken = this.userAuthInfo?.userToken || getCookie('userToken');
    const clientToken = getCookie('accessToken');

    if (!userToken || !clientToken) {
      console.log('缺少必要的认证token');
      throw new Error('AUTHENTICATION_REQUIRED');
    }

    try {
      // 获取用户信息
      const profileResponse = await get<UserProfileResponse>('/api/user/profile/base-info', {
        headers: mergeHeaders({
          // Authorization: `Bearer ${userToken}`,
        }),
      });


      // 缓存用户信息
      if (this.userAuthInfo) {
        this.userAuthInfo.userProfile = profileResponse.data;
      }

      return profileResponse.data;
    } catch (error) {
      // 如果是网络错误或其他错误，不要清除认证状态
      if (error instanceof Error) {
        if (error.message === 'SESSION_EXPIRED') {
          throw error;
        }
        console.warn('获取用户信息失败，但保留认证状态:', error.message);
        throw new Error('FETCH_PROFILE_FAILED');
      }
      throw new Error('FETCH_PROFILE_FAILED');
    }
  }

  /**
   * 检查用户是否已登录
   */
  static isLoggedIn(): boolean {
    // 优先检查内存中的认证信息
    if (this.userAuthInfo) {
      const now = Date.now();
      const isValid = now < this.userAuthInfo.expireTs;

      if (!isValid) {
        // 如果内存中的token已过期，清除内存状态
        console.log('内存中的用户token已过期，清除状态');
        this.userAuthInfo = null;
        return false;
      }
      return true;
    }

    // 检查cookie中是否存在userToken，如果cookie存在说明未过期
    const userToken = getCookie('userToken');
    return !!userToken;
  }

  /**
   * 获取用户token
   */
  static getUserToken(): string | null {
    return this.userAuthInfo?.userToken || getCookie('userToken');
  }

  /**
   * 用户登出
   */
  static async logout(): Promise<void> {
    try {
      // 调用服务器登出接口
      await post(
        '/api/auth/token/u/logout',
        {},
        {
          headers: getAuthHeaders(),
        }
      );
    } catch (error) {
      console.warn('服务器登出接口调用失败，继续清除本地状态:', error);
    }

    // 清除内存中的用户信息
    this.userAuthInfo = null;

    // 清除cookie中的用户信息
    removeCookie('userToken');
    removeCookie('userTokenSecretKey');

    // 注意：不清除客户端认证信息（ClientAuthService），保留认证token
    // ClientAuthService.clearAuth()
  }

  /**
   * 从cookie恢复用户认证状态
   */
  static restoreAuthFromCookie(): boolean {
    // 如果内存中已有有效的认证信息，直接返回
    if (this.userAuthInfo) {
      const now = Date.now();
      if (now < this.userAuthInfo.expireTs) {
        console.log('内存中已有有效的认证信息，跳过cookie恢复');
        return true;
      }
    }

    const userToken = getCookie('userToken');
    const tokenSecretKey = getCookie('userTokenSecretKey');

    if (!userToken || !tokenSecretKey) {
      console.log('Cookie中缺少必要的认证信息');
      return false;
    }

    // 由于cookie存在且未过期，我们需要计算一个合理的内存过期时间
    // 这里设置为当前时间+24小时，实际过期以cookie为准
    const expireTs = Date.now() + 24 * 60 * 60 * 1000;

    // 恢复到内存中
    this.userAuthInfo = {
      userToken,
      tokenSecretKey,
      expireTs,
    };
    return true;
  }
}

export const userAuthService = UserAuthService;
export default UserAuthService;
