// Review submissions without executing their content or importing native application bundles.
import fs from 'node:fs';
import vm from 'node:vm';
import {fileURLToPath} from 'node:url';
const root = new URL('../', import.meta.url);
const strip = text => text.replace(/^import\s*\{[\s\S]*?\}\s*from\s*['"][^'"]+['"];\s*/gm, '').replaceAll('export ', '');
const context = vm.createContext({TextEncoder, TextDecoder, URLSearchParams, AbortController, setTimeout, clearTimeout});
vm.runInContext(['jarvis-visual-mods-state.js', 'jarvis-community-state.js'].map(name => strip(fs.readFileSync(new URL('src/' + name, root), 'utf8'))).join('\n') + '\nglobalThis.catalogApi={parseCommunityCatalog,parseCommunitySubmission,exportVisualPackage,communityApi};', context);
export const catalogApi = context.catalogApi;
export function approveIssue(catalog, issue, now = new Date().toISOString()) {
  if (!Number.isSafeInteger(issue.number) || issue.number < 1 || issue.pull_request || issue.state !== 'open') throw Error('An open mod submission issue is required.');
  const mod = catalogApi.parseCommunitySubmission(issue.body);
  if (catalog.mods.some(entry => entry.package.mod.id === mod.id && entry.issueNumber !== issue.number)) throw Error('Mod ID belongs to another catalog entry. Ask the author to use a new ID.');
  const entry = {publisher: issue.user.login, issueNumber: issue.number, package: JSON.parse(catalogApi.exportVisualPackage(mod))};
  return catalogApi.parseCommunityCatalog(JSON.stringify({...catalog, updatedAt: now, mods: [...catalog.mods.filter(item => item.issueNumber !== issue.number), entry]}));
}
async function main() {
  const [action, rawNumber] = process.argv.slice(2);
  const path = fileURLToPath(new URL('community/catalog.json', root));
  let catalog = catalogApi.parseCommunityCatalog(fs.readFileSync(path, 'utf8'));
  if (action === '--validate' && rawNumber === undefined) {console.log(`Valid community catalog: ${catalog.mods.length} mods.`); return;}
  if (!['--approve-issue', '--remove-issue'].includes(action) || !/^[1-9]\d{0,8}$/.test(rawNumber ?? '') || process.argv.length !== 4) throw Error('Usage: node scripts/community_catalog.mjs --validate | --approve-issue NUMBER | --remove-issue NUMBER');
  const number = Number(rawNumber);
  if (action === '--approve-issue') {
    const headers = {Accept: 'application/vnd.github+json', 'X-GitHub-Api-Version': '2026-03-10'};
    if (process.env.GITHUB_TOKEN) headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
    const response = await fetch(`${catalogApi.communityApi}/${number}`, {headers, redirect: 'error', signal: AbortSignal.timeout(12000)});
    if (!response.ok) throw Error(`GitHub issue request failed (${response.status}).`);
    catalog = approveIssue(catalog, await response.json());
  } else {
    if (!catalog.mods.some(entry => entry.issueNumber === number)) throw Error('Issue is not present in the catalog.');
    catalog = catalogApi.parseCommunityCatalog(JSON.stringify({...catalog, updatedAt: new Date().toISOString(), mods: catalog.mods.filter(entry => entry.issueNumber !== number)}));
  }
  fs.writeFileSync(path + '.tmp', JSON.stringify(catalog, null, 2) + '\n');
  fs.renameSync(path + '.tmp', path);
  console.log(`Reviewed catalog written. ${catalog.mods.length} mods; changes are local until committed.`);
}
if (process.argv[1] && fileURLToPath(import.meta.url) === fs.realpathSync(process.argv[1])) main().catch(error => {console.error(error.message); process.exitCode = 1;});
