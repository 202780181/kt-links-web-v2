import api, { type ApiResponse } from '../services/base';

// 修改密码参数接口
interface ChangePasswordParams {
  oldPassword: string;
  newPassword: string;
  newPassword2: string;
}

// 用户信息接口
interface UserProfile {
  id: string;
  account: string;
  name: string;
  email: string;
  phone: string;
  userStatus: number;
  createTs: string;
  updateTs: string;
}

/**
 * 修改密码
 */
export const changePassword = async (params: ChangePasswordParams): Promise<ApiResponse<boolean>> => {
  return await api.post<ApiResponse<boolean>>('/api/user/profile/password', params);
};

/**
 * 获取用户信息
 */
export const getUserProfile = async (): Promise<ApiResponse<UserProfile>> => {
  return await api.get<ApiResponse<UserProfile>>('/api/user/profile');
};

/**
 * 更新用户信息
 */
export const updateUserProfile = async (params: Partial<UserProfile>): Promise<ApiResponse<boolean>> => {
  return await api.put<ApiResponse<boolean>>('/api/user/profile', params);
};


// 导出类型供其他文件使用
export type {
  ChangePasswordParams,
  UserProfile
};
