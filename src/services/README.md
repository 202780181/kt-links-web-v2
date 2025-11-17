# API 服务架构说明

本项目的 API 请求架构参考了 Dify 项目的设计模式，结合 SWR 库提供了统一、高效的数据获取和状态管理解决方案。同时集成了高级客户端认证服务和通用工具库。

## 架构概览

```
src/
├── services/
│   ├── base.ts              # 基础 API 请求工具
│   ├── use-swr.ts           # SWR hooks 工具
│   ├── clientAuthService.ts # 客户端认证服务（高级加密认证）
│   ├── authService.ts       # 传统认证服务
│   ├── example.ts           # 示例服务文件
│   └── README.md            # 本文档
└── utils/
    └── cookieUtils.ts       # Cookie 操作工具
```

## 核心文件说明

### 1. base.ts - 基础 API 请求工具

提供统一的 HTTP 请求方法，包含错误处理、token 管理和请求配置。

**主要功能：**
- 自动添加认证 token
- 统一错误处理
- 请求超时控制
- 支持 SSE (Server-Sent Events)

**导出方法：**
```typescript
import { get, post, put, patch, del, ssePost, ApiError } from '@/services/base';
```

### 2. use-swr.ts - SWR Hooks 工具

基于 SWR 库封装的 React Hooks，提供响应式数据获取功能。

**主要功能：**
- GET 请求 hooks
- Mutation hooks (POST, PUT, PATCH, DELETE)
- 条件性数据获取
- 分页数据处理
- 无限滚动支持
- 缓存管理

### 3. clientAuthService.ts - 客户端认证服务

高级加密认证服务，使用 Ed25519 + X25519 密钥交换和 HKDF-SHA384 会话密钥派生。

**主要功能：**
- Ed25519 + X25519 密钥对生成
- DH 密钥交换与服务器长期密钥
- HKDF-SHA384 会话密钥派生
- AES-GCM 加密保护
- JWT token HMAC-SHA384 验证
- 智能认证流程优化
- Cookie 自动管理（30天过期）

**使用方法：**
```typescript
import ClientAuthService from '@/services/clientAuthService';

// 应用启动时初始化（自动调用）
await ClientAuthService.initialize();

// 检查认证状态
const isAuth = ClientAuthService.isAuthenticated();

// 获取会话密钥
const sessionKey = ClientAuthService.getSessionKey();

// 获取客户端令牌
const clientToken = await ClientAuthService.getClientToken();

// 清除认证信息
ClientAuthService.clearAuth();
```

**智能认证流程：**
- 两个参数都存在：跳过所有接口调用
- 只有 finalSessionKey：仅执行 authenticate 接口
- 都没有或只有 accessToken：执行完整认证流程

### 4. authService.ts - 传统认证服务

重构后的传统认证服务，同时提供传统 API 调用和 SWR hooks。

**传统方法：**
```typescript
import AuthService from '@/services/authService';

// 登录
const result = await AuthService.login({ account, password });

// 获取用户信息
const userInfo = await AuthService.getUserInfo();
```

**SWR Hooks：**
```typescript
import { useLogin, useUserInfo, useLogout } from '@/services/authService';

// 在组件中使用
const { data: userInfo, error, isLoading } = useUserInfo();
const { trigger: login, isMutating } = useLogin();
const { trigger: logout } = useLogout();
```

### 5. cookieUtils.ts - Cookie 操作工具

提供完整的 Cookie 操作功能，支持类型安全和丰富的配置选项。

**主要功能：**
```typescript
import { setCookie, getCookie, removeCookie, hasCookie, getAllCookies, clearAllCookies } from '@/utils/cookieUtils';

// 设置 Cookie（30天过期）
setCookie('userToken', 'abc123', { expires: 30 });

// 获取 Cookie
const token = getCookie('userToken');

// 删除 Cookie
removeCookie('userToken');

// 检查是否存在
const exists = hasCookie('userToken');

// 获取所有 Cookie
const allCookies = getAllCookies();

// 清除所有 Cookie
clearAllCookies();
```

