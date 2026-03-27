export interface User {
  id: string;
  username: string;
  email: string;
  passwordHash: string;
  role: "admin" | "user";
  status: "active" | "disabled";
  permissions: {
    directories: string[];
    operations: ("read" | "write" | "delete" | "admin")[];
  };
  createdAt: string;
  updatedAt: string;
}

export interface PublicUser {
  id: string;
  username: string;
  email: string;
  role: "admin" | "user";
  status: "active" | "disabled";
  permissions: {
    directories: string[];
    operations: ("read" | "write" | "delete" | "admin")[];
  };
  createdAt: string;
  updatedAt: string;
}

export interface Session {
  user: PublicUser;
  expiresAt: number;
}
