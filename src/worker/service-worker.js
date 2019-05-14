console.log("NEW SERVICE Worker")

/* ## Workflow to edit / run this service worker

1. edit file in lively
2. check "Update on reload" in ![](chrome_debugger_tools.png)
3. goto/open the "[...]/src/worker/service-worker.js" in a browser and press "F5"/reload 

*/

async function sendMessage(client, data) {
  return new Promise((resolve, reject) => {
    let channel = new MessageChannel()
    var done = false
    channel.port1.onmessage = (...args) => {
      done  = true
      resolve(...args)
    }
    client.postMessage(data, [channel.port2])
    setTimeout(() => {
      if (!done) reject("timeout")
    }, 5 * 60 * 1000)
  })
}

self.addEventListener('fetch', (evt) => {
  
  var url = evt.request.url 
  console.log("[swx] fetch " +  evt.request.method  + " " + url)  
  
  var method = evt.request.method
  var m =url.match(/^https\:\/\/lively4\/scheme\/(.*)/)
  if (m) {
    var path = "/" + m[1].replace(/^([^/]+)\/+/, "$1/") // expected format...
    
    console.log("[swx] POID GET " + url)  
    evt.respondWith(
      self.clients.get(evt.clientId)
        .then(async client => {
          if (!client) {
            throw new Error(`no client for event found`) 
          }
          return sendMessage(client, {
            name: 'swx:pi:' + method, 
            path: path,
            content: await evt.request.text()
          })
        }).then(evt => {
          return new Response(evt.data.content)              
        }))
  }

  // event.respondWith(promise);
  
})

