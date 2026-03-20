import chalk from 'chalk';
import { PROVIDERS, PROVIDER_IDS, type ProviderId } from './providers.js';
import {
  buildClaudeEnv,
  claudeSettingsPath,
  effectiveClaudeBase,
  effectiveOpenAIBase,
} from './claude.js';
import type { ConfigFile } from './store.js';

const PROBE_TIMEOUT_MS = 8000;
const UA = 'llm-providers-config/check';

/** 轻量探测：能连上主机即可（多数 API 根路径返回 401/404 仍算「可达」） */
export async function probeUrl(url: string): Promise<{ ok: boolean; detail: string }> {
  try {
    const res = await fetch(url, {
      method: 'GET',
      redirect: 'follow',
      signal: AbortSignal.timeout(PROBE_TIMEOUT_MS),
      headers: { 'User-Agent': UA },
    });
    const st = res.status;
    if (st >= 500) {
      return { ok: false, detail: `HTTP ${st}（服务端报错）` };
    }
    return { ok: true, detail: `HTTP ${st}` };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return { ok: false, detail: msg };
  }
}

/**
 * 保存配置后自动调用：结构检查 + 默认供应商端点探测 + 启动 Claude 提示
 */
export async function validateAfterSave(cfg: ConfigFile): Promise<void> {
  console.log(chalk.bold('\n── 自动检查 ──'));

  const withKey = PROVIDER_IDS.filter((id) => cfg.providers[id]?.api_key?.trim());
  if (withKey.length === 0) {
    console.log(chalk.yellow('还没有任何供应商填写 API Key；补全后再运行：llm-config check'));
    printClaudeHelp(cfg, false, false);
    return;
  }

  console.log(chalk.green(`已保存 Key 的供应商：${withKey.join('、')}`));

  const active = cfg.active_provider;
  if (!active) {
    console.log(chalk.yellow('未设置默认供应商。执行：llm-config active <id>'));
    printClaudeHelp(cfg, false, false);
    return;
  }

  const entry = cfg.providers[active];
  if (!entry?.api_key?.trim()) {
    console.log(
      chalk.yellow(
        `默认供应商是「${PROVIDERS[active].label}」，但未配置 Key；请改 active 或执行：llm-config set ${active}`,
      ),
    );
    printClaudeHelp(cfg, false, false);
    return;
  }

  const openaiBase = effectiveOpenAIBase(active, entry);
  const claudeBase = effectiveClaudeBase(active, entry);

  let anyNetFail = false;
  const probes: Promise<void>[] = [];
  probes.push(
    probeUrl(openaiBase).then((r) => {
      if (!r.ok) anyNetFail = true;
      const mark = r.ok ? chalk.green('✓') : chalk.red('✗');
      console.log(`${mark} OpenAI 兼容地址\n    ${openaiBase}\n    ${r.detail}`);
    }),
  );

  if (claudeBase) {
    probes.push(
      probeUrl(claudeBase).then((r) => {
        if (!r.ok) anyNetFail = true;
        const mark = r.ok ? chalk.green('✓') : chalk.red('✗');
        console.log(`${mark} Claude Code（Anthropic 兼容）地址\n    ${claudeBase}\n    ${r.detail}`);
      }),
    );
  } else {
    console.log(
      chalk.yellow(
        `○ 当前默认供应商无内置 Claude 端点；Claude Code 需 LiteLLM 等网关，并设置：\n    llm-config set ${active} --anthropic-base <网关URL>`,
      ),
    );
  }

  await Promise.all(probes);
  if (anyNetFail) {
    console.log(
      chalk.dim(
        '    若需代理，可设置 HTTPS_PROXY（参见 https://docs.z.ai/devpack/extension/coding-tool-helper 排障）',
      ),
    );
  }

  let canBuildClaude = false;
  if (claudeBase) {
    try {
      buildClaudeEnv(active, entry);
      canBuildClaude = true;
      console.log(chalk.green('✓ 可生成 Claude Code 所需环境变量（网络与 Key 格式层面未再校验厂商鉴权）'));
    } catch {
      console.log(chalk.red('✗ 无法组合出 Claude 环境变量'));
    }
  }

  printClaudeHelp(cfg, true, canBuildClaude);
}

function printClaudeHelp(cfg: ConfigFile, hasActiveKey: boolean, canApply: boolean): void {
  console.log(chalk.bold('\n── 启动 Claude Code ──'));
  const active = cfg.active_provider;
  const entry = active ? cfg.providers[active] : undefined;

  if (!hasActiveKey || !active || !entry?.api_key?.trim()) {
    console.log(chalk.cyan('1) 先为默认供应商保存 API Key，并设置默认：llm-config active <供应商id>'));
    console.log(chalk.dim('   说明：https://docs.anthropic.com/en/docs/claude-code/overview'));
    console.log(chalk.dim('   随时复查：llm-config check\n'));
    return;
  }

  if (canApply) {
    console.log(
      chalk.cyan(
        `1) 把环境变量写入本机 Claude 配置（会自动备份已有 ${claudeSettingsPath()}）：\n   ${chalk.bold('llm-config claude apply')}`,
      ),
    );
    console.log(
      chalk.cyan(
        `2) 在终端启动 Claude Code（若已安装 CLI）：\n   ${chalk.bold('claude')}\n   或在常用目录打开你平时的 Claude Code 入口。`,
      ),
    );
    console.log(
      chalk.dim(
        '   官方文档：https://docs.anthropic.com/en/docs/claude-code/overview\n   若只想临时生效当前终端：llm-config claude export 后 eval 打印的内容\n',
      ),
    );
    return;
  }

  console.log(
    chalk.yellow(
      '当前默认供应商不能一键 claude apply。请先搭好 Anthropic 兼容网关（如 LiteLLM），然后：\n' +
        `   llm-config set ${active} --anthropic-base <你的网关根URL>\n` +
        '   llm-config claude apply\n',
    ),
  );
  console.log(chalk.dim('   说明见 README「LiteLLM」一节与 doc/technical-guide-zh.md\n'));
}
