async function proxyRequest(url, options={}) {
  console.log("PROXY reqest: " + options.method + " " + url)
  return self.originalFetch(url, {
      mode: options.mode,
      cache: options.cache,
      method: options.method,
      headers: options.headers,
      redirect: options.redirect,
      referrer: options.referrer,
      credentials: options.credentials,
      body: options.body && await options.body
    })
}

export async function installProxyFetch() {
  var focalStorage = (await System.import("src/external/focalStorage.js")).default
  
  var mounts = await focalStorage.getItem("lively4mounts")
  
  if (!mounts) return 
  
  self.lively4fetchHandlers = self.lively4fetchHandlers.filter(ea => !ea.isProxyFetch);
  
  self.lively4fetchHandlers.push({
    isProxyFetch: true,
    handle(request, options) {
      var url = (request.url || request).toString()
      var method = "GET"
      if (options && options.method) method = options.method;
      var m = url.match(/^https?:\/\/lively4(\/[^/]*)(\/.*)?/)
      if (m) {
        if (m[1] == "/") {
          return {
              result: new Response(JSON.stringify({
                name: "root",
                contents: []
              }, null, 2))
          }
        }
        
        console.log("proxy fetch " + url)
        var mountPoint = m[1]
        var rest = m[2]
       
        if (mountPoint == "/sys" && rest == "/mounts") {
          if (method == "GET") {
            return {
              result: new Response(JSON.stringify(mounts, null, 2))
            }            
          } else if (method == "PUT") {
            
            return {
              result: (async () => {
                try {
                  var json = options.body
                  var newMounts = JSON.parse(json)
                } catch(e) {
                  // json could not be parsed
                }
                if (newMounts) {
                  mounts = newMounts
                  await focalStorage.setItem("lively4mounts", mounts)
                  return new Response("updated mounts", {status: 200})
                } else {
                  return new Response("could not parse json: " + json, {status: 500})
                }
              })()
            }
          }
        }
        
        for (var proxy of mounts.filter(ea => ea.name == "http")) {
          if (mountPoint == proxy.path) {
            if (!proxy.options || !proxy.options.base) 
              throw new Error("options.base is missing in mount config for " + mountPoint)
            return {
              result: proxyRequest(proxy.options.base + rest, options)
            }  
          }
        }
        // give SWX a chance to handle POID requests...
        // return  {
        //   result: new Response("Could not handle " + url)
        // }          
      }
    }
  })
}


export async function installAuthorizedFetch() {
//   var focalStorage = (await System.import("src/external/focalStorage.js")).default
  
//   var mounts = await focalStorage.getItem("lively4mounts")
  
//   if (!mounts) return 
  
  var gh;
  
  self.lively4fetchHandlers = self.lively4fetchHandlers.filter(ea => !ea.isAuthFetch);
  
  self.lively4fetchHandlers.push({
    isAuthFetch: true,
    handle(request, options) {
      var url = (request.url || request).toString()
      var method = "GET"
      if (options && options.method) method = options.method;
      var m = url.match(/^https?:\/\/lively-kernel.org\/lively4S2\//)
      if (m) {
        return {
            result: (async () => {
              console.log("AuthorizedFetch: " + url)
            
              if (!gh) {
                console.log("Ensure Github Credentials: " + url)
                var GitHub = await System.import("src/client/github.js").then( m => m.default)
                gh = new GitHub();
                await gh.loadCredentials()
              } 
              
              if (!options) options = {};
              if (!options.headers) options.headers = {};
              options.headers = new Headers(options.headers) // ensure headers

              // inject authentification tokens into request
              if (!options.headers.get("gitusername")) {
                  options.headers.set("gitusername",  gh.username)
              }
              if (!options.headers.get("gitpassword")) {
                  options.headers.set("gitpassword", gh.token)
              }
          
              return proxyRequest(url, options)
            })()
        }  
    
               
      }
    }
  })
}

export async function installFetchHandlers() {
  await installProxyFetch()
  await installAuthorizedFetch()
} 


if (self.lively) {
  // dev time
 installFetchHandlers()
}

// installProxyFetch()
