
// https://codemirror.net/doc/manual.html
export default class AutoCompletion {
  constructor(livelyCodeMirror, codeMirror) {
    
  }
  
  complete(livelyCodeMirror, codeMirror) {
    
    lively.openInspector(livelyCodeMirror);
  }
}

export function __unload__() {
  lively.success('__unload__ auto completion');
}

lively.success('load auto completion');
