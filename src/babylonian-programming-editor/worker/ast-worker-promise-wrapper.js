import SystemjsWorker from "src/worker/systemjs-worker.js";

let globalMsgId = 0;

export default class ASTWorkerPromiseWrapper {
  
  constructor() {
    // this._worker = new Worker("src/babylonian-programming-editor/worker/ast-worker-babel-wrapper.js");
    
    this._worker = new SystemjsWorker("src/babylonian-programming-editor/worker/ast-worker.js");
  }
  
  async process(code, annotations, customInstances, sourceUrl, replacementUrls) {
    console.log("ast-worker-promise-wrapper.js process" )
    
    const msgId = globalMsgId++;
    const msg = {
      id: msgId,
      payload:JSON.stringify({
        code: code,
        annotations: annotations,
        customInstances: customInstances,
        sourceUrl: sourceUrl,
        replacementUrls: replacementUrls
      })
    };
    
    return new Promise(async (resolve, reject) => {
      
      await this.loaded
      // TODO
      this._worker.onmessage = (result) => {
        console.log("ast-worker-promise-wrapper.js onmessage" )
        resolve(result.data.payload);
      };
      console.log("ast-worker-promise-wrapper.js postmessage" )
      this._worker.postMessage(msg);
    });
  }
}
