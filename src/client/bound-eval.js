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
    let codeId = uuid();
    var path = 'workspace:' + encodeURI(codeId)
       
    // 'this' reference
    if (!self.__pluginDoitThisRefs__) {
      self.__pluginDoitThisRefs__ = {};
    } 
    self.__pluginDoitThisRefs__[codeId] = thisReference;
    
        
    if (!self.__topLevelVarRecorder_ModuleNames__) {
      self.__topLevelVarRecorder_ModuleNames__ = {};
    } 
    // console.log("boundEval register " + codeId + " -> " +targetModule)
    self.__topLevelVarRecorder_ModuleNames__[codeId] = targetModule;
    
    
    if (Preferences.get('UseAsyncWorkspace') && source.match(/await /) && !source.match(/import /)) {
      source = rewriteSourceWithAsyncAwaitSupport(source);
    }  

    // source
    // TODO: we currently use a newly generated UUID on each evaluation to trick SystemJS into actually loading it (therefore, we use codeId):
    setCode(codeId, source);
    
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
