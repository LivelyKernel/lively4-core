var logpattern = /(lively4-jens)|(lively4-markus)/ 
var eventId = 0 // fallback
var eventCounter = 0

var eventStarts = new Map();


function timestamp(day) {
  function pad(num, size) {
      num = num.toString();
      while (num.length < size) num = "0" + num;
      return num;
  }
  return `${day.getFullYear()}-${pad(day.getMonth() + 1,2)}-${pad(day.getDate(),2)}T${pad(day.getUTCHours(), 2)}:${pad(day.getUTCMinutes(),2)}:${pad(day.getUTCSeconds(),2)}.${pad(day.getUTCMilliseconds(),3)}Z`
}

function log(eventId, ...attr) { 
  if (!self.location.href.match(logpattern)) return;
  var time = (performance.now() - eventStarts.get(eventId)).toFixed(2) 
  console.log("[swx] ", eventId, timestamp(new Date()), " " + time + "ms ",   ...attr)
}


log(0, "NEW SERVICE Worker", self)

/*MD ## Workflow to edit / run this service worker

1. edit file in lively
2. check "Update on reload" in ![](chrome_debugger_tools.png)
3. goto/open the "[...]/src/worker/service-worker.js" in a browser and press "F5"/reload 

MD*/

importScripts('src/external/focalStorage-swx.js');
/*globals focalStorage */

async function sendMessage(client, data, timeout=5 * 60 * 1000) {
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
    }, timeout)
  })
}



// fuck it... we gonna fuck around with the SWX again, because I cannot find any events that signal me 
// that there is a new client... we have to wait!

// let livelyClients = {}
// setTimeout(() => {
//   self.clients.matchAll().then((clients) => {
//     clients.forEach(function(client) {
//         sendMessage(client, {
//           name: "swx:started",
          
//         }).then(resp => {
//           livelyClients[client.id] = true // we could store the client here... but we don't need to yet
//           // log(eventId, "client answered back!", client)
//         })
//     })
//     log(eventId, 'anybody here?', clients)
//   })  
// }, 100)


function headersToJSO(headers) {
  var o = {}
  for(var [k,v] of headers.entries()) {
    o[k] = v
  }
  return o
}



self.addEventListener('fetch', (evt) => {
  var eventId = eventCounter++
  eventStarts.set(eventId, performance.now())
  var url = evt.request.url 
  log(eventId, "fetch " +  evt.request.method  + " " + url)  
  
  var method = evt.request.method
  var m =url.match(/^https\:\/\/lively4\/scheme\/(.*)/)
  if (m) {
    var path = "/" + m[1].replace(/^([^/]+)\/+/, "$1/") // expected format...
    
    log(eventId, "POID GET " + url)  
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

  /*
    Not everthing goes through our client side fetch... but we can try... to make it so!
  */
  // TODO replace this hard coded value with a config... at runtime
  if (url.startsWith("https://lively-kernel.org/lively4")) {
    if(evt.request.headers) {
      
      if (method == "GET" && 
          !evt.request.headers.get("lively-proxied") && 
          !evt.request.headers.get("lively-fetch") &&
          !evt.request.headers.get("debug-session") &&
          !url.match(/external\/jszip.js/) && /* boot time... we cannot handle that in any client...*/
          !url.match(/client\/boot.js/) &&
          !url.match(/media\/lively4_logo_smooth_100.png/) &&
          !url.match(/.lively4bundle.zip/) &&
          !url.match(/service-worker.js/) /* not myself */) {
        
        var headers = headersToJSO(evt.request.headers)
        
        // log(eventId, "SWX intercept " + url)
        // no session... we need not get through to the client again... do to the work
        evt.respondWith(
          self.clients.matchAll().then(async function(clientList) {
            for (var client of clientList) {
              if (client.url.match(/start.html$/)) {          
                log(eventId, "SWX found client: ", client)
                try {
                  // if (!livelyClients[client.id]) {
                  //   log(eventId, "DEBUG client is not ready yet!", client)
                  //   throw new Error("client is not ready yet!") // so don't wait on it            
                  // }
                  
                  log(eventId, "try proxy send:" +  client.id, url)
                  var msg = await sendMessage(client, {
                    name: 'swx:proxy:'+ method , 
                    url: url,
                    headers: headers
                  }, 5 * 1000 /*s*/);
                  if(!msg || !msg.data || msg.data.error) {
                    console.error("[swx] proxy error:" +  client.id, msg.data.error, msg)
                  } else {
                    log(eventId, "proxy, have result from a client... lets stop here")
                    break; // we have some answer
                  }
                } catch(e) {
                  console.warn("SWX message send timed out: " + client.id,  e)
                }
                // maybe another client is the right one?
                continue; 
              }
            } 
            
            if (!msg || !msg.data || !msg.data.content) {
              log(eventId, " SWX fallback... fetch again: " + url)
              return fetch(url, {
                method: method,
                headers: Object.assign(headers, {
                  "lively-proxied": "true" // prevent cycles....
                })
              })
            }
            log(eventId, " PROXY successfull", url, msg.data.headers)
            return new Response(msg.data.content, {
              status: msg.data.status,
              statusText: msg.data.statusText,
              headers: msg.data.headers
            })    
          })
        );
      } else {
         log(eventId, " SWX let it go through: " + url)
      }
    }
  }
  
  
  
  m =url.match("https://lively-kernel.org/(voices)|(research)") // #TODO get rid of this!!!
  if (m) {
     if (!evt.request.headers.get("gitusername")) {
       evt.respondWith(
          (async () => {
          var storagePrefix = "LivelySync_"
          var token = await focalStorage.getItem(storagePrefix + "githubToken")
          var username = await focalStorage.getItem(storagePrefix + "githubUsername")
          // var email = await focalStorage.getItem(storagePrefix + "githubEmail")

          // log(eventId, "VOICES AUTH NEEDED " + token + " " + username + " " + email)
          // return new Response(evt.data.content)               
          var headers = new Headers(evt.request.headers || {})
          
          // inject authentification tokens into request
          /*MD ### see also [fetch](edit://src/client/fetch.js) MD*/
          if (!headers.get("gitusername")) {
              headers.set("gitusername",  username)
          } 
          if (!headers.get("gitpassword")) {
              headers.set("gitpassword", token)
          }
          var resp = await fetch(evt.request.url, {
            method: evt.request.method,
            headers: {
              gitusername: username,
              gitpassword: token
            }
          })
          return resp
       })()
       )   
    }
  }
  
  // event.respondWith(promise);
  
})

