import chalk from 'chalk';
import type { WizardCopy } from './wizard-locale.js';

const INNER = 57;

function padLine(s: string): string {
  const t = s.length > INNER ? `${s.slice(0, INNER - 1)}…` : s;
  return `║ ${t.padEnd(INNER)} ║`;
}

export function printWizardBanner(s: WizardCopy, title?: string, subtitle?: string): void {
  const top = `╔${'═'.repeat(INNER + 2)}╗`;
  const bot = `╚${'═'.repeat(INNER + 2)}╝`;
  console.log(chalk.cyan(top));
  console.log(chalk.cyan.bold(padLine(` ${(title ?? s.bannerTitle).trim()} `)));
  console.log(chalk.cyan(padLine(subtitle ?? s.bannerSubtitle)));
  console.log(chalk.cyan(bot));
}

export function printWizardIntro(s: WizardCopy): void {
  console.log(chalk.bold(`\n${s.introTitle}`));
  console.log(s.introLine1);
  console.log(s.introLine2);
  console.log(chalk.bold(`\n${s.introVs}`));
  console.log(s.introOfficial);
  console.log(s.introThisTool);
}

export type SettingsSyncVariant = 'green' | 'yellow' | 'red' | 'dim';

export interface WizardStatusSummary {
  activeId: string | null;
  activeLabel: string | null;
  keyMasked: string;
  /** 与 ~/.claude/settings.json 对齐摘要（主菜单展示） */
  settingsSync?: { text: string; variant: SettingsSyncVariant };
}

/** 与 coding-helper 类似：列表操作前的单行提示 */
export function printWizardHints(s: WizardCopy): void {
  console.log(
    chalk.gray('💡 ') +
      chalk.gray(s.wizardHintNav) +
      chalk.gray(' | ') +
      chalk.gray(s.wizardHintConfirm) +
      '\n',
  );
}

export function printWizardStatus(s: WizardCopy, st: WizardStatusSummary): void {
  console.log(chalk.bold(`\n${s.statusTitle}`));
  if (st.activeId && st.activeLabel) {
    console.log(`  ${s.statusDefault}${st.activeLabel}（${chalk.cyan(st.activeId)}）`);
  } else {
    console.log(
      `  ${s.statusDefault}${chalk.yellow(s.statusNotChosen)} ${chalk.dim(s.statusSuggest)}`,
    );
  }
  console.log(`  ${s.statusApiKey}${st.keyMasked}`);
  if (st.settingsSync) {
    const paint =
      st.settingsSync.variant === 'green'
        ? chalk.green
        : st.settingsSync.variant === 'yellow'
          ? chalk.yellow
          : st.settingsSync.variant === 'red'
            ? chalk.red
            : chalk.dim;
    console.log(`  ${s.statusSettingsSyncTitle}${paint(st.settingsSync.text)}`);
  }
  console.log(chalk.dim(s.statusFootnote));
}

export function printSection(title: string): void {
  console.log(chalk.bold(`\n── ${title} ──`));
}

export function printOperationHint(s: WizardCopy): void {
  console.log(chalk.dim(s.opHint));
}

export function printClaudeGlobalWarning(s: WizardCopy): void {
  console.log(chalk.yellow(s.warnClaudeGlobal1));
  console.log(chalk.dim(s.warnClaudeGlobal2));
}

export function printConfigSyncSummary(
  s: WizardCopy,
  params: {
    providerLabel: string;
    providerId: string;
    keyMasked: string;
    claudeBase: string;
  },
): void {
  const { providerLabel, providerId, keyMasked, claudeBase } = params;
  console.log(chalk.bold(`\n${s.syncLocalHeader}`));
  console.log(`${s.syncVendor}${providerLabel}（${providerId}）`);
  console.log(`${s.syncKey}${keyMasked}`);
  console.log(chalk.bold(s.syncClaudeHeader));
  console.log(`${s.syncAnthropicRoot}${claudeBase}`);
  console.log(chalk.green(s.syncDone));
}

export function printClaudeDoneHint(s: WizardCopy): void {
  console.log();
  console.log(
    chalk.cyan('❯ >  ') + chalk.cyan.bold(s.doneLaunchTitle) + chalk.dim(s.doneLaunchHint),
  );
  console.log(chalk.dim(s.doneInstall));
}
