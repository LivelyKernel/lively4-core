import { uuid } from 'utils';
import { setCode } from './workspaces.js';
import Preferences from "./preferences.js";

function rewriteSourceWithAsyncAwaitSupport(source) {
  return `(async secretAsyncLabel => {
  return { __asyncresult__: do {${source}}}
})()`;
}

export default async function boundEval(source, thisReference, targetModule) {
  try {
    // 'this' reference
    window.__global_this__ = thisReference; //  #BUG this breaks sometimes when there is a lot of async behavior... two scripts loaded in parallel ?
    
    // binding module
    window.__topLevelVarRecorder_ModuleName__ = targetModule;

    if (Preferences.get('UseAsyncWorkspace') && source.match(/await /) && !source.match(/import /)) {
      source = rewriteSourceWithAsyncAwaitSupport(source);
    }  

    // source
    // TODO: we currently use a newly generated UUID on each evaluation to trick SystemJS into actually loading it (therefore, we use codeId):
    let codeId = uuid();
    setCode(codeId, source);
    
    var path = 'workspace:' + encodeURI(codeId)
    if (Preferences.get('UseAsyncWorkspace')) {
      path = path.replace(/^workspace/, "workspaceasyncjs")
    } else if (Preferences.get('DisableAExpWorkspace')) {
      path = path.replace(/^workspace/, "workspacejs")
    }
    return await System.import(path)
      .then(m => {
        lively.unloadModule(path)
        return ({value: m.__result__ })});
  } catch(err) {
    return Promise.resolve({ value: err, isError: true });
  } finally {
    // console.log("BOUND EVAL UNLOAD " + path)
    lively.unloadModule(path)
  }
}
