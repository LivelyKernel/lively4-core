/*MD # Polymorphic Identifier 
[architecture](browse://doc/architecture/polymorphic-identifiers.md)
MD*/

import FileIndex from 'src/client/fileindex.js'
var FileCache = FileIndex;

export class ValueResponse {
 
  constructor(value, { status = 200 } = {}) {
    this._value = value;
    this.status = status;
  }
  
  async object() {
    return this._value;
  }
  
  async value() {
    return this._value;
  }
  
  async text() {
    return '' + this._value;
  }

  async json() {
    const jsonString = JSON.stringify(await this.value());
    return JSON.parse(jsonString);
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

  POST() {
    return new Response("not supported yet", {status: 300})
  }

  DELETE() {
    return new Response("not supported yet", {status: 300})
  }

  MKCOL() {
    return new Response("not supported yet", {status: 300})
  }

  async handle(options) {
    if (!this.resolve()) {
      if (this.PUT && options && options.method == "PUT") {
        return this.PUT(options, true)  
      }
      
      if (options && options.method == "OPTIONS") {
        return new Response(JSON.stringify({error: "Could not resolve " + this.url}), {status: 404})  
      }
      return new Response("Could not resolve " + this.url, {status: 404})
    }  
    if (this.GET && (!options || options.method == "GET")) { // GET is default
      return this.GET(options)
    } else if (this.PUT && options.method == "PUT") {
      return this.PUT(options)
    } else if (this.OPTIONS && options.method == "OPTIONS") {
      return this.OPTIONS(options)
    } else if (this.PATCH && options.method == "PATCH") {
      return this.PATCH(options)
    } else if (this.POST && options.method == "POST") {
      return this.POST(options)
    } else if (this.DELETE && options.method == "DELETE") {
      return this.DELETE(options)
    } else if (this.HEAD && options.method == "HEAD") {
      return this.HEAD(options)
    } else if (this.MKCOL && options.method == "MKCOL") {
      return this.MKCOL(options)
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
          element = element.querySelector(`:scope > [name="${subSelector.replace(/\./,"\\.")}"]`)
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
    // lively.showElement(this.element) // very funny to see which file is asked...
    return this.element 
  }  

  GET(options) {
    console.log("LivelyFile GET " + this.url)
    var element = this.element
    if (element.tagName == "LIVELY-FILE") {
      if (!element.url) {
         return new Response(`lively-file found, but url attribute is missing...`, {status: 500})
      }
      return fetch(element.url)
    }
    return super.GET(options)
  }

  async PUT(options, newfile) {
    if (newfile) {
      
      var filename = this.url.replace(/.*\//,"")
      var parentURL = this.url.replace(/\/[^/]*$/,"")
      var parent = LivelyFile.pathToFile(parentURL) 
      if (!parent) {
        return new Response(`Could not create ${filename}, because parent element not found: ${parentURL}`, {status: 404})
      } 
      var siblings = Array.from(parent.querySelectorAll(":scope > lively-file")).sort((a,b) => {
        var aPos = lively.getPosition(a),
          bPos =  lively.getPosition(b)
        if (aPos.y == bPos.y ) {
          return aPos.x - bPos.x
        }
        return aPos.y - bPos.y
      })
      this.element = await lively.create("lively-file", parent)
      this.element.name = filename
      lively.setPosition(this.element, lively.pt(0,0))
      if (siblings.length > 0 ) {
        var lastSibling = siblings.last
        var pos = lively.getPosition(lastSibling)
        pos = pos.addPt(lively.pt(80,0))
        if (pos.x + 50 > lively.getExtent(parent).x) {
          pos = lively.pt(0, pos.y + 80)
        } 
        
        lively.setPosition(this.element, pos)
        
      }
      
      lively.showElement(this.element)
      
    }
    
    var element = this.element
    if (element.tagName == "LIVELY-FILE") {
        if (element.setContent && options) {
          element.setContent(options.body, options.headers && options.headers['Content-Type'])
          return new Response("")
        } else {
          return new Response("Hmm... I don't know.", {status: 500})      
        }
      }
    return super.PUT(options)
  }
  
  fileToStat(element, withChildren) {
    return {
      name: element.name,
      parent: LivelyFile.fileToURI(element.parentElement),
      type: element.tagName == "LIVELY-FILE" ? "file" : "directory",
      contents: withChildren ? (Array.from(element.childNodes)
        .filter(ea => ea.name && ea.classList && ea.classList.contains("lively-content"))
        .map(ea => this.fileToStat(ea, false))) : undefined
    }
  }
  
  static fileToURI(file) {
    if (!file.parentElement) {
      return this.scheme + "://"
    }
    var url = this.fileToURI(file.parentElement) 
    if (file.name) {
      url += "/" + file.name
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
    // } else if (searchString.match(/^#/)) {
    //   var tag = searchString
    //   result += await this.generateResult(
    //     FileCache.current().db.files.where("tags").notEqual([]).filter(ea => ea.tags.indexOf(tag) != -1))
    } else {
      var root = lively4url
      var count = 0
      await FileIndex.current().db.files.each(file => {
        if (file.url.startsWith(root) && file.content) {
          var m = file.content.match(searchString)
          if (m) {
             result += `<li>${++count}. <a href="${file.url}">${file.name}: ${
                file.title.replace(/</g,"&lt;")}</a></li>`
          }
        }
      })
    }
    // result = "<b>nothing found</b>"  
    
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
      if (result.livelyExample) result.livelyExample(); // fill in with example content}
    } catch(e) {
      return new Response("failed to open " + openString, {status: 400})
    }
    
    return new ValueResponse(result, {status: 200});
    
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
    
    return new ValueResponse(result, {status: 200});
    
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


export class LivelyWikipedia extends Scheme {
  
  get scheme() {
    return "wikipedia"
  }

  resolve() {
    return true
  }  
  
  async GET(options) {

    var result
    try {
      var m = this.url.toString().match(/^wikipedia:\/?\/?([a-z]*)\/?(.*)/,"") 
      var lang = m[1] || "en"
      var term = m[2] || ""
      result = await lively.openComponentInWindow("lively-iframe")
      lively.setExtent(result.parentElement, lively.pt(800, 600))
      result.parentElement.setAttribute("title","Wikipedia: " + term)
      
      result.setURL(`https://${lang}.wikipedia.org/wiki/${term}`)
      result.hideMenubar()
    } catch(e) {
      return new Response("failed to open " + term, {status: 400})
    }
    return new ValueResponse(result, {status: 200});
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




export class LivelyEdit extends LivelyBrowse {
  
  get scheme() {
    return "edit"
  }

  async GET(options) {
    var openString = this.url.toString().replace(/^edit:\/\//,"") 
    var result
    try {
      
      result = await lively.openBrowser(lively4url + "/" + openString, true )
    } catch(e) {
      return new Response("failed to open " + openString, {status: 400})
    }
    
    return new ValueResponse(result, {status: 200});
    
  }

}

/*MD ## Cache Scheme

Explicit caching API of requests through the browser cache API on some 

The cache fill be cleared:

1. when PUT/DELETE through cache API
2. when PUT/DELETE through any other fetch request
3. when calling invalidate caches

### Open Issues:

- we should clear them on reload/boot any way.... #TODO 
- or be more clever an ask the server if they changed....? #TODO

<style>
  pre {
    margin: 10px;
    padding: 10px;
    background-color: lightgray  
  }
</style>


```javascript
fetch("cached:https://lively-kernel.org/lively4/lively4-dummy/foo.js").then(r => r.text())


fetch("cached:https://lively-kernel.org/lively4/lively4-dummy/foo.js", {
  method: "PUT",
  body: `
export function bar() {
  return 9
}`
}).then(r => r.text())


fetch("https://lively-kernel.org/lively4/lively4-dummy/foo.js", {
  method: "PUT",
  body: `
export function bar() {
  return 8
}`
}).then(r => r.text())
```

MD*/


/*MD # Cache

 - #TODO does not handle mime type!

MD*/
export class CachedRequest extends Scheme {
  
  get scheme() {
    return "cached"
  }

  resolve() {
    this.realURL = this.url.replace(new RegExp("^" + this.scheme + ":/?/?"),"") // #Hack
    return true
  }  
  
  get cacheURL() {
    return this.asCacheURL(this.realURL) 
  }
  
  asCacheURL(url) {
    return "https://" + url // Hack, to convice the CACHE API 
  }
  
  get promisedCache() {
    if (!this._promisedCache) {
      this._promisedCache = self.caches.open("PoidCachesScheme")
    }
    return this._promisedCache
  }
  
  async GET(options) {
    var cache = await this.promisedCache;
    var request = this.cacheURL  
    var result = await cache.match(request)
    if (!result) {
      result = await fetch(this.realURL)
      if (!result.ok) {
        console.error("Bad Response Status for: " + this.realURL)
      }
      cache.put(request, result.clone())
    }
    return result
  }

  async PUT(options) {
    var cache = await this.promisedCache;
    cache.delete(this.cacheURL)
    return fetch(this.realURL, options)
  }

  async DELETE(options) {
    var cache = await this.promisedCache;
    cache.delete(this.cacheURL)
    return fetch(this.realURL, options)
  }

  static async invalidateCache(url) {
    try {
      var me = new CachedRequest()
      var cache = await me.promisedCache;
      cache.delete(me.asCacheURL(url))      
    } catch(e) {
      console.log("CachePoindError: ", e)
    }
  }
  
  async OPTIONS(options) {
    return fetch(this.realURL, options)
  }
}


if (self.lively4fetchHandlers) {
  
  // get rid of old mes?
  self.lively4fetchHandlers = self.lively4fetchHandlers
    .filter(ea => !ea.isPolymorphicIdentifierCacheHandler)
  
  self.lively4fetchHandlers.push({
    isPolymorphicIdentifierCacheHandler: true,
    finsihed(url, options={}) {
      if (options.method == "PUT" || options.method == "DELETE") {
        CachedRequest.invalidateCache(url) 
      }
      
    }
  })  
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
      return new ValueResponse(element, {status: 200});
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
      return new ValueResponse(this.elements, {status: 200});
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

export class StringScheme extends Scheme {

  get scheme() { return "string"; }
  resolve() { return true; }

  GET(options) {
    const string = new URL(this.url).pathname;
    return new ValueResponse(string, {status: 200})      
  }

}

export class NumberScheme extends Scheme {

  get scheme() { return "number"; }
  resolve() { return true; }

  GET(options) {
    const content = new URL(this.url).pathname;
    return new ValueResponse(parseFloat(content), {status: 200})      
  }

}

export class DateScheme extends Scheme {

  get scheme() { return "date"; }
  resolve() { return true; }

  GET(options) {
    const content = new URL(this.url).pathname;
    return new ValueResponse(new Date(parseInt(content)), {status: 200})      
  }

}

export class BooleanScheme extends Scheme {

  get scheme() { return "bool"; }
  resolve() { return true; }

  GET(options) {
    const content = new URL(this.url).pathname;
    return new ValueResponse(content === 'true' ? true : false, {status: 200})
  }

}

export class Lively4URLScheme extends Scheme {
  
  get scheme() {
    return "lively4url";
  }

  resolve() {
    return true;
  }  
  
  _fetch(options) {
    const filePath = lively4url + "/" + new URL(this.url).pathname;
    lively.warn(filePath, options && options.method)
    return fetch(lively4url + "/" + new URL(this.url).pathname, options);
  }
  
  async GET(options) {
    return this._fetch(options);
  }

  PUT(options) {
    return this._fetch(options);
  }
    
  OPTIONS(options) {
    return this._fetch(options);
  }
}

export class GSScheme_Stub extends Scheme {
  
  get scheme() {
    return "gs";
  }

  resolve() {
    return true
  }

  static async delegatee() {
    if (this._delegatee) {
      return this._delegatee;
    } else {
      return this._delegateePromise = this._delegateePromise || new Promise(resolve => this._delegateeResolve = resolve);
    }
  }

  static delegateTo(Scheme) {
    this._delegatee = Scheme;
    this._delegateeResolve && this._delegateeResolve(this._delegatee);
  }

  async holdOff(methodName, ...args) {
    const NewScheme = await GSScheme_Stub.delegatee();
    this.migrateTo(NewScheme);
    return this[methodName](...args);
  }

  async GET(...args) { return this.holdOff('GET', ...args); }
  async PUT(...args) { return this.holdOff('PUT', ...args); }
  async OPTIONS(...args) { return this.holdOff('OPTIONS', ...args); }
  async POST(...args) { return this.holdOff('POST', ...args); }
  async DELETE(...args) { return this.holdOff('DELETE', ...args); }
}

import { loadJSON, saveJSON, hasItem} from 'src/client/utils/local-storage.js'

export class LocalStorageFileSystem {

  constructor(key) {
    this._key = key;
  }
  
  create(init = {}) {
    localStorage.setItem(this._key, JSON.stringify(init));
  }
  remove() {
    localStorage.removeItem(this._key);
  }
  
  exists() {
    return localStorage::hasItem(this._key)
  }
  get root() {
    return localStorage::loadJSON(this._key)
  }
  getFile(path) {
    let entry = this.root;
    const remainingPath = path.split('/')
    while (remainingPath.length > 0) {
      let currentPath = remainingPath.shift();
      entry = entry[currentPath];
      if (!entry) {
        throw new Error(`no file found at ${path}.`)
      }
    }
    return entry;
  }
}

export class LocalStorageFileSystemScheme extends Scheme {

  resolve() {
    this.fs = new LocalStorageFileSystem(this.lsfsKey)
    this.initFS();

    return true
  }  

  /*MD ## constants MD*/

  get scheme() {
    return "lsfs"
  }
  
  get lsfsKey() {
    return 'LocalStorageFileSystem';
  }
  
  /*MD ## root access MD*/
  get root() {
    const config = localStorage::loadJSON(this.lsfsKey);
    if (config) {
      return config;
    }
    return this.defaultConfig();
  }
  set root(fs) {
    this.initFS();

    return localStorage::saveJSON(this.lsfsKey, fs);
  }
  resetFS() {
    return localStorage.removeItem(this.lsfsKey);
  }
  withRoot(callback) {
    const root = this.root;
    callback(root);
    this.root = root;
  }

  testing() {
    'lsfs://foo.js'.fetchText();
  }
  initFS() {
    if (this.fs.exists()) {
      return;
    }

    this.fs.create({
      sub: {
        'bar.js': 'lively.notify("bar");'
      },
      'foo.js': 'lively.notify("foo");'
    });
  }

  get filePath() {
    const pathParts = this.url.split('/')
    2 .times(::pathParts.shift)
    return pathParts;
  }

  get path() {
    return this.url.replace(/^lsfs:\/\//gi, '');
  }

  GET(options) {
    if (!this.url.startsWith('lsfs://')) {
      this.fail(`invalid path given. paths start with "${this.lsfsKey}"`);
    }

    // this is a file
    if (!this.url.endsWith('/')) {
      try {
        const content = this.fs.getFile(this.path)
        return this.text(content)
      } catch (e) {
        return this.fail(`Error in GET ${this.url}: ${e.message}`)
      }
    }

    return this.fail(`getting folders not supported yet (${this.url})`);
  }

  async PUT(options, newfile) {
    if (!this.url.startsWith('lsfs://')) {
      this.fail(`invalid path given. paths start with "${this.lsfsKey}"`);
    }
    
    // this is a file
    if (!this.url.endsWith('/')) {
      const remainingPath = this.filePath
      const root = this.root;
      let entry = root;
//       while (remainingPath.length > 1) {
//         let currentPath = remainingPath.shift();
//         if (entry[currentPath]) {
          
//         } else {
          
//         }
//         entry = entry[currentPath];
//         if (!entry) {
//           return this.fail(`no file found at ${this.url}.`);
//         }
//       }

      root[remainingPath.last] = (options && options.body) ? options.body : '';
      this.root = root;
      return this.text('works!');
    }


    return this.fail(`getting folders not supported yet (${this.url})`);
  }
  
  fileToStat(element, withChildren) {
    return {
      name: element.name,
      parent: LivelyFile.fileToURI(element.parentElement),
      type: element.tagName == "LIVELY-FILE" ? "file" : "directory",
      contents: withChildren ? (Array.from(element.childNodes)
        .filter(ea => ea.name && ea.classList && ea.classList.contains("lively-content"))
        .map(ea => this.fileToStat(ea, false))) : undefined
    }
  }
  
  static fileToURI(file) {
    if (!file.parentElement) {
      return this.scheme + "://"
    }
    var url = this.fileToURI(file.parentElement) 
    if (file.name) {
      url += "/" + file.name
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
  
  MKCOL() {
    var element = this.element
    if (element) {
      return new Response(JSON.stringify(this.fileToStat(element, true)))
    }
    return new Response("We cannot do that", {status: 400})
  }
  
  fail(message) {
    return new Response(message, {status: 400});
  }
  response(content, contentType) {
    return new Response(content, {
      headers: {
        "content-type": contentType
      },
      status: 200
    });
  }
  json(json) {
    var content = JSON.stringify(json, undefined, 2);
    return this.response(content, "application/json");
  }
  text(text, contentType = "text") {
    return this.response(text, contentType);
  }

}

export default class PolymorphicIdentifier {
  
  get isPolymorphicIdentifierHandler() {
    return true;
  } 
  
  static get isPolymorphicIdentifierHandler() {
    return true;
  } 
  
  static load() {
    [
      LivelyFile, 
      ElementQuery, 
      ElementQueryAll, 
      InnerHTMLElementQuery, 
      LivelySearch,
      LivelyOpen,
      LivelyBrowse,
      LivelyWikipedia,
      LivelyEdit,
      CachedRequest,
      StringScheme,
      NumberScheme,
      DateScheme,
      BooleanScheme,
      Lively4URLScheme,
      GSScheme_Stub,
      LocalStorageFileSystemScheme,
    ].forEach(scheme => this.register(scheme));
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
    var m = url.match(/^([A-Za-z0-9]+):\/?\/?/) // 
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


if (self.lively4fetchHandlers) {
  
  // get rid of old mes?
  debugger
  debugger
  self.lively4fetchHandlers = self.lively4fetchHandlers
    .filter(ea => !ea.isPolymorphicIdentifierHandler)
  
  self.lively4fetchHandlers.push(PolymorphicIdentifier)  

}

// if (!window.originalFetch) window.originalFetch = window.fetch
// window.fetch = async function(request, options, ...rest) {
//   var handler = PolymorphicIdentifier.handle(request, options)
//   if (handler) return handler.result;
//   // #TODO: lazy loading of schemes should go here
//   return window.originalFetch.apply(window, [request, options, ...rest])
// }




if (!navigator.serviceWorker) {
  console.warn("POID... could not register message handler with no-existing service worker")
} else {
  lively.removeEventListener("poid", navigator.serviceWorker)
  lively.addEventListener("poid", navigator.serviceWorker, "message", async (evt) => {
    try {
      if(!evt.data.name || !evt.data.name.match('swx:pi:')) return; // not for me
        
      let m = evt.data.path.match(/^\/([a-zA-Z0-9]+)(?:\/(.*))?$/)
      if (!m) {
        debugger
        throw new Error("Requested path does not fit a scheme! path='" + evt.data.path +"'")        
      }
      let url= m[1] + "://" + m[2]    
      if (!evt.ports[0]) {
        console.log("poid.js got message... but could not answer")
        return 
      }
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
}


PolymorphicIdentifier.load()

// window.fetch  = window.originalFetch
// fetch("https://lively-kernel.org/lively4/lively4-jens/README.md")t