**配置选项：**
```typescript
interface CookieOptions {
  expires?: number        // 过期天数
  expiresDate?: Date     // 具体过期时间
  path?: string          // 路径
  domain?: string        // 域名
  secure?: boolean       // 安全传输
  sameSite?: 'strict' | 'lax' | 'none'  // SameSite 策略
  httpOnly?: boolean     // HttpOnly
}
```

## 使用指南

### 1. 客户端认证集成

客户端认证服务会在应用启动时自动初始化，无需手动调用：

```typescript
// src/components/AppInitializer/AppInitializer.tsx
import ClientAuthService from '@/services/clientAuthService';

// 自动执行智能认证流程
await ClientAuthService.initialize();
```

**认证状态管理：**
```typescript
// 检查认证状态
if (ClientAuthService.isAuthenticated()) {
  // 用户已认证，可以进行 API 调用
  const sessionKey = ClientAuthService.getSessionKey();
}

// 清除认证（登出时）
ClientAuthService.clearAuth();
```

### 2. Cookie 工具使用

```typescript
import { setCookie, getCookie } from '@/utils/cookieUtils';

// 存储用户偏好设置
setCookie('theme', 'dark', { expires: 365 });
setCookie('language', 'zh-CN', { expires: 30, path: '/' });

// 读取设置
const theme = getCookie('theme');
const language = getCookie('language');
```

### 3. 基础 API 调用

```typescript
import { get, post, put, del } from '@/services/base';

// GET 请求
const users = await get<User[]>('/users');

// POST 请求
const newUser = await post<User>('/users', { name: 'John', email: 'john@example.com' });

// PUT 请求
const updatedUser = await put<User>('/users/123', { name: 'Jane' });

// DELETE 请求
await del('/users/123');
```

### 4. SWR Hooks 使用

```typescript
import { useSwrGet, useSwrPost } from '@/services/use-swr';

function UserList() {
  // 获取数据
  const { data: users, error, isLoading } = useSwrGet<User[]>('/users');
  
  // 创建用户
  const { trigger: createUser, isMutating } = useSwrPost<User, CreateUserRequest>('/users');
  
  const handleCreateUser = async () => {
    try {
      const newUser = await createUser({ name: 'John', email: 'john@example.com' });
      console.log('User created:', newUser);
    } catch (error) {
      console.error('Failed to create user:', error);
    }
  };
  
  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;
  
  return (
    <div>
      {users?.map(user => <div key={user.id}>{user.name}</div>)}
      <button onClick={handleCreateUser} disabled={isMutating}>
        {isMutating ? 'Creating...' : 'Create User'}
      </button>
    </div>
  );
}
```

### 5. 创建新的服务文件

参考 `example.ts` 文件，创建新的服务文件：

```typescript
// services/productService.ts
import { get, post, put, del } from './base';
import { useSwrGet, useSwrPost } from './use-swr';

// 类型定义
export interface Product {
  id: string;
  name: string;
  price: number;
}

// 基础 API 服务
export const productService = {
  async getProducts(): Promise<Product[]> {
    return get<Product[]>('/products');
  },
  
  async createProduct(data: Omit<Product, 'id'>): Promise<Product> {
    return post<Product>('/products', data);
  },
};

// SWR Hooks
export function useProducts() {
  return useSwrGet<Product[]>('/products');
}

export function useCreateProduct() {
  return useSwrPost<Product, Omit<Product, 'id'>>('/products');
}
```

### 6. 高级用法

#### 条件性数据获取
```typescript
const { data } = useSwrGet<User>(
  shouldFetchUser ? `/users/${userId}` : null
);
```

#### 分页数据
```typescript
const { data } = useSwrPagination<UserListResponse>('/users', page, pageSize);
```

#### 依赖性数据获取
```typescript
function UserProfile({ userId }: { userId: string }) {
  const { data: user } = useSwrGet<User>(`/users/${userId}`);
  const { data: posts } = useSwrGet<Post[]>(
    user ? `/users/${user.id}/posts` : null
  );
  
  return (
    <div>
      <h1>{user?.name}</h1>
      <div>{posts?.length} posts</div>
    </div>
  );
}
```

