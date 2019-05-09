console.log("NEW SERVICE Worker")

/* ## Workflow to edit / run this service worker

1. edit file in lively
2. check "Update on reload" in ![](chrome_debugger_tools.png)
3. goto/open the "[...]/src/worker/service-worker.js" in a browser and press "F5"/reload 

*/


self.addEventListener('fetch', (evt) => {
  
  var url = evt.request.url 
  console.log("[swx] fetch " +  evt.request.method  + " " + url)  
  
  var method = evt.request.method
  if (url.match(/^https\:\/\/lively4\/scheme/,"")) {
    
    if(method == "GET") {
      console.log("[swx] POID GET " + url)  
      
    } else if(method == "PUT") {
      console.log("[swx] POID PUT " + url)  
      
    } else if(method == "OPTIONS") {    
      console.log("[swx] POID OPTIONS " + url)  
    }
  }

  // event.respondWith(promise);
  
})

