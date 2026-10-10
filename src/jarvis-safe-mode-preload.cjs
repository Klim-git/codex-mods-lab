// This trusted preload exposes only one immutable boolean, no Node or host APIs.
const {contextBridge} = require('electron');
contextBridge.exposeInMainWorld('klimentModsSession', Object.freeze({safeMode: true}));
