import { getConfig } from "@/lib/config/manager";
import { gitScheduler } from "./scheduler";

export function triggerGitSync(): void {
  const config = getConfig();
  if (!config.system.git?.enabled) return;
  gitScheduler.requestSync(config.system.git);
}

export function getGitSyncStatus() {
  return gitScheduler.getStatus();
}
