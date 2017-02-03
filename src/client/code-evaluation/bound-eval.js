import generateUUID from './../uuid.js';
import { setCode } from './../workspaces.js';

export default async function boundEval(source, thisReference, targetModule) {
  try {
    // 'this' reference
    window.__global_this__ = thisReference;
    
    // binding module
    window.__topLevelVarRecorder_ModuleName__ = targetModule;

    // source
    // TODO: we currently use a newly generated UUID on each evaluation to trick SystemJS into actually loading it (therefore, we use codeId):
    let codeId = generateUUID();
    setCode(codeId, source);
    
    return System.import('workspace:' + encodeURI(codeId))
      .then(m => ({ value: m.__result__ }));
  } catch(err) {
    return Promise.resolve({ value: err, isError: true });
  }
}
