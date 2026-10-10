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

import {useModsI18n} from './jarvis-mods-i18n.js';

initComposerScope(); initQuery(); initScope(); initTokenUsage();
const React = getReact();
const {jsx, jsxs} = getJsx();

export function ContextBarView({info, preferences, scopeKind}) {
  const {language, t, formatTokens} = useModsI18n();
  const usage = computeContextUsage(info);
  const view = contextPresentation(usage, preferences);
  const label = view.known ? t('contextLabel', {used: view.percent, remaining: view.remainingPercent}) : t('contextUnknown');
  const tooltip = view.known
    ? t('contextTooltip', {used: formatTokens(usage.usedTokens), total: formatTokens(usage.contextWindow), remaining: formatTokens(usage.remainingTokens)})
    : scopeKind === 'chatgpt' || scopeKind === 'cloud'
      ? t('contextUnsupported')
      : t('contextWaiting');
  return jsxs('div', {
    'data-kliment-context-bar': '1', lang: language,
    'data-context-known': view.known ? 'true' : 'false',
    title: tooltip,
    style: {margin: '8px 12px 4px', minWidth: 0, display: 'flex', flexDirection: 'column', gap: 5, fontSize: 12, lineHeight: '16px', color: 'var(--color-text-secondary, inherit)'},
    children: [
      jsx('div', {style: {display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 8}, children: jsx('span', {style: {fontVariantNumeric: 'tabular-nums'}, children: label})}),
      jsx('div', {
        role: view.known ? 'progressbar' : undefined,
        'aria-label': t('contextProgress'),
        'aria-valuemin': view.known ? 0 : undefined,
        'aria-valuemax': view.known ? 100 : undefined,
        'aria-valuenow': view.known ? view.percent : undefined,
        'aria-valuetext': view.known ? label : undefined,
        style: {height: 5, borderRadius: 3, overflow: 'hidden', backgroundColor: 'color-mix(in srgb, currentColor 14%, transparent)'},
        children: view.known ? jsx('div', {style: {width: `${usage.percent}%`, height: '100%', borderRadius: 'inherit', backgroundColor: view.color}}) : null
      }),
      view.warning ? jsx('div', {
        role: 'status', 'aria-live': 'polite', style: {color: view.color},
        children: t('contextAlmostFull')
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
