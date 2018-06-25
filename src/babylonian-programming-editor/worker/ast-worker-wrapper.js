// Custom imports
// import ASTWorker from "./ast-worker.js";
import onmessage from "./ast-worker.js";

const resolves = {};
const rejects = {};
let globalMsgId = 0;

/**
 * Activate calculation in the worker, returning a promise
 */
function sendMsg(payload, worker){
  const msgId = globalMsgId++;
  const msg = {
    id: msgId,
    payload
  };

  return new Promise(function (resolve, reject) {
    // save callbacks for later
    resolves[msgId] = resolve;
    rejects[msgId] = reject;
    worker.postMessage(msg);
  });
}

/**
 * Handle incoming calculation result
 */
function handleMsg(msg) {
  const {id, err, payload} = msg.data;
  if (payload) {
    const resolve = resolves[id];
    if (resolve) {
      resolve(payload);
    }
  } else {
    // error condition
    const reject = rejects[id];
    if (reject) {
        if (err) {
          reject(err);
        } else {
          reject("Got nothing");
        }
    }
  }

  // purge used callbacks
  delete resolves[id];
  delete rejects[id];
}

/*
 * Promise wrapper for WebWorker
 * Based on https://codeburst.io/promises-for-the-web-worker-9311b7831733
 */
// TODO: This should be started in a WebWorker
// But for this, we need to be able to import modules in the worker
/*    
export default class ASTWorkerWrapper {
  constructor() {
    this.worker = new ASTWorker();
    this.worker.onmessage = handleMsg;
  }

  process(code, markers) {
    return sendMsg(JSON.stringify({
      code: code,
      markers: markers
    }), this.worker);
  }
}
*/
export default class ASTWorkerWrapper {
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

    const result = await onmessage({
      data: msg
    });
    
    return result.payload;
  }
}
