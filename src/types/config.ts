import type { User } from "./auth";

export interface VerificationCode {
  email: string;
  code: string;
  expiresAt: number; // timestamp
}

export interface GitSyncConfig {
  enabled: boolean;
  remoteUrl?: string;
  branch?: string;
  authorName?: string;
  authorEmail?: string;
  debounceMs?: number;
  amendWindowMs?: number;
  sshKeyPath?: string;
}

export interface SystemConfig {
  notesRootPath: string;
  git?: GitSyncConfig;
}

export interface AppConfig {
  system: SystemConfig;
  users: User[];
  verificationCodes?: VerificationCode[];
}
