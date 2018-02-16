
// ContextJS seems to have a problem with this.. so we do it manaally
if (!window.originalFetch) window.originalFetch = window.fetch


function pathToElement(elementURL) {
  var selector = elementURL.replace("livelyfile:\/\/","").replace(/\./,"\\.")
  selector = decodeURI(selector)
  if (selector  == "") return document
  try {
    var element = document.querySelector(selector)
  } catch(e) {
    return undefined
  }
  if (!element) {
    throw new Error("Could not find element at " + selector)
  }
  return element
}


function responseText(status, text) {
  return new Response(text, {status: 300})
}

// overwriting "fetch" instead doing it in the service worker hast the advantage 
// of havving access to the browser, which we would have to implement through an additional 
// channel back... 
// And we do it because we can support arbitrary URLs that way and don't have to missuse HTTP // requests to https://lively4/
window.fetch = async function(request, options, ...rest) {
  var url = request
  if (url.toString().match(/^livelyfile:\/\//)) {
    var element = pathToElement(url.toString())
    if (!element) {
      return new Response("Could not find " + url, {status: 404})
    }  
    if (!options || options.method == "GET") {
      if (element.tagName == "LIVELY-FILE") {
        return fetch(element.url)
      }
      // return a response 
      return new Response("not supported yet", {status: 300})
    } 
    if (options.method == "PUT") {
      if (element.tagName == "LIVELY-FILE") {
        if (element.setContent && options) {
          element.setContent(options.body)
          return new Response("")
        } else {
          return new Response("Hmm... I don't know.", {status: 500})      
        }
      }
      // return a response 
      return new Response("We cannot do that", {status: 400})
    }
    if (options.method == "OPTIONS") {
      if (element.tagName == "LIVELY-FILE") {
        return new Response(JSON.stringify({
          name: element.name,
          // size: xxx?
          type: "file"
        }))
      }
      // return a response 
      return new Response("We cannot do that", {status: 400})
    }
    return new Response("Request not supported", {status: 400})      
  }
  return window.originalFetch.apply(window, [request, options, ...rest])
}

// fetch("https://lively-kernel.org/lively4/lively4-jens/README.md")t




