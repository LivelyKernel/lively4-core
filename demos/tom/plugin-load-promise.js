export default function(source, pluginData) {
  return new Promise((resolve, reject) => {
    const worker = new Worker('demos/tom/plugin-explorer-worker.js')
    worker.onmessage = function(msg) {
      resolve(msg.data);
      worker.terminate();
    }
    worker.onerror = function(msg) {
      reject(msg);
      worker.terminate();
    }
    worker.postMessage({ source, pluginData })
  })
}
