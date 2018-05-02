/* Polymorphic Identifier */

import FileCache from 'src/client/filecache.js'

export class ObjectResponse {
 
  constructor(result, options) {
    this.status = (options && options.status) ? options.status : 200;
    this.result = result
  }
  
  async object() {
    return this.result
  }
  
  async text() {
    return ""
  }

  async json() {
    return this.text().then(t => JSON.parse(t))  
  }

  async blob() {
    throw new Error("blob not supported")
  }
}

export class Scheme {  
  constructor(url) {
    this.url = url
  }
  
  get scheme() {
    throw new Error("subcluss responsibility")
  }

  static get scheme() {
    return (new this()).scheme
  } 
  
  GET() {
    return new Response("not supported yet", {status: 300})
  }  

  PUT() {
    return new Response("not supported yet", {status: 300})
  }  

  OPTIONS() {
    return new Response("not supported yet", {status: 300})
  }  

  async handle(options) {
    if (!this.resolve()) {
      return new Response("Could not resolve " + this.url, {status: 404})
    }  
    if (this.GET && (!options || options.method == "GET")) { // GET is default
      return this.GET(options)
    } else if (this.PUT && options.method == "PUT") {
      return this.PUT(options)
    } else if (this.OPTIONS && options.method == "OPTIONS") {
      return this.OPTIONS(options)
    }
    return new Response("Request not supported", {status: 400})    
  }     
}

/* 
  EXAMPLES:
    fetch("livelyfile://#README.md").then(t => t.text())
    fetch("livelyfile://#README2.md", {method: "PUT", body: "heyho"})
*/

export class LivelyFile extends Scheme {
  
  get scheme() {
    return "livelyfile"
  }

  static pathToFile(fileURL) {
    var selector = fileURL.replace(/^[a-zA-Z]+:\/\//,"") // .replace(/\./,"\\.")
    selector = decodeURI(selector)
    var element = document.body
    for(var subSelector of selector.split("/")) {
      if (subSelector == "") {
        // nothing
      } else if (subSelector == "..") {
        if (element) {
          element = element.parentElement          
        }
      } else {
        try {
          element = element.querySelector(":scope > #" + subSelector.replace(/\./,"\\."))
        } catch(e) {
          console.warn("query error " + e)
          return undefined
        }              
      }
    }
    return element
  }
  
  
  resolve() {
    this.element = LivelyFile.pathToFile(this.url)
    console.log("found " + this.element, this.url)
    return this.element 
  }  

  GET(options) {
    var element = this.element
    if (element.tagName == "LIVELY-FILE") {
      return fetch(element.url)
    }
    return super.GET(options)
  }

  PUT(options) {
    var element = this.element
    if (element.tagName == "LIVELY-FILE") {
        if (element.setContent && options) {
          element.setContent(options.body)
          return new Response("")
        } else {
          return new Response("Hmm... I don't know.", {status: 500})      
        }
      }
    return super.PUT(options)
  }
  
  fileToStat(element, withChildren) {
    return {
      name: element.id,
      parent: LivelyFile.fileToURI(element.parentElement),
      type: element.tagName == "LIVELY-FILE" ? "file" : "directory",
      contents: withChildren ? (Array.from(element.childNodes)
        .filter(ea => ea.id && ea.classList && ea.classList.contains("lively-content"))
        .map(ea => this.fileToStat(ea, false))) : undefined
    }
  }
  
  static fileToURI(file) {
    if (!file.parentElement) {
      return this.scheme + "://"
    }
    var url = this.fileToURI(file.parentElement) 
    if (file.id) {
      url += "/" + file.id 
    } else {
      // we should not allow this?
    }
    return url
  }
  
  OPTIONS() {
    var element = this.element
    if (element) {
      return new Response(JSON.stringify(this.fileToStat(element, true)))
    }
    return new Response("We cannot do that", {status: 400})
  }
}


export class LivelySearch extends Scheme {
  
  get scheme() {
    return "search"
  }

  resolve() {
    return true
  }  

  async generateResult(dbQuery) {
    var result = ""
    var count = 0
    await dbQuery.each(ea => {
        result += `<li>${++count}. <a href="${ea.url}">${ea.name}: ${
          ea.title.replace(/</g,"&lt;")}</a></li>`
    })
    if (count == 0) {
      result += "<b>no files found</b>"
    }
    return result
  }
  
