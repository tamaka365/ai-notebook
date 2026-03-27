import type { User } from "./auth";

export interface SystemConfig {
  notesRootPath: string;
}

export interface AppConfig {
  system: SystemConfig;
  users: User[];
}
