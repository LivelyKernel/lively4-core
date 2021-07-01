
var baseUrlsAuthNeeded = [ "https://lively-kernel.org/voices","https://lively-kernel.org/research"] // #TODO how to detect this?
var baseUrlsAuthNeededForWriting = [ "https://lively-kernel.org/lively4"]

async function proxyRequest(url, options={}) {
  // console.log("PROXY reqest: " + options.method + " " + url)
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
        
        // console.log("proxy fetch " + url)
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
  var gh = window.lively4github  
  self.lively4fetchHandlers = self.lively4fetchHandlers.filter(ea => !ea.isAuthFetch);
  self.lively4fetchHandlers.push({
    isAuthFetch: true,
    handle(request, options) {
      var url = (request.url || request).toString()
      var method = "GET"
      if (options && options.method) method = options.method;
      
      var isWriting = method != "OPTIONS" && method != "GET" && method != "HEAD"
      
      async function ensureGithubLogin() {
        if (!gh && window.lively) {
          console.log("Ensure Github Credentials: " + url)
          var GitHub = await System.import("src/client/github.js").then( m => m.default)
          window.lively4github =  new GitHub();
          gh = window.lively4github
          await gh.loadCredentials()
        }
      }
      
      function addUserNameAndPassword(options, username="anonymous", password="xxx") {
        if (!options) options = {};
        if (!options.headers) options.headers = {};
        options.headers = new Headers(options.headers) // ensure headers

        // inject authentification tokens into request
        if (!options.headers.get("gitusername")) {
            options.headers.set("gitusername",  username)
        }
        if (!options.headers.get("gitpassword")) {
            options.headers.set("gitpassword", password)
        }
        return options
      }
      
      if (baseUrlsAuthNeeded.find( ea => url.startsWith(ea))) {
        return {
            result: (async () => {
              console.log("AuthorizedFetch: " + url)
              await ensureGithubLogin() 
              options =  addUserNameAndPassword(options, gh.username,   await gh.token)
              return proxyRequest(url, options)
            })()
        }          
      }
      
      if  (isWriting && baseUrlsAuthNeededForWriting.find(
          ea => url.startsWith(ea) && !url.startsWith(lively4url + "/.transpiled/")  )) {
        return {
            result: (async () => {
              console.log("AuthorizedFetch Write: " + url)
              ensureGithubLogin() // but don't wait... we want to avoid deadlocks... or if there is no login..
              if (gh) {
                options = addUserNameAndPassword(options, gh.username,  gh.token)
              } else {
                options = addUserNameAndPassword(options)
              }
              return proxyRequest(url, options)
            })()
        }
      }
    }
  })
}

export async function installDebugFetch() {
  self.lively4fetchHandlers = self.lively4fetchHandlers.filter(ea => !ea.isDebugFetch);
  self.lively4fetchHandlers.push({
    isDebugFetch: true,
    options(request, options, debugEventId) {
      var url = (request.url || request).toString()
      if (url.match(/lively4(S2)?\//)) {
        // console.log("DEBUG FETCH " + url)
        if (!options) {
          options = {
            method: "GET"
          }
        }
        if (!options.headers) {
          options.headers = new Headers()
        }
        if (options.headers.set) {
          var stack = self.lively ? ''+lively.stack() : "";
          if(!options.headers.get("debug-initiator")) {
            options.headers.set("debug-initiator", JSON.stringify(stack.split("\n").slice(4).map(ea => ea.replace("    at ",""))))
            options.headers.set("debug-session", self.lively4session)
            options.headers.set("debug-eventid", debugEventId)
            window.lively4log(debugEventId, "debug-session=" +self.lively4session)
          }
          
          
          return options  
        } else {
          // convert first?
        }
        
        
      }
      
    }   
  })
}


export async function installFetchHandlers() {
  await installProxyFetch()
  await installAuthorizedFetch()
  await installDebugFetch()
} 


if (self.lively) {
  // dev time
 installFetchHandlers()
}
