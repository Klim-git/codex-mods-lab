import fs from 'node:fs';
import vm from 'node:vm';
import path from 'node:path';
import assert from 'node:assert/strict';
const source=fs.readFileSync(new URL('../.mods-lab/preview/early-bootstrap.patched.js', import.meta.url),'utf8');
const guard=source.slice(0,source.indexOf('// Label windows'));
const root=path.resolve('.mods-lab');
function execute(env){
  let exit=null;
  try {vm.runInNewContext(guard,{require: name=>{assert.equal(name,'node:path');return path;},process:{resourcesPath:path.join(root,'app/resources'),env,stderr:{write(){}},exit:code=>{exit=code;throw Error('EXIT');}}});}
  catch(e){if(e.message!=='EXIT')throw e;}
  return exit;
}
const isolated={KLIMENT_MODS_LAB_ROOT:root,CODEX_ELECTRON_USER_DATA_PATH:path.join(root,'app-data'),CODEX_HOME:path.join(root,'codex-home')};
assert.equal(execute(isolated),null);
assert.equal(execute({}),78);
assert.equal(execute({...isolated,CODEX_HOME:path.resolve('primary-profile/.codex')}),78);
assert.equal(execute({...isolated,CODEX_ELECTRON_USER_DATA_PATH:path.resolve('primary-profile/Codex')}),78);
console.log('PASS: isolated launch accepted; missing environment and primary profiles rejected.');
