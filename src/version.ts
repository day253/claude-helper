import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const pkgPath = join(dirname(fileURLToPath(import.meta.url)), '..', 'package.json');

export const PKG_VERSION: string = (() => {
  try {
    const j = JSON.parse(readFileSync(pkgPath, 'utf-8')) as { version?: string };
    return j.version ?? '0.0.0';
  } catch {
    return '0.0.0';
  }
})();
