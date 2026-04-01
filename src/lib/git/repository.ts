import { execFile } from "child_process";
import { promisify } from "util";
import { getNotesRoot } from "@/lib/fs/notes";

const execFileAsync = promisify(execFile);

interface GitResult {
  stdout: string;
  stderr: string;
}

export class NotesGitRepository {
  private cwd: string;

  constructor() {
    this.cwd = getNotesRoot();
  }

  async isGitRepo(): Promise<boolean> {
    try {
      await this.execGit(["rev-parse", "--git-dir"]);
      return true;
    } catch {
      return false;
    }
  }

  async init(): Promise<void> {
    if (await this.isGitRepo()) return;
    await this.execGit(["init", "--initial-branch=main"]);
  }

  async setRemote(name: string, url: string, sshKeyPath?: string): Promise<void> {
    const { stdout } = await this.execGit(["remote"], { sshKeyPath });
    if (stdout.includes(name)) {
      await this.execGit(["remote", "set-url", name, url], { sshKeyPath });
    } else {
      await this.execGit(["remote", "add", name, url], { sshKeyPath });
    }
  }

  async hasChanges(): Promise<boolean> {
    const { stdout } = await this.execGit(["status", "--porcelain"]);
    return stdout.trim().length > 0;
  }

  async addAll(): Promise<void> {
    await this.execGit(["add", "."]);
  }

  async commit(message: string, authorName: string, authorEmail: string): Promise<void> {
    await this.execGit([
      "-c", `user.name=${authorName}`,
      "-c", `user.email=${authorEmail}`,
      "commit", "-m", message,
    ]);
  }

  async amendCommit(): Promise<void> {
    await this.execGit(["commit", "--amend", "--no-edit"]);
  }

  async push(remote: string, branch: string, force = false, sshKeyPath?: string): Promise<void> {
    const args = ["push", remote, branch];
    if (force) {
      args.push("--force");
    }
    await this.execGit(args, { sshKeyPath });
  }

  async getHeadCommitTimestamp(): Promise<number | null> {
    try {
      const { stdout } = await this.execGit([
        "log", "-1", "HEAD", "--format=%at",
      ]);
      const ts = parseInt(stdout.trim(), 10);
      return Number.isNaN(ts) ? null : ts;
    } catch {
      return null;
    }
  }

  private async execGit(args: string[], options?: { sshKeyPath?: string }): Promise<GitResult> {
    const sshKeyPath = options?.sshKeyPath;
    const env: NodeJS.ProcessEnv = sshKeyPath
      ? {
          ...process.env,
          GIT_SSH_COMMAND: `ssh -i ${sshKeyPath} -o StrictHostKeyChecking=no`,
        }
      : process.env;

    return execFileAsync("git", args, {
      cwd: this.cwd,
      env,
      timeout: 30000,
    });
  }
}
