const worker = new Worker('demos/tom/plugin-explorer-worker.js')

export default function(source, urls) {
    return new Promise((resolve, reject) => {
        worker.onmessage = function(msg) {
            resolve(msg.data)
        }
        worker.onerror = function(msg) {
            reject(msg)
        }
        worker.postMessage({source, urls})
    })
}