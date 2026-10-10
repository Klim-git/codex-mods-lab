import {getHostReact as getCommunityReact, getHostJsx as getCommunityJsx, HostButton as CommunityButton, initHostButton as initCommunityButton, HostDispatcher as CommunityHost} from './jarvis-host-adapter.js';
import {communityHome, readCommunityCache, cacheCommunityCatalog, fetchCommunityCatalog, communitySource, communityMatches, installCommunityMod, communitySubmissionUrl, publishCommunityMod} from './jarvis-community-state.js';
import {announceModChange, modKind} from './jarvis-mod-packages.js';
initCommunityButton();
const CommunityReact = getCommunityReact();
const {jsx: communityJsx, jsxs: communityJsxs} = getCommunityJsx();
const communityField = {width: '100%', background: 'var(--color-background-primary-soft-alpha, #242424)', color: 'inherit', border: '1px solid var(--color-border, #454545)', borderRadius: 8, padding: '8px 10px', fontSize: 14, boxSizing: 'border-box'};
const communityCard = {border: '1px solid var(--color-border, #383838)', borderRadius: 12, padding: 16};
function communityButton(label, onClick, extra = {}) { return communityJsx(CommunityButton, {color: 'secondary', size: 'actionSm', onClick, children: label, ...extra}); }
function openCommunityLink(event, url) {
  event.preventDefault();
  CommunityHost.dispatchMessage('open-in-browser', {url, source: 'manual', useExternalBrowser: true});
}
function sourceLink(url, label) { return communityJsx('a', {href: url, target: '_blank', rel: 'noopener noreferrer', onClick: event => openCommunityLink(event, url), style: {color: '#79b8ff', fontSize: 13, textDecoration: 'underline'}, children: label}); }

