import {
  PCn as getReact, Agn as getJsx,
  Fan as useScope, Ran as useQuery,
  QW as ComposerScope, sG as localConversationId, OP as tokenUsageInfo,
  uG as initComposerScope, Ian as initQuery, Pan as initScope, aP as initTokenUsage
} from './app-shared-737655e1fb23.js';
import {
  defaults, parsePreferences, preferenceSnapshot, subscribePreferences,
  computeContextUsage, contextPresentation
} from './jarvis-mods-state.js';

initComposerScope(); initQuery(); initScope(); initTokenUsage();
const React = getReact();
const {jsx, jsxs} = getJsx();
const formatTokens = value => new Intl.NumberFormat('ru-RU', {maximumFractionDigits: 0}).format(value);

export function ContextBarView({info, preferences, scopeKind}) {
  const usage = computeContextUsage(info);
  const view = contextPresentation(usage, preferences);
  const label = view.known ? `Контекст: ${view.percent}% · осталось ${view.remainingPercent}%` : 'Контекст: нет данных';
  const tooltip = view.known
    ? `Использовано ${formatTokens(usage.usedTokens)} из ${formatTokens(usage.contextWindow)} токенов. Осталось ${formatTokens(usage.remainingTokens)}. По последним данным чата; после сжатия заполнение может уменьшиться.`
    : scopeKind === 'chatgpt' || scopeKind === 'cloud'
      ? 'Приложение не сообщает расход контекста для этого чата.'
      : 'Данные появятся, когда приложение сообщит расход контекста. Обычно это происходит после первого ответа.';
  return jsxs('div', {
    'data-kliment-context-bar': '1',
    'data-context-known': view.known ? 'true' : 'false',
    title: tooltip,
    style: {margin: '8px 12px 4px', minWidth: 0, display: 'flex', flexDirection: 'column', gap: 5, fontSize: 12, lineHeight: '16px', color: 'var(--color-text-secondary, inherit)'},
    children: [
      jsx('div', {style: {display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 8}, children: jsx('span', {style: {fontVariantNumeric: 'tabular-nums'}, children: label})}),
      jsx('div', {
        role: view.known ? 'progressbar' : undefined,
        'aria-label': 'Заполнение контекста чата',
        'aria-valuemin': view.known ? 0 : undefined,
        'aria-valuemax': view.known ? 100 : undefined,
        'aria-valuenow': view.known ? view.percent : undefined,
        'aria-valuetext': view.known ? label : undefined,
        style: {height: 5, borderRadius: 3, overflow: 'hidden', backgroundColor: 'color-mix(in srgb, currentColor 14%, transparent)'},
        children: view.known ? jsx('div', {style: {width: `${usage.percent}%`, height: '100%', borderRadius: 'inherit', backgroundColor: view.color}}) : null
      }),
      view.warning ? jsx('div', {
        role: 'status', 'aria-live': 'polite', style: {color: view.color},
        children: 'Контекст почти заполнен. История может быть автоматически сжата.'
      }) : null
    ]
  });
}

function ConnectedContextBar({preferences}) {
  const scope = useScope(ComposerScope);
  const conversationId = localConversationId(scope);
  const info = useQuery(tokenUsageInfo, conversationId);
  return jsx(ContextBarView, {info, preferences, scopeKind: scope.value.kind});
}

// Failure of the optional mod must not interrupt the message composer.
class ContextBarBoundary extends React.Component {
  state = {failed: false};
  static getDerivedStateFromError() { return {failed: true}; }
  componentDidCatch() { console.warn('[kliment-mods] context_bar_data_unavailable'); }
  render() { return this.state.failed ? jsx(ContextBarView, {info: null, preferences: this.props.preferences}) : this.props.children; }
}

export function JarvisContextBarRoot({isDocument}) {
  const raw = React.useSyncExternalStore(subscribePreferences, preferenceSnapshot, () => null);
  let preferences;
  try { preferences = parsePreferences(raw); }
  catch { preferences = {...defaults}; }
  if (isDocument || !preferences.modsEnabled || !preferences.contextBarEnabled) return null;
  return jsx(ContextBarBoundary, {preferences, children: jsx(ConnectedContextBar, {preferences})});
}
