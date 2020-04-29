/*
 * A COP Layer that adapts D3 and Lively Containers to display D3 examples inline
 *
 */

/* globals d3,ScopedD3,D3ScopedDocument */
import {proceed, layer}  from "src/client/ContextJS/src/contextjs.js"
import * as cop  from "src/client/ContextJS/src/contextjs.js"

layer(window, "ScopedD3").refineObject(d3, {
  select(name, ...rest) {
    // console.log("select " + name)
    if (ScopedD3.currentBody && name == "body")
      return proceed(ScopedD3.currentBody);
    return cop.withLayers([D3ScopedDocument], () => proceed(name, ...rest))
  },
  json(url, ...rest) {
    url = "" + url
    // console.log("json url: " + url)
    if (!url.match(/^((https?:\/\/)|\/)/)) {
      url =  ScopedD3.currentBaseURL + "/" + url
      // console.log("json adapt url: " + url)
    }
    return proceed(url, ...rest)
  },
  text(url, ...rest) {
    url = "" + url
    // console.log("text url: " + url)
    if (!url.match(/^((https?:\/\/)|\/)/)) {
      url =  ScopedD3.currentBaseURL + "/" + url
      // console.log("text adapt url: " + url)
    }
    return proceed(url, ...rest)
  }
}).refineObject(lively.components.prototypes['lively-container'], {
  clear() {
    this.getContentRoot().innerHTML = null;
    proceed()
  },
  appendScript(scriptElement) {
    if (scriptElement.src && scriptElement.src.match(/d3\.v3(\.min)?\.js/)) {
      // console.log("ignore D3")
      return
    }
    if (scriptElement.src && scriptElement.src.match(/cola(\.min)?\.js/)) {
      // console.log("ignore cola")
      return
    }
    return proceed(scriptElement)
  },
  setPath(...rest) {
    ScopedD3.currentBody = null
    return proceed(...rest)
  },
  appendHtml(content) {
    // console.log("append html " + this)
    if (content.match(/<script src=".*d3\.v3(.min)?\.js".*>/)) {
      ScopedD3.updateCurrentBodyAndURLFrom(this)
      // console.log("SCOPE D3: " +ScopedD3.currentBody)
    }
    return proceed(content)
  },
  getContentRoot() {
    // console.log("get content root")
    if (ScopedD3.currentBody)
      return ScopedD3.currentBody
    else
      return proceed()
  }
})

ScopedD3.updateCurrentBodyAndURLFrom = function (container) {
  ScopedD3.currentBody = container.getContentRoot();
  ScopedD3.currentBaseURL = (""+ container.getURL()).replace(/[^/]*$/,"")
}

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

layer(window, "PrettyPrint").refineObject([].__proto__, {
  toString() {
    return "[" + proceed() + "]"
  }
})
