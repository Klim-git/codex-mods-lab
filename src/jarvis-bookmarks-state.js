export const bookmarksKey = 'kliment.mods.lab.bookmarks.v1';
export const bookmarksEvent = 'kliment-mods-bookmarks-changed';
const maxEntries = 5000;

export function cleanText(value, limit) {
  return String(value ?? '').replace(/\s+/g, ' ').trim().slice(0, limit);
}

export function messageExcerpt(item) {
  if (!item || typeof item !== 'object') return '';
  for (const value of [item.message, item.content, item.text]) {
    if (typeof value === 'string') return cleanText(value, 280);
    if (Array.isArray(value)) {
      const text = value.map(part => typeof part === 'string' ? part : typeof part?.text === 'string' ? part.text : typeof part?.content === 'string' ? part.content : '').join(' ');
      if (text.trim()) return cleanText(text, 280);
    }
  }
  return '';
}

export function bookmarkItemId(bookmark) {
  const prefix = `${bookmark.turnKey}:`;
  if (!bookmark.unitKey.startsWith(prefix) || bookmark.unitKey.length <= prefix.length) throw new Error('Некорректная ссылка на сообщение.');
  return bookmark.unitKey.slice(prefix.length);
}

export function parseBookmarks(raw) {
  if (raw === null) return [];
  const data = JSON.parse(raw);
  if (!data || data.version !== 1 || !Array.isArray(data.entries) || data.entries.length > maxEntries) throw new Error('Некорректное хранилище закладок.');
  const seen = new Set();
  return data.entries.map(entry => {
    if (!entry || typeof entry.conversationKey !== 'string' || !entry.conversationKey || entry.conversationKey.length > 500 ||
        typeof entry.unitKey !== 'string' || !entry.unitKey || entry.unitKey.length > 1000 ||
        typeof entry.turnKey !== 'string' || !entry.turnKey || entry.turnKey.length > 500 ||
        !['user', 'assistant'].includes(entry.role) ||
        typeof entry.title !== 'string' || !entry.title.trim() || entry.title.length > 120 ||
        typeof entry.excerpt !== 'string' || entry.excerpt.length > 280 ||
        !Number.isFinite(entry.createdAt) || entry.createdAt < 0) throw new Error('Некорректная закладка.');
    const key = JSON.stringify([entry.conversationKey, entry.unitKey]);
    if (seen.has(key)) throw new Error('Повторяющаяся закладка.');
    seen.add(key);
    return {conversationKey: entry.conversationKey, unitKey: entry.unitKey, turnKey: entry.turnKey, role: entry.role, title: entry.title, excerpt: entry.excerpt, createdAt: entry.createdAt};
  });
}

export function readBookmarks(storage) { return parseBookmarks(storage.getItem(bookmarksKey)); }

export function changeBookmark(storage, change) {
  const latest = readBookmarks(storage);
  const index = latest.findIndex(entry => entry.conversationKey === change.conversationKey && entry.unitKey === change.unitKey);
  let next;
  if (change.action === 'remove') next = latest.filter((_, entryIndex) => entryIndex !== index);
  else if (change.action === 'rename') {
    const title = cleanText(change.title, 120);
    if (!title || index < 0) throw new Error('Укажите название закладки.');
    next = latest.map((entry, entryIndex) => entryIndex === index ? {...entry, title} : entry);
  } else if (change.action === 'add') {
    if (index >= 0) return latest;
    const excerpt = cleanText(change.excerpt, 280);
    const title = cleanText(change.title || excerpt || (change.role === 'user' ? 'Сообщение пользователя' : 'Ответ ассистента'), 120);
    next = [...latest, {conversationKey: change.conversationKey, unitKey: change.unitKey, turnKey: change.turnKey, role: change.role, title, excerpt, createdAt: change.createdAt ?? Date.now()}];
  } else throw new Error('Неизвестное действие с закладкой.');
  const validated = parseBookmarks(JSON.stringify({version: 1, entries: next}));
  storage.setItem(bookmarksKey, JSON.stringify({version: 1, entries: validated}));
  return validated;
}

export function bookmarkSnapshot() {
  try { return window.localStorage.getItem(bookmarksKey); } catch { return null; }
}
export function announceBookmarks() { window.dispatchEvent(new Event(bookmarksEvent)); }
export function subscribeBookmarks(listener) {
  const storage = event => { if (event.key === bookmarksKey || event.key === null) listener(); };
  window.addEventListener(bookmarksEvent, listener); window.addEventListener('storage', storage);
  return () => { window.removeEventListener(bookmarksEvent, listener); window.removeEventListener('storage', storage); };
}
export function matchesBookmarkShortcut(event, shortcut) {
  if (event.repeat || event.isComposing || event.metaKey || event.shiftKey) return false;
  const letter = event.code === 'KeyK' || event.keyCode === 75 || ['k', 'л'].includes(event.key?.toLowerCase()) ? 'K' : event.code === 'KeyB' || event.keyCode === 66 || ['b', 'и'].includes(event.key?.toLowerCase()) ? 'B' : '';
  return shortcut === 'Ctrl+Alt+K' ? letter === 'K' && event.ctrlKey && event.altKey : shortcut === 'Alt+B' ? letter === 'B' && event.altKey && !event.ctrlKey : false;
}
