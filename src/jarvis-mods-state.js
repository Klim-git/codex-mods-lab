export const storageKey = 'kliment.mods.lab.preferences.v1';
export const preferenceEvent = 'kliment-mods-preferences-changed';
export const nextMods = ['Пока не выбран', 'Полоса контекста', 'Паспорт чата', 'Рабочая память', 'Быстрые действия'];
export const warningThresholds = [70, 80, 90, 95];
export const bookmarkShortcuts = ['Ctrl+Alt+K', 'Alt+B', 'Нет'];
export const defaults = {
  modsLanguage: 'auto',
  modsEnabled: false,
  showPlannedMods: true,
  nextMod: nextMods[0],
  contextBarEnabled: true,
  contextWarningEnabled: true,
  contextWarningThreshold: 80,
  bookmarksEnabled: true,
  bookmarkShowIcons: true,
  bookmarkShortcut: 'Ctrl+Alt+K'
};

export function parsePreferences(raw) {
  if (raw === null) return {...defaults};
  const data = JSON.parse(raw);
  if (!data || typeof data !== 'object' || Array.isArray(data) ||
      typeof data.modsEnabled !== 'boolean' || typeof data.showPlannedMods !== 'boolean' ||
      (data.modsLanguage !== undefined && !['auto', 'en', 'ru'].includes(data.modsLanguage)) ||
      !nextMods.includes(data.nextMod) ||
      (data.contextBarEnabled !== undefined && typeof data.contextBarEnabled !== 'boolean') ||
      (data.contextWarningEnabled !== undefined && typeof data.contextWarningEnabled !== 'boolean') ||
      (data.contextWarningThreshold !== undefined && !warningThresholds.includes(data.contextWarningThreshold)) ||
      (data.bookmarksEnabled !== undefined && typeof data.bookmarksEnabled !== 'boolean') ||
      (data.bookmarkShowIcons !== undefined && typeof data.bookmarkShowIcons !== 'boolean') ||
      (data.bookmarkShortcut !== undefined && data.bookmarkShortcut !== 'Ctrl+Alt+B' && !bookmarkShortcuts.includes(data.bookmarkShortcut))) {
    throw new Error('Некорректные сохранённые настройки.');
  }
  // Older copies saved only the first three fields. Preserve them during migration.
  return {
    modsLanguage: data.modsLanguage ?? defaults.modsLanguage,
    modsEnabled: data.modsEnabled,
    showPlannedMods: data.showPlannedMods,
    nextMod: data.nextMod,
    contextBarEnabled: data.contextBarEnabled ?? defaults.contextBarEnabled,
    contextWarningEnabled: data.contextWarningEnabled ?? defaults.contextWarningEnabled,
    contextWarningThreshold: data.contextWarningThreshold ?? defaults.contextWarningThreshold,
    bookmarksEnabled: data.bookmarksEnabled ?? defaults.bookmarksEnabled,
    bookmarkShowIcons: data.bookmarkShowIcons ?? defaults.bookmarkShowIcons,
    bookmarkShortcut: data.bookmarkShortcut === 'Ctrl+Alt+B' ? defaults.bookmarkShortcut : data.bookmarkShortcut ?? defaults.bookmarkShortcut
  };
}

export function readPreferences(storage) {
  return parsePreferences(storage.getItem(storageKey));
}

export function writePreferences(storage, patch, reset = false) {
  const latest = reset ? {...defaults} : readPreferences(storage);
  const next = parsePreferences(JSON.stringify({...latest, ...patch}));
  storage.setItem(storageKey, JSON.stringify(next));
  return next;
}

export function announcePreferenceChange() {
  window.dispatchEvent(new Event(preferenceEvent));
}

export function subscribePreferences(listener) {
  const onStorage = event => {
    if (event.key === storageKey || event.key === null) listener();
  };
  window.addEventListener(preferenceEvent, listener);
  window.addEventListener('storage', onStorage);
  return () => {
    window.removeEventListener(preferenceEvent, listener);
    window.removeEventListener('storage', onStorage);
  };
}

export function preferenceSnapshot() {
  try { return window.localStorage.getItem(storageKey); }
  catch { return null; }
}

export function computeContextUsage(info) {
  const contextWindow = info?.modelContextWindow;
  const totalTokens = info?.last?.totalTokens;
  if (!Number.isFinite(contextWindow) || contextWindow <= 0 ||
      !Number.isFinite(totalTokens) || totalTokens < 0) return null;
  const usedTokens = Math.min(totalTokens, contextWindow);
  const percent = usedTokens / contextWindow * 100;
  return {usedTokens, contextWindow, remainingTokens: contextWindow - usedTokens, percent};
}

export function contextPresentation(usage, preferences) {
  if (usage === null) return {known: false, warning: false, color: 'var(--color-text-tertiary, #808080)'};
  const warning = preferences.contextWarningEnabled && usage.percent >= preferences.contextWarningThreshold;
  const color = usage.percent >= 95 ? '#ef6461' : usage.percent >= Math.min(70, preferences.contextWarningThreshold) ? '#d9a441' : '#45b982';
  return {known: true, warning, color, percent: Math.round(usage.percent), remainingPercent: 100 - Math.round(usage.percent)};
}
