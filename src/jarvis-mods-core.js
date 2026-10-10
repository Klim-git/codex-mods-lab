import {getHostReact, getHostJsx} from './jarvis-host-adapter.js';
import {isModsSafeMode} from './jarvis-safe-mode.js';
import {JarvisRecoveryManager} from './jarvis-recovery-manager.js';
const CoreReact = getHostReact(), {jsx: coreJsx} = getHostJsx();
const modulePromises = new Map();
function loadOnce(key, loader) {
  if (!modulePromises.has(key)) modulePromises.set(key, loader());
  return modulePromises.get(key);
}
class ModsSurfaceBoundary extends CoreReact.Component {
  constructor(props) {super(props); this.state = {failed: false};}
  static getDerivedStateFromError() {return {failed: true};}
  componentDidCatch() {console.warn('[mods-lab] A mod surface was paused after an error.');}
  render() {return this.state.failed ? this.props.fallback : this.props.children;}
}
function lazyModSurface(key, name, loader, fallback = () => null) {
  return function ModsSurface(props) {
    if (isModsSafeMode()) return fallback(props, true);
    const [module, setModule] = CoreReact.useState(null), [failed, setFailed] = CoreReact.useState(false);
    CoreReact.useEffect(() => {
      let alive = true;
      loadOnce(key, loader).then(value => {if (alive) setModule(value);}).catch(() => {if (alive) setFailed(true);});
      return () => {alive = false;};
    }, []);
    const recovery = fallback(props, failed);
    if (failed || !module) return recovery;
    return coreJsx(ModsSurfaceBoundary, {fallback: fallback(props, true), children: coreJsx(module[name], props)});
  };
}
export const JarvisModsPanel = lazyModSurface('settings', 'JarvisModsPanel', () => import('./jarvis-mods-native.js'), (_props, failed) => failed ? coreJsx(JarvisRecoveryManager, {loadFailure: !isModsSafeMode()}) : null);
export const JarvisContextBarRoot = lazyModSurface('context', 'JarvisContextBarRoot', () => import('./jarvis-context-bar.js'));
export const JarvisFunctionalActionsRoot = lazyModSurface('functional', 'JarvisFunctionalActionsRoot', () => import('./jarvis-functional-mods-runtime.js'));
export const JarvisVisualStylesRoot = lazyModSurface('visual', 'JarvisVisualStylesRoot', () => import('./jarvis-visual-mods-runtime.js'));
const loadBookmarks = () => import('./jarvis-bookmarks.js');
export const JarvisBookmarksSurface = lazyModSurface('bookmarks', 'JarvisBookmarksSurface', loadBookmarks, props => props.children);
export const JarvisBookmarkMessageButton = lazyModSurface('bookmarks', 'JarvisBookmarkMessageButton', loadBookmarks);
export function findBookmarkTarget(container, unitKey) {
  if (!container) return null;
  return [...container.querySelectorAll('[data-content-search-unit-key]')].find(element => element.dataset.contentSearchUnitKey === unitKey) ?? null;
}
