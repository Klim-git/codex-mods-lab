// Kliment Mods Lab: refuse a launch that could use the primary profile.
{
  const modsPath = require('node:path');
  const modsRoot = modsPath.resolve(process.resourcesPath, '../..');
  if (!process.env.KLIMENT_MODS_LAB_ROOT || modsPath.resolve(process.env.KLIMENT_MODS_LAB_ROOT) !== modsRoot ||
      !process.env.CODEX_ELECTRON_USER_DATA_PATH || modsPath.resolve(process.env.CODEX_ELECTRON_USER_DATA_PATH) !== modsPath.join(modsRoot, 'app-data') ||
      !process.env.CODEX_HOME || modsPath.resolve(process.env.CODEX_HOME) !== modsPath.join(modsRoot, 'codex-home')) {
    process.stderr.write('Use Launch-Mods.ps1 to start the isolated Mods Lab copy.\n');
    process.exit(78);
  }
}
// Label windows and install a read-only session flag before renderer scripts.
{
  const modsElectron = require('electron'), modsPath = require('node:path');
  const modsSafe = process.env.KLIMENT_MODS_LAB_SAFE_MODE === '1';
  const modsSessions = new WeakSet();
  const modsPreload = modsPath.join(process.resourcesPath, 'app.asar', '.vite/build/jarvis-safe-mode-preload.cjs');
  modsElectron.app.on('browser-window-created', (_modsEvent, modsWindow) => {
    if (modsSafe) {
      const modsSession = modsWindow.webContents.session;
      if (!modsSessions.has(modsSession)) {
        if (typeof modsSession.registerPreloadScript === 'function') modsSession.registerPreloadScript({type: 'frame', filePath: modsPreload});
        else modsSession.setPreloads([...modsSession.getPreloads(), modsPreload]);
        modsSessions.add(modsSession);
      }
      modsWindow.webContents.on('preload-error', (_event, filePath) => {
        if (filePath === modsPreload) {process.stderr.write('Safe Mode initialization failed.\n'); modsElectron.app.exit(79);}
      });
    }
    const modsSuffix = modsSafe ? ' · Safe Mode · Моды (тест)' : ' · Моды (тест)';
    modsWindow.on('page-title-updated', (event, title) => {
      if (!title.endsWith(modsSuffix)) {event.preventDefault(); modsWindow.setTitle(title + modsSuffix);}
    });
    modsWindow.setTitle('Mods Lab' + modsSuffix);
  });
}
