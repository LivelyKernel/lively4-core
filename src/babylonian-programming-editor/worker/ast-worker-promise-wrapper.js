let globalMsgId = 0;

export default class ASTWorkerPromiseWrapper {
  
  constructor() {
    this._worker = new Worker("src/babylonian-programming-editor/worker/ast-worker-babel-wrapper.js");
  }
  
  async process(code, annotations, customInstances, sourceUrl, replacementUrls) {
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
    
    return new Promise((resolve, reject) => {
      this._worker.onmessage = (result) => {
        resolve(result.data.payload);
      };
      this._worker.postMessage(msg);
    });
  }
}
