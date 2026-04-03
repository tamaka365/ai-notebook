import type { UserPermissions } from "./auth";

// 通用响应格式
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
}

// 登录
export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: {
    id: string;
    username: string;
    role: string;
    email: string;
  };
}

// 用户列表响应
export interface UserListResponse {
  users: {
    id: string;
    username: string;
    email: string;
    role: string;
    status: string;
    permissions: UserPermissions;
    createdAt: string;
    updatedAt: string;
  }[];
}

// 创建用户请求
export interface CreateUserRequest {
  username: string;
  email: string;
  password: string;
  role: "admin" | "user";
  permissions: UserPermissions;
}

// 更新用户请求
export interface UpdateUserRequest {
  id: string;
  email: string;
  role: "admin" | "user";
  permissions: UserPermissions;
}