  async GET(options) {
    var searchString = this.url.toString().replace(/^search:\/\//,"") 
    var result = ""
    if (searchString.match("name=")) {
      var filename = searchString.replace(/name=/g,"")
      result += await this.generateResult(
        FileCache.current().db.files.where("name").equals(filename))
    } else if (searchString.match(/^#/)) {
      var tag = searchString
      result += await this.generateResult(
        FileCache.current().db.files.where("tags").notEqual([]).filter(ea => ea.tags.indexOf(tag) != -1))
    } else {
      result = "<b>nothing found</b>"  
    }
    
    // #Hack, if we are in a "browser" just... go forward
    result += `
<div>
<script data-name="livelyLoad" type="lively4script">
function livelyLoad() {
var links = this.parentElement.querySelectorAll("a")

if (links.length == 1) {

  if (lively.lastBackButtonClicked && (Date.now() - lively.lastBackButtonClicked < 2000)) {
    lively.notify("Prevent auto navigation... we just clicked back...")
    return
  } 
  lively.notify("only one link? Click on it!")
  links[0].dispatchEvent( new MouseEvent('click', {
     view: window,
     bubbles: true,
     cancelable: true
  }))
}
}
</script>
</div>
`
    return new Response(`<h1>Search: ${searchString}</h1>\n${result}`, {status: 200})
    
    
    // return new Response("<h1>Nothing found</h1>", {status: 200})
  }

  PUT(options) {
    return new Response("Does not make sense, to PUT a search...", {status: 400})
  }
    
  OPTIONS() {
    var result = {
      name: "Search",
      type: "directory",
      contents: []
    }
    return new Response(JSON.stringify(result), {status: 200})
  }
}

export class LivelyOpen extends Scheme {
  
  get scheme() {
    return "open"
  }

  resolve() {
    return true
  }  
  
  async GET(options) {
    var openString = this.url.toString().replace(/^open:\/\//,"") 
    var result
    try {
      result = await lively.openComponentInWindow(openString)
    } catch(e) {
      return new Response("failed to open " + openString, {status: 400})
    }
    
    return new ObjectResponse(result, {status: 200});
    
  }

  PUT(options) {
    return new Response("Does not make sense, to PUT a search...", {status: 400})
  }
    
  OPTIONS() {
    var result = {
      name: "open ",
      type: "file",
      donotfollowpath: true,
      contents: []
    }
    return new Response(JSON.stringify(result), {status: 200})
  }
}


export class LivelyBrowse extends Scheme {
  
  get scheme() {
    return "browse"
  }

  resolve() {
    return true
  }  
  
  async GET(options) {
    var openString = this.url.toString().replace(/^browse:\/\//,"") 
    var result
    try {
      
      result = await lively.openBrowser(lively4url + "/" + openString )
    } catch(e) {
      return new Response("failed to open " + openString, {status: 400})
    }
    
    return new ObjectResponse(result, {status: 200});
    
  }

  PUT(options) {
    return new Response("Does not make sense, to PUT a search...", {status: 400})
  }
    
  OPTIONS() {
    var result = {
      name: "open ",
      type: "file",
      donotfollowpath: true,
      contents: []
    }
    return new Response(JSON.stringify(result), {status: 200})
  }
}


/* 
  EXAMPLES:
    // fetch("query://#haha", {method: "PUT", body: "<h1>foo</h1>heyho"})
    fetch("query://#haha")
*/
export class ElementQuery extends Scheme {
  
  get scheme() {
    return "query"
  }
  
  static pathToElement(elementURL) {
    var selector = elementURL.replace(/^[a-zA-Z]+:\/\//,"") // .replace(/\./,"\\.")
    selector = decodeURI(selector)
    var element = document.body
    for(var subSelector of selector.split("/")) {
      if (subSelector == "") {
        // nothing
      } else if (subSelector == "..") {
        if (element) {
          element = element.parentElement          
        }
      } else {
        try {
          element = element.querySelector(subSelector)
        } catch(e) {
          console.warn("query error " + e)
          return undefined
        }              
      }
    }
    return element
  }
  
  resolve() {
    this.element = ElementQuery.pathToElement(this.url)
    return this.element
  }
  
  GET(options) {
    var element = this.element
    if (element) {
      return new ObjectResponse(element, {status: 200});
    }
    return super.GET(options)
  }
  
  elementToURI(element) {
    if (!element.parentElement) {
      return this.scheme + "://"
    }
    var url = this.elementToURI(element.parentElement) 
    if (element.id) {
      url += "/" + this.elementIdQuery(element) 
    }
    return url
  }
  
  elementIdQuery(element) {
    return "#" + element.id.replace(/\./g, "\\.")
  }
  
  elementToStat(element, withChildren) {
    return {
      name: element.id ? this.elementIdQuery(element) : element.tagName, // quote points, because they are SYNTAX
      type: "element",
      parent: this.elementToURI(element.parentElement), // URI to parent element / file / for navigation...
      contents: withChildren ? (Array.from(element.childNodes)
        .filter(ea => ea.id)
        .map(ea => this.elementToStat(ea, false))) : undefined
    }
  }
  
  OPTIONS() {
    if (this.element) {
      return new Response(JSON.stringify(this.elementToStat(this.element, true)))
    }
    return new Response("We cannot do that", {status: 400})
  }
}


/* 
  EXAMPLES:
    fetch("queryall://div")
*/
export class ElementQueryAll extends Scheme {
  
  get scheme() {
    return "queryall"
  }

  
  static pathToElements(elementURL) {
    var selector = elementURL.replace(/^[a-zA-Z]+:\/\//,"").replace(/\./,"\\.")
    selector = decodeURI(selector)
    if (selector  == "") return document
    try {
      var elements = Array.from(document.querySelectorAll(selector))
    } catch(e) {
      console.warn("query error " + e)
      return undefined
    }
    return elements
  }
  
  resolve() {
    this.elements = ElementQueryAll.pathToElements(this.url)
    return this.elements
  }
  
  GET(options) {
    if (this.elements) {
      return new ObjectResponse(this.elements, {status: 200});
    }
    return super.GET(options)
  }
  
}

/* 
  EXAMPLES:
    fetch("innerhtml://#haha", {method: "PUT", body: "<h1>foo</h1>heyho"})
    fetch("innerhtml://#haha").then(t => t.text())
*/
export class InnerHTMLElementQuery extends ElementQuery {
  get scheme() {
    return "innerhtml"
  }

  GET(options) {
    var element = this.element
    if (element) {
      return new Response(element.innerHTML, {status: 200})      

    }
    return super.GET(options)
  }

  PUT(options) {
    var element = this.element
    if (element) {
      element.innerHTML = options && options.body ? options.body : "" 
      return new Response("")
    }
    return super.PUT(options)
  }
  
 
}


export default class PolymorphicIdentifier {
  
  static load() {
    this.register(LivelyFile) 
    this.register(ElementQuery) 
    this.register(ElementQueryAll) 
    this.register(InnerHTMLElementQuery) 
    this.register(LivelySearch)
    this.register(LivelyOpen)
    this.register(LivelyBrowse)
  }
  
  static url(request) {
    if (request && request.url) {
      return request.url.toString()
    } else {
      return request.toString()
    }
  }
  
  // #Refactor schemeFor
  static schemaFor(url) {
    var m = url.match(/^([A-Za-z0-9]+):\/\//)
    if (!m || !this.schemas) return
    return this.schemas[m[1]]  
  }
  
  static register(scheme) {
    if (!this.schemas) this.schemas = {};
    this.schemas[scheme.scheme] = scheme
  }
  
  static handle(request, options) {
    var url = this.url(request)
    var schema = PolymorphicIdentifier.schemaFor(url)
    if (!schema) return
    var handler = new schema(url)
    handler.result = handler.handle(options)
    return handler
  }  
}


// overwriting "fetch" instead doing it in the service worker has the advantage 
// of havving access to the browser, which we would have to implement through an additional 
// channel back... 
// And we do it because we can support arbitrary URLs that way and don't have to missuse HTTP // requests to https://lively4/

// ContextJS seems to have a problem with this.. so we do it manaally
if (!window.originalFetch) window.originalFetch = window.fetch

window.fetch = async function(request, options, ...rest) {
  var handler = PolymorphicIdentifier.handle(request, options)
  if (handler) return handler.result;
  return window.originalFetch.apply(window, [request, options, ...rest])
}


lively.removeEventListener("poid", navigator.serviceWorker)
lively.addEventListener("poid", navigator.serviceWorker, "message", async (evt) => {
  try {
    let m = evt.data.path.match(/^\/([a-zA-Z0-9]+)\/(.*)$/)
    if (!m) {
      throw new Error("Requested path does mot fit a scheme! path='" + evt.data.path +"'")        
    }
    let url= m[1] + "://" + m[2]    
    if(evt.data.name == 'swx:pi:GET') {
      evt.ports[0].postMessage({content: await fetch(url).then(r => r.blob())}); 
    } else if(evt.data.name == 'swx:pi:PUT') {
      evt.ports[0].postMessage({
        content: await fetch(url, {
          method: "PUT", 
          body: event.data.content
        }).then(r => r.blob())}); 
    } else if(evt.data.name == 'swx:pi:OPTIONS') {
      evt.ports[0].postMessage({content: await fetch(url, {
        method: "OPTIONS"
      }).then(r => r.blob())}); 
    }
  } catch(err) {
    evt.ports[0].postMessage({error: err});
  }
});



PolymorphicIdentifier.load()

// window.fetch  = window.originalFetch

// fetch("https://lively-kernel.org/lively4/lively4-jens/README.md")t




