// Version-pinned fragment appended to app-initial: reuse its native rail button,
// tooltip, router location, and the same host navigation used by Settings.
function JarvisModsRailButton({onOpenSidebarPopover}) {
  const location = Pr();
  const active = location.pathname === '/settings/general-settings' && new URLSearchParams(location.search).get('jarvis-mods') === '1';
  return O2.jsx(Pn, {
    cloneCustomTrigger: true,
    closeOnTriggerClick: true,
    tooltipContent: 'Моды',
    side: 'right',
    children: O2.jsxs(k0o, {
      'aria-label': 'Моды',
      'aria-current': active ? 'page' : undefined,
      'data-kliment-mods-rail-button': '1',
      selected: active,
      onClick: () => {
        onOpenSidebarPopover?.();
        Ho.dispatchHostMessage({type: 'navigate-to-route', path: '/settings/general-settings?jarvis-mods=1'});
      },
      children: [
        O2.jsxs('svg', {width: 20, height: 20, viewBox: '0 0 20 20', fill: 'none', stroke: 'currentColor', strokeWidth: 1.5, strokeLinecap: 'round', 'aria-hidden': true, children: [
          O2.jsx('path', {d: 'M3 5h3m4 0h7M3 10h8m4 0h2M3 15h2m4 0h8'}),
          O2.jsx('circle', {cx: 8, cy: 5, r: 2}),
          O2.jsx('circle', {cx: 13, cy: 10, r: 2}),
          O2.jsx('circle', {cx: 7, cy: 15, r: 2})
        ]}),
        O2.jsx('span', {className: 'sr-only', children: 'Моды'})
      ]
    })
  });
}
