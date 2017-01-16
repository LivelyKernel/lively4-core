import * as cop  from "src/external/ContextJS/src/contextjs.js";
import aceEditor from 'templates/juicy-ace-editor.js'




cop.layer(window, "DevLayer2").refineClass(aceEditor, {

 async boundEval(str, context) {
    // using lively vm:
    // return lively.vm.runEval(str, {targetModule: this.getTargetModule(), context: context})
    
    // src, topLevelVariables, thisReference, <- finalStatement
    
    try {
      console.log('eval with context', context);
      let id = generateUUID();
      setCode(id, str);
      return System.import('workspace:' + id);
    } catch(err) {
      return Promise.resolve({ value: err, isError: true });
    }
    
    /*
    return new Promise((resolve) => {
      var result = (function() {
      	return eval(str)
      }).bind(context)()
      resolve({value: result})
    })
    */
  }
})