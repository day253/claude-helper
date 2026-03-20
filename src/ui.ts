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

export interface WizardStatusSummary {
  activeId: string | null;
  activeLabel: string | null;
  keyMasked: string;
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
  console.log(chalk.cyan.bold(s.doneTitle), chalk.dim(s.doneOpenTerminal));
  console.log(`  ${chalk.bold('claude')}`, chalk.dim(s.doneRun));
  console.log(chalk.dim(s.doneInstall));
}
