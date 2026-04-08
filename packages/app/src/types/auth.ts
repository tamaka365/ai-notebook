export interface WorkspacePermission {
  id: string;
  name: string;
  canRead: boolean;
  canWrite: boolean;
}

export interface UserPermissions {
  canCreateWorkspace: boolean;
  workspaces: WorkspacePermission[];
}

export interface User {
  id: string;
  username: string;
  email: string;
  passwordHash: string;
  role: "admin" | "user";
  status: "active" | "disabled";
  permissions: UserPermissions;
  createdAt: string;
  updatedAt: string;
}

export interface PublicUser {
  id: string;
  username: string;
  email: string;
  role: "admin" | "user";
  status: "active" | "disabled";
  permissions: UserPermissions;
  createdAt: string;
  updatedAt: string;
}

export interface Session {
  user: PublicUser;
  expiresAt: number;
}
