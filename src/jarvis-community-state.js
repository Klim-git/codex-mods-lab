import {parseModPackage, exportModPackage, readModLibrary, updateModLibrary, modKind} from './jarvis-mod-packages.js';

export const communityRepo = 'Klim-git/codex-mods-lab';
export const communityHome = `https://github.com/${communityRepo}`;
export const communityCatalogUrl = `https://raw.githubusercontent.com/${communityRepo}/main/community/catalog-v2.json`;
export const communityApi = `https://api.github.com/repos/${communityRepo}/issues`;
export const communityCacheKey = 'kliment.mods.lab.community-cache.v1';
export const communityLimit = 1024 * 1024;
const utf8 = new TextEncoder();
function invalid() { throw new Error('communityInvalidCatalog'); }
function keys(object, names) {
  if (!object || typeof object !== 'object' || Array.isArray(object) || Object.keys(object).sort().join() !== names.slice().sort().join()) invalid();
}
export function parseCommunityCatalog(text) {
  try {
    if (typeof text !== 'string' || utf8.encode(text).length > communityLimit) invalid();
    const value = JSON.parse(text);
    keys(value, ['format', 'formatVersion', 'updatedAt', 'mods']);
    if (value.format !== 'codex-mods-lab/community' || ![1, 2].includes(value.formatVersion) || !Array.isArray(value.mods) || value.mods.length > 200 || typeof value.updatedAt !== 'string' || !/^\d{4}-\d{2}-\d{2}T/.test(value.updatedAt) || !Number.isFinite(Date.parse(value.updatedAt))) invalid();
    const ids = new Set(), issues = new Set();
    const mods = value.mods.map(entry => {
      keys(entry, ['publisher', 'issueNumber', 'package']);
      if (typeof entry.publisher !== 'string' || !/^[a-z\d](?:[a-z\d-]{0,37}[a-z\d])?$/i.test(entry.publisher)) invalid();
      if (entry.issueNumber !== null && (!Number.isSafeInteger(entry.issueNumber) || entry.issueNumber < 1)) invalid();
      const mod = parseModPackage(JSON.stringify(entry.package));
      if (value.formatVersion === 1 && modKind(mod) !== 'visual') invalid();
      if (ids.has(mod.id) || entry.issueNumber !== null && issues.has(entry.issueNumber)) invalid();
      ids.add(mod.id); if (entry.issueNumber !== null) issues.add(entry.issueNumber);
      return {publisher: entry.publisher, issueNumber: entry.issueNumber, package: JSON.parse(exportModPackage(mod))};
    });
    return {format: value.format, formatVersion: value.formatVersion, updatedAt: value.updatedAt, mods};
  } catch { invalid(); }
}
export function readCommunityCache(storage) {
  try {
    const raw = storage.getItem(communityCacheKey);
    if (!raw || raw.length > communityLimit + 300) return null;
    const value = JSON.parse(raw); keys(value, ['fetchedAt', 'catalog']);
    if (!Number.isSafeInteger(value.fetchedAt) || value.fetchedAt < 0 || value.fetchedAt > Date.now() + 60000) return null;
    return {fetchedAt: value.fetchedAt, catalog: parseCommunityCatalog(JSON.stringify(value.catalog))};
  } catch { return null; }
}
export function cacheCommunityCatalog(storage, catalog, now = Date.now()) {
  const safe = parseCommunityCatalog(JSON.stringify(catalog));
  try { storage.setItem(communityCacheKey, JSON.stringify({fetchedAt: now, catalog: safe})); return true; }
  catch { return false; }
}
async function boundedText(response, signal) {
  if (Number(response.headers?.get('content-length')) > communityLimit) invalid();
  if (!response.body?.getReader) {
    const text = await response.text(); if (utf8.encode(text).length > communityLimit) invalid(); return text;
  }
  const reader = response.body.getReader(), decoder = new TextDecoder(); let text = '', size = 0;
  try {
    while (true) {
      if (signal.aborted) throw new Error('communityNetworkError');
      const {done, value} = await reader.read(); if (done) break;
      size += value.byteLength; if (size > communityLimit) invalid(); text += decoder.decode(value, {stream: true});
    }
    return text + decoder.decode();
  } finally { await reader.cancel().catch(() => {}); }
}
export async function fetchCommunityCatalog(fetcher = fetch, signal) {
  const controller = new AbortController();
  const abort = () => controller.abort();
  if (signal?.aborted) abort(); else signal?.addEventListener('abort', abort, {once: true});
  const timer = setTimeout(abort, 12000);
  try {
    const response = await fetcher(communityCatalogUrl, {signal: controller.signal, credentials: 'omit', referrerPolicy: 'no-referrer', redirect: 'error', cache: 'no-store'});
    if (!response.ok) throw new Error('communityNetworkError');
    return parseCommunityCatalog(await boundedText(response, controller.signal));
  } catch (cause) { throw new Error(cause.message === 'communityInvalidCatalog' ? cause.message : 'communityNetworkError'); }
  finally { clearTimeout(timer); signal?.removeEventListener('abort', abort); }
}
export function communitySource(entry) {
  return entry.issueNumber === null ? `${communityHome}/blob/main/community/catalog-v2.json` : `${communityHome}/issues/${entry.issueNumber}`;
}
export function communityMatches(mod, installed) { return exportModPackage(mod) === exportModPackage(installed); }
export function installCommunityMod(storage, entry, newId, copySuffix) {
  const mod = parseModPackage(JSON.stringify(entry.package));
  // The caller provides the freshly read local library through the storage transaction.
  const duplicate = readModLibrary(storage).mods.some(item => item.id === mod.id);
  const incoming = duplicate ? {...mod, id: newId, name: (mod.name.slice(0, 60) + ' ' + copySuffix).slice(0, 80)} : mod;
  return updateModLibrary(storage, {type: 'import', mod: incoming, apply: false});
}
export function communitySubmission(mod) {
  // Canonical plain JSON only. HTML-like metadata remains text in the app and a code block on GitHub.
  const body = `<!-- codex-mods-lab:submission:v1 -->\n\nMod submission. Please review the package before adding it to the community catalog.\n\n\`\`\`json\n${exportModPackage(mod)}\`\`\`\n`;
  return {title: `[Mod] ${mod.name} v${mod.version}`, body};
}
export function communitySubmissionUrl(mod) {
  const {title, body} = communitySubmission(mod);
  return `${communityHome}/issues/new?${new URLSearchParams({title, body})}`;
}
export function parseCommunitySubmission(body) {
  if (typeof body !== 'string' || utf8.encode(body).length > 70000 || !body.startsWith('<!-- codex-mods-lab:submission:v1 -->')) throw new Error('visualInvalidPackage');
  const blocks = [...body.matchAll(/^```json\r?\n([\s\S]*?)^```\s*$/gm)];
  if (blocks.length !== 1) throw new Error('visualInvalidPackage');
  return parseModPackage(blocks[0][1]);
}
export async function publishCommunityMod(mod, token, fetcher = fetch, signal) {
  const submission = communitySubmission(mod);
  if (typeof token !== 'string' || !/^(?:ghp_[A-Za-z0-9]{20,}|github_pat_[A-Za-z0-9_]{20,})$/.test(token.trim())) throw new Error('communityTokenError');
  const controller = new AbortController(), abort = () => controller.abort();
  if (signal?.aborted) abort(); else signal?.addEventListener('abort', abort, {once: true});
  const timer = setTimeout(abort, 20000);
  try {
    const response = await fetcher(communityApi, {method: 'POST', signal: controller.signal, credentials: 'omit', redirect: 'error', referrerPolicy: 'no-referrer', headers: {Accept: 'application/vnd.github+json', 'Content-Type': 'application/json', 'X-GitHub-Api-Version': '2026-03-10', Authorization: `Bearer ${token.trim()}`}, body: JSON.stringify(submission)});
    if ([401, 403, 404].includes(response.status)) throw new Error('communityAuthError');
    if (!response.ok) throw new Error('communityPublishError');
    const result = JSON.parse(await boundedText(response, controller.signal));
    if (!Number.isSafeInteger(result.number) || result.number < 1) throw new Error('communityPublishUnknown');
    return `${communityHome}/issues/${result.number}`;
  } catch (cause) {
    if (['communityAuthError', 'communityPublishError'].includes(cause.message)) throw cause;
    // A lost response may follow a successful POST. Never silently retry a public write.
    throw new Error('communityPublishUnknown');
  } finally { clearTimeout(timer); signal?.removeEventListener('abort', abort); }
}
