import {PCn as getLocaleReact, ffn as useAppIntl} from './app-shared-737655e1fb23.js';
import {defaults, parsePreferences, preferenceSnapshot, subscribePreferences} from './jarvis-mods-state.js';

export const modMessages = {
  en: {
    mods: 'Mods', language: 'Language', languageDescription: 'Choose the language for all mods.',
    languageAuto: 'Automatic (app language)',
    enableMods: 'Enable installed mods', enableModsDescription: 'Master switch for all mods.',
    installedMods: 'Installed mods', on: 'Enabled', off: 'Disabled', paused: 'Paused',
    configure: 'Configure', collapse: 'Collapse', reset: 'Reset settings', restore: 'Restore settings',
    preferencesReadError: 'Could not read preferences. Select “Restore settings” to restore the defaults.',
    preferencesSaveError: 'Could not save preferences. Your previous settings have been kept.',
    preferencesSaved: 'Settings saved.', preferencesReset: 'Settings restored.',
    contextBar: 'Context bar', contextDescription: 'Used and remaining context above the chat input.',
    contextConfigure: 'Configure context bar', contextCollapse: 'Collapse context bar settings',
    contextReset: 'Reset context bar settings',
    contextWarning: 'Warn when context fills up',
    contextWarningDescription: 'Show a warning next to the bar when the selected threshold is reached.',
    contextThreshold: 'Warning threshold',
    contextThresholdDescription: 'Conversation history may be compacted before context is completely full.',
    contextMasterHint: 'Enable the master switch to use this mod in chats.',
    contextDisabledHint: 'Settings are saved. Enable the mod using its card switch.',
    contextUnknownHint: 'When chat statistics are unavailable, the bar shows “No data”.',
    contextLabel: 'Context: {used}% · {remaining}% remaining', contextUnknown: 'Context: no data',
    contextTooltip: '{used} of {total} tokens used. {remaining} remaining. Based on the last chat report; usage may decrease after compaction.',
    contextUnsupported: 'The app does not report context usage for this chat.',
    contextWaiting: 'Usage will appear when the app reports it, usually after the first reply.',
    contextProgress: 'Chat context usage',
    contextAlmostFull: 'Context is almost full. Conversation history may be automatically compacted.',
    bookmarks: 'Message bookmarks', bookmarksDescription: 'Save important messages, name them, and jump to them in the chat.',
    bookmarksConfigure: 'Configure bookmarks', bookmarksCollapse: 'Collapse bookmark settings',
    bookmarksReset: 'Reset bookmark settings',
    bookmarkIcons: 'Show icons next to messages', bookmarkIconsDescription: 'Add and remove bookmarks directly in the conversation.',
    bookmarkShortcut: 'Bookmark keyboard shortcut', bookmarkShortcutDescription: 'Open the bookmark list for the current chat.',
    bookmarkResetHint: 'Reset changes the mod settings. Your saved bookmarks are kept.', none: 'None',
    bookmarkAdd: 'Bookmark this message', bookmarkRemoveMessage: 'Remove message bookmark',
    bookmarksDialog: 'Bookmarks in this chat · {count}', bookmarksClose: 'Close bookmark list',
    userMessage: 'Your message', assistantResponse: 'Assistant response', bookmarkTitle: 'Bookmark name',
    save: 'Save', cancel: 'Cancel', rename: 'Rename', remove: 'Remove',
    bookmarkJump: 'Go to bookmark: {title}', bookmarkRename: 'Rename bookmark: {title}', bookmarkRemove: 'Remove bookmark: {title}',
    bookmarksEmpty: 'Bookmark a message using its bookmark icon. It will appear here.', openingMessage: 'Opening message…',
    bookmarksReadError: 'Could not read bookmarks. Your saved data has not been changed.',
    bookmarksSaveError: 'Could not save the bookmark. Your previous data has been kept.',
    bookmarkUnavailable: 'The message is not available yet. Your bookmark is saved; try opening it after the history loads.',
    bookmarksOpen: 'Open bookmarks for this chat: {count}', bookmarksTooltip: 'Bookmarks in this chat',
    bookmarksCount: 'Bookmarks · {count}'
  },
  ru: {
    mods: 'Моды', language: 'Язык', languageDescription: 'Язык интерфейса всех модов.',
    languageAuto: 'Автоматически (язык приложения)',
    enableMods: 'Включать установленные моды', enableModsDescription: 'Общий переключатель для всех доработок.',
    installedMods: 'Установленные моды', on: 'Включён', off: 'Выключен', paused: 'Приостановлен',
    configure: 'Настроить', collapse: 'Свернуть', reset: 'Сбросить настройки', restore: 'Восстановить настройки',
    preferencesReadError: 'Не удалось прочитать настройки. Нажмите «Восстановить настройки», чтобы вернуть исходные значения.',
    preferencesSaveError: 'Не удалось сохранить настройки. Предыдущие значения сохранены.',
    preferencesSaved: 'Настройки сохранены.', preferencesReset: 'Настройки восстановлены.',
    contextBar: 'Полоса контекста', contextDescription: 'Заполнение контекста и оставшееся место над полем ввода чата.',
    contextConfigure: 'Настроить полосу контекста', contextCollapse: 'Свернуть настройки полосы контекста',
    contextReset: 'Сбросить настройки полосы контекста',
    contextWarning: 'Предупреждать о заполнении',
    contextWarningDescription: 'Предупреждение рядом с полосой, когда достигнут выбранный порог.',
    contextThreshold: 'Порог предупреждения',
    contextThresholdDescription: 'Сжатие истории может произойти раньше полного заполнения.',
    contextMasterHint: 'Включите общий переключатель, чтобы мод работал в чатах.',
    contextDisabledHint: 'Настройки сохранены. Включите мод переключателем в карточке.',
    contextUnknownHint: 'Если статистика чата недоступна, полоса показывает «Нет данных».',
    contextLabel: 'Контекст: {used}% · осталось {remaining}%', contextUnknown: 'Контекст: нет данных',
    contextTooltip: 'Использовано {used} из {total} токенов. Осталось {remaining}. По последним данным чата; после сжатия заполнение может уменьшиться.',
    contextUnsupported: 'Приложение не сообщает расход контекста для этого чата.',
    contextWaiting: 'Данные появятся, когда приложение сообщит расход контекста. Обычно это происходит после первого ответа.',
    contextProgress: 'Заполнение контекста чата',
    contextAlmostFull: 'Контекст почти заполнен. История может быть автоматически сжата.',
    bookmarks: 'Закладки в чате', bookmarksDescription: 'Важные сообщения, свои названия и быстрый переход по переписке.',
    bookmarksConfigure: 'Настроить закладки', bookmarksCollapse: 'Свернуть настройки закладок',
    bookmarksReset: 'Сбросить настройки закладок',
    bookmarkIcons: 'Показывать значки у сообщений', bookmarkIconsDescription: 'Добавлять и снимать закладку прямо в переписке.',
    bookmarkShortcut: 'Горячая клавиша закладок', bookmarkShortcutDescription: 'Открывать список закладок текущего чата.',
    bookmarkResetHint: 'Сброс меняет параметры мода. Сами закладки сохраняются.', none: 'Нет',
    bookmarkAdd: 'Добавить сообщение в закладки', bookmarkRemoveMessage: 'Удалить сообщение из закладок',
    bookmarksDialog: 'Закладки в этом чате · {count}', bookmarksClose: 'Закрыть список закладок',
    userMessage: 'Ваше сообщение', assistantResponse: 'Ответ ассистента', bookmarkTitle: 'Название закладки',
    save: 'Сохранить', cancel: 'Отмена', rename: 'Переименовать', remove: 'Удалить',
    bookmarkJump: 'Перейти к закладке: {title}', bookmarkRename: 'Переименовать закладку: {title}', bookmarkRemove: 'Удалить закладку: {title}',
    bookmarksEmpty: 'Отметьте нужное сообщение значком закладки. Оно появится здесь.', openingMessage: 'Открываю сообщение…',
    bookmarksReadError: 'Не удалось прочитать закладки. Сохранённые данные не изменены.',
    bookmarksSaveError: 'Не удалось сохранить закладку. Предыдущие данные сохранены.',
    bookmarkUnavailable: 'Сообщение пока недоступно. Закладка сохранена; попробуйте открыть её после загрузки истории.',
    bookmarksOpen: 'Открыть закладки этого чата: {count}', bookmarksTooltip: 'Закладки этого чата',
    bookmarksCount: 'Закладки · {count}'
  }
};

export function resolveModLanguage(preference = 'auto', appLocale = 'en') {
  if (preference === 'en' || preference === 'ru') return preference;
  return /^ru(?:[-_]|$)/i.test(String(appLocale)) ? 'ru' : 'en';
}

export function modText(language, key, values = {}) {
  const message = modMessages[language]?.[key] ?? modMessages.en[key];
  if (message === undefined) throw new Error('Unknown mod translation: ' + key);
  return message.replace(/\{(\w+)\}/g, (_, name) => String(values[name] ?? `{${name}}`));
}

export function useModsLanguage() {
  const intl = useAppIntl();
  const raw = getLocaleReact().useSyncExternalStore(subscribePreferences, preferenceSnapshot, () => null);
  let preference = defaults.modsLanguage;
  try { preference = parsePreferences(raw).modsLanguage; } catch { /* Use the app language if storage is unavailable. */ }
  return resolveModLanguage(preference, intl.locale);
}

export function useModsI18n() {
  const language = useModsLanguage();
  return {
    language,
    t: (key, values) => modText(language, key, values),
    formatTokens: value => new Intl.NumberFormat(language === 'ru' ? 'ru-RU' : 'en-US', {maximumFractionDigits: 0}).format(value)
  };
}