#### 乐观更新
```typescript
import { optimisticUpdate } from '@/services/use-swr';

const handleLike = async (postId: string) => {
  // 乐观更新 UI
  optimisticUpdate(`/posts/${postId}`, { ...post, liked: true });
  
  try {
    await post(`/posts/${postId}/like`);
  } catch (error) {
    // 如果失败，恢复原始状态
    optimisticUpdate(`/posts/${postId}`, post);
  }
};
```

## 最佳实践

### 1. 认证服务最佳实践

```typescript
// 在 API 请求前检查认证状态
if (!ClientAuthService.isAuthenticated()) {
  // 重新初始化认证
  await ClientAuthService.initialize();
}

// 在应用启动时预检查 Cookie
const hasAuth = getCookie('finalSessionKey') && getCookie('accessToken');
if (hasAuth) {
  console.log('用户已认证，快速启动');
}
```

### 2. Cookie 安全实践

```typescript
// 敏感数据使用安全配置
setCookie('sessionToken', token, {
  expires: 1,           // 1天过期
  secure: true,         // 仅 HTTPS
  sameSite: 'strict',   // 严格同站策略
  path: '/'             // 全站可用
});

// 清理过期或无效的认证信息
if (!ClientAuthService.isAuthenticated()) {
  removeCookie('finalSessionKey');
  removeCookie('accessToken');
}
```

### 3. 错误处理

```typescript
const { data, error } = useSwrGet<User[]>('/users', {
  onError: (error) => {
    console.error('Failed to load users:', error);
    // 可以在这里显示错误提示
  },
});
```

### 4. 缓存策略

```typescript
const { data } = useSwrGet<User>(`/users/${id}`, {
  revalidateOnFocus: false,    // 窗口聚焦时不重新验证
  dedupingInterval: 60000,     // 1分钟内不重复请求
  errorRetryCount: 3,          // 错误重试次数
});
```

### 5. 数据预加载

```typescript
import { preloadData } from '@/services/use-swr';

// 在路由跳转前预加载数据
const handleNavigate = () => {
  preloadData('/users');
  navigate('/users');
};
```

### 6. 清除缓存

```typescript
import { clearCache } from '@/services/use-swr';

// 清除特定缓存
clearCache('/users');

// 清除所有缓存
clearCache();
```

## 迁移指南

### 从旧的 API 调用迁移

**旧方式：**
```typescript
import { api } from '@/utils/api';

const users = await api.get('/users');
```

**新方式：**
```typescript
// 方式1：直接使用 base.ts
import { get } from '@/services/base';
const users = await get('/users');

// 方式2：使用 SWR hooks（推荐）
import { useSwrGet } from '@/services/use-swr';
const { data: users } = useSwrGet('/users');

// 方式3：仍然使用旧的 api 对象（向后兼容）
import { api } from '@/utils/api';
const users = await api.get('/users'); // 内部已重构为使用新架构
```

## 注意事项

1. **向后兼容性**：旧的 `api` 对象仍然可用，内部已重构为使用新的 base.ts 方法
2. **类型安全**：所有方法都支持 TypeScript 泛型，确保类型安全
3. **错误处理**：新架构提供了统一的错误处理机制
4. **性能优化**：SWR 提供了缓存、去重、重试等性能优化功能
5. **开发体验**：提供了丰富的 hooks 和工具函数，提升开发效率
6. **安全性**：客户端认证服务使用军用级加密算法，确保通信安全
7. **智能缓存**：认证信息自动缓存30天，提升用户体验
8. **Cookie 管理**：统一的 Cookie 工具确保数据一致性和安全性

## 相关资源

- [SWR 官方文档](https://swr.vercel.app/)
- [Dify 项目](https://github.com/langgenius/dify)
- [TypeScript 官方文档](https://www.typescriptlang.org/)
- [TweetNaCl 加密库](https://github.com/dchest/tweetnacl-js)
- [Noble Hashes](https://github.com/paulmillr/noble-hashes)
- [Ed25519 签名算法](https://ed25519.cr.yp.to/)
- [X25519 密钥交换](https://tools.ietf.org/html/rfc7748)