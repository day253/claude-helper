import { execFileSync } from 'node:child_process';

export type SemVer = { major: number; minor: number; patch: number };

/**
 * 同步执行 `claude --version`，解析首个 x.y.z（失败或未安装返回 null）。
 */
export function getClaudeCodeSemverSync(): SemVer | null {
  try {
    const out = execFileSync('claude', ['--version'], {
      encoding: 'utf-8',
      timeout: 5000,
      stdio: ['ignore', 'pipe', 'pipe'],
      windowsHide: true,
    });
    const m = out.trim().match(/(\d+)\.(\d+)\.(\d+)/);
    if (!m) return null;
    return { major: Number(m[1]), minor: Number(m[2]), patch: Number(m[3]) };
  } catch {
    return null;
  }
}

/**
 * 智谱 [Claude Code 文档](https://docs.bigmodel.cn/cn/coding-plan/tool/claude)：v2.1.69 起在 2.2 之前需
 * `ENABLE_TOOL_SEARCH=0`、`CLAUDE_CODE_DISABLE_EXPERIMENTAL_BETAS=1`（与 claude-opus-4-6 等兼容）。
 * 2.2.0 及以上假定已修复，不再注入。
 */
export function zhipuClaudeCodeNeedsExperimentalBetasWorkaround(v: SemVer | null): boolean {
  if (!v) return false;
  if (v.major !== 2) return false;
  if (v.minor >= 2) return false;
  if (v.minor < 1) return false;
  return v.minor === 1 && v.patch >= 69;
}
