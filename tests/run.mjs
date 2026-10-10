import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
const tests = ['native-mods', 'context-bar', 'bookmarks', 'i18n'];
if (process.env.CODEX_MODS_INTEGRATION === '1') tests.push('native-integration', 'copy-guard');
for (const test of tests) {
  const result = spawnSync(process.execPath, [fileURLToPath(new URL(`test-${test}.mjs`, import.meta.url))], {stdio: 'inherit', env: process.env});
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status ?? 1);
}
