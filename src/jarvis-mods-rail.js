// Generic rail UI. The reviewed adapter supplies native routing and components.
export function renderModsRail({onOpenSidebarPopover}, host) {
  const {modText, useModsLanguage, useLocation, jsx, jsxs, Tooltip, RailButton, dispatchHostMessage} = host;
  const label = modText(useModsLanguage(), 'mods');
  const location = useLocation();
  const active = location.pathname === '/settings/general-settings' && new URLSearchParams(location.search).get('jarvis-mods') === '1';
  return jsx(Tooltip, {
    cloneCustomTrigger: true,
    closeOnTriggerClick: true,
    tooltipContent: label,
    side: 'right',
    children: jsxs(RailButton, {
      'aria-label': label,
      'aria-current': active ? 'page' : undefined,
      'data-kliment-mods-rail-button': '1',
      selected: active,
      onClick: () => {
        onOpenSidebarPopover?.();
        dispatchHostMessage({type: 'navigate-to-route', path: '/settings/general-settings?jarvis-mods=1'});
      },
      children: [
        jsxs('svg', {width: 20, height: 20, viewBox: '0 0 20 20', fill: 'none', stroke: 'currentColor', strokeWidth: 1.5, strokeLinecap: 'round', 'aria-hidden': true, children: [
          jsx('path', {d: 'M3 5h3m4 0h7M3 10h8m4 0h2M3 15h2m4 0h8'}),
          jsx('circle', {cx: 8, cy: 5, r: 2}),
          jsx('circle', {cx: 13, cy: 10, r: 2}),
          jsx('circle', {cx: 7, cy: 15, r: 2})
        ]}),
        jsx('span', {className: 'sr-only', children: label})
      ]
    })
  });
}