export function CommunityLibrary({library, readError, i18n, Dialog, Preview}) {
  const {t, language} = i18n;
  const [data, setData] = CommunityReact.useState(() => readCommunityCache(window.localStorage));
  const [loading, setLoading] = CommunityReact.useState(false);
  const [error, setError] = CommunityReact.useState('');
  const [offline, setOffline] = CommunityReact.useState(false);
  const [query, setQuery] = CommunityReact.useState('');
  const [selected, setSelected] = CommunityReact.useState(null);
  const [status, setStatus] = CommunityReact.useState('');
  const [filter, setFilter] = CommunityReact.useState('all');
  const controllerRef = CommunityReact.useRef(null);
  const requestRef = CommunityReact.useRef(0);
  async function refresh() {
    controllerRef.current?.abort();
    const controller = new AbortController(), request = ++requestRef.current; controllerRef.current = controller;
    setLoading(true); setError(''); setStatus('');
    try {
      const catalog = await fetchCommunityCatalog(fetch, controller.signal);
      if (request !== requestRef.current || controller.signal.aborted) return;
      const fetchedAt = Date.now(); setData({catalog, fetchedAt}); setOffline(false);
      if (!cacheCommunityCatalog(window.localStorage, catalog, fetchedAt)) setStatus('communityCacheError');
    } catch (cause) {
      if (request !== requestRef.current || controller.signal.aborted) return;
      setOffline(true); setError(cause.message === 'communityInvalidCatalog' ? cause.message : 'communityNetworkError');
    } finally { if (request === requestRef.current && !controller.signal.aborted) setLoading(false); }
  }
  CommunityReact.useEffect(() => {refresh(); return () => {++requestRef.current; controllerRef.current?.abort();};}, []);
  function install(entry) {
    try {
      installCommunityMod(window.localStorage, entry, crypto.randomUUID(), t('visualCopySuffix'));
      announceModChange(); setSelected(null); setError(''); setStatus('visualImported');
    } catch (cause) { setError(['visualLimit', 'visualSaveError', 'visualReadError'].includes(cause.message) ? cause.message : 'visualInvalidPackage'); }
  }
  const entries = (data?.catalog.mods ?? []).filter(entry => {
    const mod = entry.package.mod;
    return (filter === 'all' || modKind(mod) === filter) && [mod.name, mod.description, mod.author, entry.publisher].join(' ').toLocaleLowerCase().includes(query.trim().toLocaleLowerCase());
  });
  const installed = entry => library.mods.some(mod => communityMatches(entry.package.mod, mod));
  const duplicate = entry => library.mods.some(mod => mod.id === entry.package.mod.id);
  const feedback = communityJsx('p', {role: error ? 'alert' : 'status', 'aria-live': 'polite', style: {fontSize: 13, color: error ? '#ef8c87' : 'var(--color-text-secondary)'}, children: error ? t(error) : status ? t(status) : ''});
  return communityJsxs('div', {role: 'tabpanel', 'aria-label': t('communityLibrary'), 'data-kliment-community-library': '1', style: {display: 'grid', gap: 14}, children: [
    communityJsx('p', {style: {fontSize: 13, opacity: .75}, children: t('communityDescription')}),
    communityJsxs('div', {style: {display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap'}, children: [
      communityJsx('input', {type: 'search', 'aria-label': t('communitySearch'), placeholder: t('communitySearch'), value: query, maxLength: 100, onChange: event => setQuery(event.target.value), style: {...communityField, flex: '1 1 230px'}}),
      communityJsx('select', {'aria-label': t('functionalFilter'), value: filter, onChange: event => setFilter(event.target.value), style: {...communityField, width: 'auto'}, children: ['all', 'visual', 'functional'].map(value => communityJsx('option', {value, style: {background: 'Canvas', color: 'CanvasText'}, children: t(value === 'all' ? 'functionalAllTypes' : value === 'visual' ? 'visualType' : 'functionalType')}, value))}),
      communityButton(t(loading ? 'communityLoading' : 'communityRefresh'), refresh, {disabled: loading}), sourceLink(`${communityHome}/issues`, t('communitySubmissions'))
    ]}),
    data ? communityJsx('p', {style: {fontSize: 12, opacity: .65}, children: t(offline ? 'communityOffline' : 'communityUpdated', {date: new Date(data.fetchedAt).toLocaleString(language === 'ru' ? 'ru-RU' : 'en-US'), count: data.catalog.mods.length})}) : null,
    feedback,
    ...entries.map(entry => {const mod = entry.package.mod; return communityJsxs('section', {style: communityCard, 'data-kliment-community-card': mod.id, children: [
      communityJsxs('div', {style: {display: 'flex', gap: 12, alignItems: 'center'}, children: [
        communityJsx('div', {'aria-hidden': true, style: {width: 38, height: 38, flexShrink: 0, border: `3px solid ${mod.appearance?.accent ?? '#66c4a7'}`, background: mod.appearance?.surface ?? '#25342e', borderRadius: 10, display: 'grid', placeItems: 'center'}, children: modKind(mod) === 'functional' ? '⚡' : null}),
        communityJsxs('div', {style: {flex: 1, minWidth: 0}, children: [communityJsx('h3', {style: {fontSize: 15, fontWeight: 600, overflowWrap: 'anywhere'}, children: mod.name}), communityJsx('p', {style: {fontSize: 12, opacity: .65}, children: `@${entry.publisher} · v${mod.version} · ${t(modKind(mod) === 'functional' ? 'functionalType' : 'visualType')}`})]}),
        installed(entry) ? communityJsx('span', {style: {fontSize: 12, color: '#66c4a7'}, children: t('communityInstalled')}) : null
      ]}),
      mod.description ? communityJsx('p', {style: {fontSize: 13, opacity: .8, marginTop: 10, overflowWrap: 'anywhere'}, children: mod.description}) : null,
      communityJsxs('div', {style: {display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 12, alignItems: 'center'}, children: [communityButton(t('communityPreviewInstall'), () => {setSelected(entry); setError('');}, {'aria-label': t('communityPreviewNamed', {name: mod.name})}), sourceLink(communitySource(entry), t('communitySource'))]})
    ]}, mod.id);}),
    !entries.length && !loading ? communityJsx('p', {style: {fontSize: 13, opacity: .7}, children: t(data ? query ? 'communityNoResults' : 'communityEmpty' : 'communityUnavailable')}) : null,
    selected ? communityJsx(Dialog, {title: selected.package.mod.name, t, onClose: () => {setSelected(null); setError('');}, children: communityJsxs('div', {style: {display: 'grid', gap: 14}, children: [
      communityJsx('p', {style: {fontSize: 13}, children: `@${selected.publisher} · v${selected.package.mod.version}`}),
      selected.package.mod.description ? communityJsx('p', {style: {fontSize: 13}, children: selected.package.mod.description}) : null,
      communityJsx(Preview, {mod: selected.package.mod, t}),
      communityJsx('p', {style: {fontSize: 12, opacity: .7}, children: t('communityInstallHint')}),
      duplicate(selected) && !installed(selected) ? communityJsx('p', {style: {fontSize: 13}, children: t('visualDuplicateHint')}) : null,
      communityButton(t(installed(selected) ? 'communityInstalled' : duplicate(selected) ? 'visualInstallCopy' : 'visualInstall'), () => install(selected), {color: 'primary', disabled: !!readError || installed(selected)}), feedback
    ]})}) : null
  ]});
}

