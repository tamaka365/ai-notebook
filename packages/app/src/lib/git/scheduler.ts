import { NotesGitRepository } from "./repository";
import type { GitSyncConfig } from "@/types/config";

interface SyncStatus {
  pending: boolean;
  isRunning: boolean;
  lastError: string | null;
  lastSyncedAt: Date | null;
}

class GitSyncScheduler {
  private repo = new NotesGitRepository();
  private status: SyncStatus = {
    pending: false,
    isRunning: false,
    lastError: null,
    lastSyncedAt: null,
  };
  private timer: ReturnType<typeof setTimeout> | null = null;

  requestSync(config: GitSyncConfig): void {
    if (!config.enabled) return;

    this.status.pending = true;

    if (this.timer) {
      clearTimeout(this.timer);
    }

    const debounceMs = config.debounceMs ?? 10000;
    this.timer = setTimeout(() => {
      void this.runSync(config);
    }, debounceMs);
  }

  getStatus(): SyncStatus {
    return { ...this.status };
  }

  private async runSync(config: GitSyncConfig): Promise<void> {
    if (this.status.isRunning) {
      const debounceMs = config.debounceMs ?? 10000;
      this.timer = setTimeout(() => {
        void this.runSync(config);
      }, debounceMs);
      return;
    }

    this.status.pending = false;
    this.status.isRunning = true;
    this.status.lastError = null;

    try {
      await this.repo.init();

      if (config.remoteUrl) {
        await this.repo.setRemote("origin", config.remoteUrl, config.sshKeyPath);
      }

      if (!(await this.repo.hasChanges())) {
        this.status.lastSyncedAt = new Date();
        return;
      }

      await this.repo.addAll();

      const headTimestamp = await this.repo.getHeadCommitTimestamp();
      const nowSeconds = Math.floor(Date.now() / 1000);
      const amendWindowMs = config.amendWindowMs ?? 60000;
      const withinWindow =
        headTimestamp !== null &&
        (nowSeconds - headTimestamp) * 1000 <= amendWindowMs;

      if (withinWindow) {
        await this.repo.amendCommit();
        if (config.remoteUrl) {
          await this.repo.push(
            "origin",
            config.branch ?? "main",
            true,
            config.sshKeyPath
          );
        }
      } else {
        const message = `Auto sync: ${new Date().toISOString()}`;
        await this.repo.commit(
          message,
          config.authorName ?? "AI Notebook",
          config.authorEmail ?? "bot@ai-notebook.local"
        );
        if (config.remoteUrl) {
          await this.repo.push(
            "origin",
            config.branch ?? "main",
            false,
            config.sshKeyPath
          );
        }
      }

      this.status.lastSyncedAt = new Date();
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      this.status.lastError = msg;
      console.error("[GitSync] 同步失败:", msg);
    } finally {
      this.status.isRunning = false;
    }
  }
}

export const gitScheduler = new GitSyncScheduler();
