import type { User } from "./auth";

export interface VerificationCode {
  email: string;
  code: string;
  expiresAt: number; // timestamp
}

export interface SystemConfig {
  notesRootPath: string;
}

export interface AppConfig {
  system: SystemConfig;
  users: User[];
  verificationCodes?: VerificationCode[];
}