export function CommunityPublishDialog({mod, i18n, onClose, Dialog, Preview}) {
  const {t} = i18n;
  const [consent, setConsent] = CommunityReact.useState(false);
  const [token, setToken] = CommunityReact.useState('');
  const [busy, setBusy] = CommunityReact.useState(false);
  const [error, setError] = CommunityReact.useState('');
  const [receipt, setReceipt] = CommunityReact.useState('');
  const controllerRef = CommunityReact.useRef(null), liveRef = CommunityReact.useRef(true);
  CommunityReact.useEffect(() => () => {liveRef.current = false; controllerRef.current?.abort();}, []);
  function close() {setToken(''); onClose();}
  async function publish() {
    if (!consent || busy || receipt || error === 'communityPublishUnknown') return;
    setBusy(true); setError(''); const controller = new AbortController(); controllerRef.current = controller;
    try {
      const url = await publishCommunityMod(mod, token, fetch, controller.signal);
      if (liveRef.current) {setReceipt(url); setToken('');}
    } catch (cause) { if (liveRef.current) setError(cause.message); }
    finally {if (liveRef.current) setBusy(false);}
  }
  return communityJsx(Dialog, {title: t('communityPublish'), t, onClose: close, children: communityJsxs('div', {style: {display: 'grid', gap: 14}, children: [
    communityJsx('h3', {style: {fontWeight: 600}, children: `${mod.name} · v${mod.version}`}),
    mod.author ? communityJsx('p', {style: {fontSize: 13}, children: `${t('visualAuthor')}: ${mod.author}`}) : null,
    mod.description ? communityJsx('p', {style: {fontSize: 13}, children: mod.description}) : null,
    communityJsx('p', {style: {fontSize: 13, opacity: .8}, children: t('communityPublishHint')}),
    communityJsx(Preview, {mod, t}),
    receipt ? communityJsxs('div', {role: 'status', children: [communityJsx('p', {style: {fontSize: 13, marginBottom: 8}, children: t('communitySubmitted')}), sourceLink(receipt, t('communityOpenSubmission'))]}) : communityJsxs('div', {style: {display: 'grid', gap: 12}, children: [
      communityJsxs('label', {style: {display: 'flex', gap: 10, alignItems: 'flex-start', fontSize: 13}, children: [communityJsx('input', {type: 'checkbox', checked: consent, disabled: busy, onChange: event => setConsent(event.target.checked), 'aria-label': t('communityConsent'), style: {appearance: 'auto', width: 16, height: 16, flexShrink: 0, marginTop: 2, accentColor: '#66c4a7'}}), t('communityConsent')]}),
      communityJsx('a', {href: communitySubmissionUrl(mod), target: '_blank', rel: 'noopener noreferrer', 'aria-disabled': !consent || busy, onClick: event => {if (!consent || busy) event.preventDefault(); else openCommunityLink(event, communitySubmissionUrl(mod));}, style: {color: '#79b8ff', opacity: consent && !busy ? 1 : .4, textDecoration: 'underline', fontSize: 14}, children: t('communityPublishGithub')}),
      communityJsx('p', {style: {fontSize: 12, opacity: .65}, children: t('communityGithubHint')}),
      communityJsxs('details', {children: [communityJsx('summary', {style: {cursor: 'pointer', fontSize: 13}, children: t('communityPublishDirect')}), communityJsxs('div', {style: {display: 'grid', gap: 10, marginTop: 12}, children: [
        communityJsx('p', {style: {fontSize: 12, opacity: .7}, children: t('communityTokenHint')}),
        communityJsx('input', {type: 'password', 'aria-label': t('communityToken'), value: token, maxLength: 300, autoComplete: 'off', spellCheck: false, disabled: busy, onChange: event => {setToken(event.target.value); if (error !== 'communityPublishUnknown') setError('');}, style: communityField}),
        communityButton(t(busy ? 'communityPublishing' : 'communitySend'), publish, {color: 'primary', disabled: !consent || !token || busy || error === 'communityPublishUnknown'})
      ]})]}),
      error ? communityJsxs('div', {role: 'alert', style: {fontSize: 13, color: '#ef8c87'}, children: [t(error), error === 'communityPublishUnknown' ? sourceLink(`${communityHome}/issues`, t('communitySubmissions')) : null]}) : null
    ]})
  ]})});
}
