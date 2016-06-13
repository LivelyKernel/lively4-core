import {proceed, create as layer}  from "src/external/ContextJS.js"
import * as cop  from "src/external/ContextJS.js"


/* A COP Layer that adapts D3 and Lively Containers to display D3 examples inline */

layer(window, "ScopedD3").refineObject(d3, {
  select(name, ...rest) {
    console.log("select " + name)
    if (ScopedD3.currentBody && name == "body") 
      return proceed(ScopedD3.currentBody);
    return cop.withLayers([D3ScopedDocument], () => proceed(name, ...rest))
  },
  json(url, ...rest) {
    url = "" + url
    console.log("json url: " + url)
    if (!url.match(/^((https?:\/\/)|\/)/)) {
      url =  ScopedD3.currentBaseURL + "/" + url
      console.log("json adapt url: " + url)
    }
    return proceed(url, ...rest)
  },
  text(url, ...rest) {
    url = "" + url
    console.log("text url: " + url)
    if (!url.match(/^((https?:\/\/)|\/)/)) {
      url =  ScopedD3.currentBaseURL + "/" + url
      console.log("text adapt url: " + url)
    }
    return proceed(url, ...rest)
  }
}).refineObject(lively.components.prototypes['lively-container'], {
  clear() {
    this.getSubmorph('#container-content').innerHTML = null;
    proceed()
  },
  appendScript(scriptElement) {
    if (scriptElement.src && scriptElement.src.match(/d3\.v3(\.min)?\.js/)) {
      console.log("ignore D3")
      return
    } 
    if (scriptElement.src && scriptElement.src.match(/cola(\.min)?\.js/)) {
      console.log("ignore cola")
      return
    } 
    return proceed(scriptElement)
  },
  setPath(...rest) {
    ScopedD3.currentBody = null
    return proceed(...rest)
  },
  appendHtml(content) {
    console.log("append html " + this)
    if (content.match(/<script src=".*d3\.v3(.min)?\.js".*>/)) {
      
      ScopedD3.currentBody = this.getSubmorph('#container-content');
      ScopedD3.currentBaseURL = (""+ this.getURL()).replace(/[^/]*$/,"") 
      console.log("SCOPE D3: " +ScopedD3.currentBody)
      
    } 
    var result = proceed(content)
  },
  getContentRoot() {
    console.log("get content root")
    if (ScopedD3.currentBody)
      return ScopedD3.currentBody
    else 
      return proceed()
  }
})
ScopedD3.beGlobal()

layer(window, "D3ScopedDocument").refineObject(document, {
  querySelector(s, ...rest) {
    // console.log("query selector " + s)
    if (ScopedD3.currentBody)
      return ScopedD3.currentBody.querySelector(s, ...rest)
    return proceed(s, ...rest)
  },
  querySelectorAll(s, ...rest) {
    // console.log("query selectorAll " + s)
    if (ScopedD3.currentBody)
      return ScopedD3.currentBody.querySelectorAll(s, ...rest)
    return proceed(s, ...rest)
  }
})
// D3ScopedDocument.beGlobal()

cop.create(window, "PrettyPrint").refineObject([].__proto__, {
  toString() {
    return "[" + proceed() + "]"
  }
})

// PrettyPrint.beNotGloba