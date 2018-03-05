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
  
  resolve() {
    this.element = ElementQuery.pathToElement(this.url)
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
  
  OPTIONS() {
    var element = this.element
    if (element.tagName == "LIVELY-FILE") {
      return new Response(JSON.stringify({
        name: element.name,
        // size: xxx?
        type: "file"
      }))
    }
    return new Response("We cannot do that", {status: 400})
  }
}


/* 
  EXAMPLES:
    // fetch("query://#haha", {method: "PUT", body: "<h1>foo</h1>heyho"})
    fetch("query://#haha")
*/
export class ElementQuery extends Scheme {
  
  static pathToElement(elementURL) {
    var selector = elementURL.replace(/^[a-zA-Z]+:\/\//,"") // .replace(/\./,"\\.")
    selector = decodeURI(selector)
    var element = document.body
    for(var subSelector of selector.split("/")) {
      console.log("subselector " + subSelector)
      if (subSelector == "") break;
      if (subSelector == "..") {
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
  
  elementToStat(element, withChildren) {
    return {
      name: element.id ? "#" + element.id.replace(/\./g, "\\.") : element.tagName, // quote points, because they are SYNTAX
      type: "element",
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
    this.register("livelyfile", LivelyFile) 
    this.register("query", ElementQuery) 
    this.register("queryall", ElementQueryAll) 
    this.register("innerhtml", InnerHTMLElementQuery) 
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
  
  static register(prefix, schema) {
    if (!this.schemas) this.schemas = {};
    this.schemas[prefix] = schema
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

PolymorphicIdentifier.load()

// window.fetch  = window.originalFetch

// fetch("https://lively-kernel.org/lively4/lively4-jens/README.md")t




