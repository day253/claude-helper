import chalk from 'chalk';

const INNER = 57;

function padLine(s: string): string {
  const t = s.length > INNER ? `${s.slice(0, INNER - 1)}…` : s;
  return `║ ${t.padEnd(INNER)} ║`;
}

/** 顶部大标题（风格接近 coding-helper 的 box） */
export function printWizardBanner(title: string, subtitle?: string): void {
  const top = `╔${'═'.repeat(INNER + 2)}╗`;
  const bot = `╚${'═'.repeat(INNER + 2)}╝`;
  console.log(chalk.cyan(top));
  console.log(chalk.cyan.bold(padLine(` ${title.trim()} `)));
  if (subtitle) console.log(chalk.cyan(padLine(subtitle)));
  console.log(chalk.cyan(bot));
}

export function printSection(title: string): void {
  console.log(chalk.bold(`\n── ${title} ──`));
}

export function printNavHint(): void {
  console.log(chalk.dim('\n💡 ↑↓ 移动光标 | Enter 确认\n'));
}

/** 与写入 ~/.claude/settings.json 相关的全局提示 */
export function printClaudeGlobalWarning(): void {
  console.log(
    chalk.yellow(
      '⚠️  Warning: 以下操作会修改 Claude Code 的**用户级**配置（通常即 ~/.claude/settings.json），对所有工作区生效。',
    ),
  );
  console.log(chalk.dim('   写入前会自动备份已有 settings.json。\n'));
}

export function printOfficialHelperHint(): void {
  console.log(
    chalk.dim(
      '提示：若需安装 CLI、多编码工具（OpenCode / Crush 等）、MCP、插件市场，请使用官方：npx @z_ai/coding-helper\n',
    ),
  );
}

export function printConfigSyncSummary(params: {
  providerLabel: string;
  providerId: string;
  keyMasked: string;
  claudeBase: string;
}): void {
  const { providerLabel, providerId, keyMasked, claudeBase } = params;
  console.log(chalk.bold('\nClaude Helper 配置:'));
  console.log(`  默认供应商: ${providerLabel} (${providerId})`);
  console.log(`  API Key: ${keyMasked}`);
  console.log(chalk.bold('\nClaude Code（将写入的 Anthropic 根）:'));
  console.log(`  ${claudeBase}`);
  console.log(chalk.green('\n✅ 本地 YAML 已保存；若尚未执行 apply，Claude Code 仍使用旧 settings.json 或环境变量。'));
}
