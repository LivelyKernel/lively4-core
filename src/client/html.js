import Preferences from "src/client/preferences.js"
import _ from 'src/external/lodash/lodash.js'
import Rasterize from "src/client/rasterize.js"
import {pt} from 'src/client/graphics.js'
import Strings from 'src/client/strings.js'

/*
 * Kitchensink for all HTML manipulation utilities
 */

class KeyboardHandler {
  
  // Generic Keyboad handler to get rid of the magic keycode numbers 
  static getDispatchHandler(key) {
    return ({
      "9": "onTab",
      "13": "onEnter",
      "27": "onEsc",
      "32": "onSpace",
      "37": "onLeft",
      "38": "onUp",
      "39": "onRight",
      "40": "onDown",
    })[key]
  }
  
  static dispatchKey(evt, object, upOrDown, stopAndPreventDefault) {
    var handler = this.getDispatchHandler(evt.keyCode)
    if (handler) {
      handler += upOrDown
      if (object[handler]) {
        object[handler](evt)
        if (stopAndPreventDefault) {
          evt.preventDefault();
          evt.stopPropagation();
        }
      }
    }
    var keyUpOrDown = "onKey" + upOrDown
    if (object[keyUpOrDown]) {
        var key = String.fromCharCode(evt.keyCode)
        object[keyUpOrDown](evt, key)
        if (stopAndPreventDefault) {
          evt.preventDefault();
          evt.stopPropagation();
        }
    }
  }
}

/*MD 
  see also <edit://src/client/morphic/dragbehavior.js>
MD*/
export class Panning {
  
    constructor(pane) {
      this.pane = pane
     // always drag with ctrl pressed
      pane.addEventListener("pointerdown", evt => {
        if (evt.ctrlKey) {
          this.onPanningDown(evt)          
        }
      }, true)
  
      
      // but if nothing else... normal drag will do
      pane.addEventListener("pointerdown", evt => {
        var element = _.first(evt.composedPath())
        // lively.notify("element " + element.localName)
        if (element.localName == "polygon") {
          this.onPanningDown(evt)
        }
      })      
    }

    onPanningMove(evt) {
      var pos = lively.getPosition(evt)
      var delta = pos.subPt(this.lastMove)
      this.pane.scrollTop -= delta.y
      this.pane.scrollLeft -= delta.x
      this.lastMove = pos
    }
      
    onPanningDown(evt) {
      this.lastMove = lively.getPosition(evt)
      lively.addEventListener("panning", document.body.parentElement, "pointermove", 
        evt => this.onPanningMove(evt))
      lively.addEventListener("panning", document.body.parentElement, "pointerup", 
        evt => { lively.removeEventListener("panning", document.body.parentElement)
      })
      evt.stopPropagation()
      evt.preventDefault()
    }
}


export default class HTML {

  static findAllNodes(visit, all) {
    if (!all) { all = new Set() }
    if (!visit) { visit = document.querySelectorAll('*') }
    for (var ea of visit) {
    all.add(ea);
    if (ea.shadowRoot) {
      var subobjects = ea.shadowRoot.querySelectorAll('*');
      this.findAllNodes(subobjects, all);
    }
    }
    return Array.from(all);
  }
  
  static getFilter(ea) {
    return !['SCRIPT', 'LIVELY-PREFERENCES', 'LIVELY-HALOS'].includes(ea.tagName);
  }
  
  static getHtmlContent(body) {
    return _.filter(body.childNodes, this.getFilter).map( 
      (ea) => ea.outerHTML).join("\n");
  }
  
  static clearHtmlContent(body) {
    return _.filter(body.childNodes, this.getFilter).each( (ea) => body.removeChild(ea)).join("\n")
  }
  
  static parseHTML(html) {
    var tmpRoot = document.createElement("div")
    tmpRoot.innerHTML = html
    return Array.from(tmpRoot.childNodes)
  }
  
  static setHtmlContent(body, html) {
    
    
    var nodes = this.parseHTML(html)
    _.each(nodes, (ea) => {
      body.appendChild(html)
    })
  }
  
  static registerButtons(parent) {
    // Just an experiment for having to write less code.... which ended up in having more code here ;-) #Jens
    Array.prototype.forEach.call(parent.shadowRoot.querySelectorAll("button"), node => {
      var name = node.id
      var funcName = name.replace(/^./, c => "on"+ c.toUpperCase())
      // console.log("register button " + name)
      node.addEventListener("click", () => {
        var func = parent[funcName]
        if (func) {
          func.call(parent)
        } else {
          alert("No callback: " +  funcName)
        }
      })
    })
  }
  
  static registerKeys(obj, domain, target, stopAndPreventDefault) {
    domain = domain || "Keys"
    target = target || obj
    
    // enable keyboard events
    if (obj && obj.getAttribute) {
      if (obj.getAttribute("tabindex") === null) {
        obj.setAttribute("tabindex", 0)
      }
    }
    lively.addEventListener(domain, obj, "keydown", evt => {
      KeyboardHandler.dispatchKey(evt, target, "Down", stopAndPreventDefault)
    })
    lively.addEventListener(domain, obj, "keyup", evt => {
      KeyboardHandler.dispatchKey(evt, target, "Up", stopAndPreventDefault)
    })
  }
  
  
  static registerDrag(obj, domain, target) {
    target.draggable=true; 
    lively.removeEventListener(domain, target);
    lively.addEventListener(domain, target, "dragstart", 
      evt => obj.onDragStart && obj.onDragStart(evt));
    lively.addEventListener(domain, target, "drag", 
      evt => obj.onDrag && obj.onDrag(evt));
    lively.addEventListener(domain, target, "dragend", 
      evt => obj.onDragEnd && obj.onDragEnd(evt));
  }
       
  
  static registerInputs(parent) {
    Array.prototype.forEach.call(parent.shadowRoot.querySelectorAll("input"), node => {
      var name = node.id
      var funcName = name.replace(/^./, function (c) {
            return "on" + c.toUpperCase() ;
          }) + "Changed";
        // console.log("register input " + name)
        node.addEventListener("input", function(evt) {
          var value = node.value
          var func = parent[funcName];
          if (func) {
            func.call(parent, value);
          } else {
            // ignore it
            // alert("No callback: " + funcName);
          }
        });
      })
  }

  static fixLinks(nodes, dir, followPath) {
    // console.log("fix links " + dir)
    if (! followPath) {
      throw new Error("argument followPath missing");
    }
    if (! nodes) return;
    
    Array.prototype.forEach.call(nodes, node => {
      if (node.getAttribute) {
        
        var href = node.getAttribute("href")
        if (href) {
          // console.log("FIX LINK ", href)
          // #TODO load inplace....
          var path;
          var anchor;
          var m
          if (m = href.match(/javascript:visitPath\('webwerkstatt\/(.*)'\)/)) {
            path = "/Thesis/" + m[1]
          } else if (m = href.match(/javascript:(.*)'\)/)) {
            var code = m[1]
            // do nothing            
          } else if (href.match(/([A-Za-z]+):\/\/.*/)) {
            // console.log("ignore "  + href);
            path = href;
          } else if (href.match(/^\//)) {
            path = href; // ABSOLTUE paths
          } else if (href.match(/^#/)) {
            // Anchor links
            path = null
            anchor = href
          } else {
            path = dir + href // that leaves us RELATIVE paths
            if(!path.match(/((\.[A-Za-z0-9]+)|(\/))$/) && !path.match(/\?/)) {
              // no ending?
              // we could check, or assume md for the moment
              path += ".md"
              console.log("assume Markdown for "+ path)
            }
          } 
          if (path) {
            // console.log("fix "  + href + " to " + path + "(dir " + dir + ")")
            if (node.tagName == "LINK") {
              // console.log("update LINK", path)
              node.setAttribute("data-href", href) // so we keep the original somewhere..
              node.setAttribute("href", path)
            }            
            lively.addEventListener("lively", node, "click", (evt) => { 
              evt.preventDefault()
              evt.stopPropagation()
              followPath(path); 
              return false; 
            });
          } else if (anchor) {
            lively.addEventListener("lively", node, "click", (evt) => { 
              debugger
              evt.preventDefault()
              evt.stopPropagation()
              followPath(anchor); 
              return false; 
            });
          } else {
            // console.log("ignore " + href)
          }
        } else if (node.getAttribute('src')) {
          // image tag
          let src = node.getAttribute('src'),
              // TODO: remove duplicate
              swAwareBasePath = '', //https://lively4/
              path;
          // TODO: remove duplucated logic
          if (src.match(/([A-Za-z]+):\/\/.+/)) {
            // ignore FULL URLS
            // console.log("ignore "  + src);
          } else if (src.match(/^data:.+/)) {
            // ignore data urls
          } else if (src.match(/^\//)) {
            path = src; // ABSOLTUE paths
          } else {
            console.log("FIX SRC ", node.localName,  swAwareBasePath +  dir, "src:" + src)
            path = swAwareBasePath + dir + src // that leaves us RELATIVE paths
          }
          if (path) {
            node.setAttribute('src', path);
          } else {
            // console.log("ignore image " + href)
          }
        }
        this.fixLinks(node.childNodes, dir, followPath)
      }
    })
  }
  
  static saveCurrentPageAs() {
    var prev = lively.preferences.getURLParameter("page")
    if (!prev) prev = ""
    var url = window.prompt("Save page as?", prev)
    this.savePageAs(url)
  }

  static saveCurrentPage() {
    var url = lively.preferences.getURLParameter("page");
    if (!url) {
      lively.confirm("Could not save this page...")
    } else {
      this.savePageAs(url)
    }
  }
  
  static savePageAs(url) {
    var source  = document.body.innerHTML // #TODO here we must put more work...
    lively.files.saveFile(url, source).then( () => {
      lively.notify("Saved " + url)
    })
  }

  static getGlobalSource(worldContext) {
    worldContext= worldContext || document.body;
    Preferences.write("bodyPosition", JSON.stringify(lively.getPosition(document.body)))
    Preferences.write("bodyScroll", JSON.stringify({
      x: document.scrollingElement.scrollLeft,
      y: document.scrollingElement.scrollTop
    }));
    
    var source = ""
    var oldActiveElement = lively.activeElement()
    worldContext.querySelectorAll("*").forEach( ea => {
      try {
        if (ea.livelyPrepareSave) ea.livelyPrepareSave();
      } catch(e) {
        console.warn("Error during prepare save", e);
      }
    });
    lively.focusWithoutScroll(oldActiveElement)

    Array.from(worldContext.querySelectorAll(":scope > lively-window, :scope > .lively-content")).filter(ea => {
      return !this.hasDoNotPersistTag(ea)
    }).forEach( ea => {
      source += ea.outerHTML + "\n"
    });
    return source
  }
  
  static hasDoNotPersistTag(node, checkForChildrenValueToo = false) {
    return node.attributes
        && node.attributes.hasOwnProperty('data-lively4-donotpersist')
        && (checkForChildrenValueToo ?
            node.dataset.lively4Donotpersist == 'children' || node.dataset.lively4Donotpersist == 'all' :
            node.dataset.lively4Donotpersist == 'all');
  }
  
  static async loadHTMLFromURL(url, zoom=1) {
    var html = await fetch(url).then(r => {
      if (r.status != 200) {
        throw new Error("Could not load HTML from " + url + " due to status " + r.status)
      }
      return r.text()
    })
    var tmp = await lively.create("div")
    tmp.style.transform = `scale(${zoom})`
    lively.setGlobalPosition(tmp, pt(0,0))
    try {
      lively.clipboard.pasteHTMLDataInto(html, tmp)
    } finally {
      tmp.remove()
    }
    return tmp
  }
  
  static async saveAsPNG(url) {
    if (url.match(/\.html$/)) {
      var saveAsURL = url.replace(/html$/, "png")
      var zoom = 2
      var element = await this.loadHTMLFromURL(url, zoom)
      document.body.appendChild(element)
      // await lively.sleep(100)
      try {
        await Rasterize.elementToURL(element, saveAsURL, zoom)      
      } finally {
        element.remove()
      }
    }
    return saveAsURL
  }

 static async registerAttributeObservers(obj) {
    obj._attrObserver && obj._attrObserver.disconnect(); 

    obj._attrObserver = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {  
        if(mutation.type == "attributes") { 
          // console.log('mutation ' + mutation.attributeName )
          var methodName = "on" + Strings.toUpperCaseFirst(mutation.attributeName) + "Changed"
          if (obj[methodName]) {
            // console.log("found " + methodName)
            obj[methodName](
              mutation.target.getAttribute(mutation.attributeName),
              mutation.oldValue)
          } else {
             console.log("[AttributeObservers] NOT found: " + methodName, obj)
          }
        }
      });
    });
    obj._attrObserver.observe(obj, { attributes: true });  
  }

  // ## Example workspace
  /*
      import html from "src/client/html.js"
      lively.html.registerContextStyleObserver(document.body)

      lively.html.registerContextStyleObserver(document.body).then(o => {
        o.disconnect()
      })
  */
  
  static removeContextStyleChangeListener(obj, cb) {
    if (!obj || ! cb) {
      throw new Error("parameter missing")
    }
    var map = this.getContextStyleCallbackMap()
    var array = map.get(obj)
    if (array) {
      array = []
       map.set(obj, array.filter(ea => ea !== cb))
    }
  }
  
  static addContextStyleChangeListener(obj, cb) {
    if (!obj || ! cb) {
      throw new Error("parameter missing")
    }
    var map = this.getContextStyleCallbackMap()
    var array = map.get(obj)
    if (!array) {
      array = []
       map.set(obj, array)
    }
    array.push(cb)
  }
  
  
  static getContextStyleCallbackMap() {
    if (!this.contextStyleCallbackMap) {
      this.contextStyleCallbackMap = new WeakMap()
    }
    return  this.contextStyleCallbackMap
  }
  
  
  static async disconnectContextStyleObserver(obj, domain="") {
    var observer = obj["_contextStyleObserver" + domain] 
    if (observer) {
      observer.disconnect(); 
    }
  }
  
  
  static async registerContextStyleObserver(obj, domain="") {
    this.disconnectContextStyleObserver(obj, domain);

    
    var map = this.getContextStyleCallbackMap()
    
    var observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {  
        if(mutation.type == "attributes" 
            && mutation.attributeName == "style"
            && mutation.target !== document.body) {
          
        
          
          var changeEvent = new CustomEvent("context-style-changed", {
            bubbles: false,
            target: mutation.target
          })
          if (mutation.target.isMetaNode) return;
          mutation.target.dispatchEvent(changeEvent)  
          lively.allElements(true, mutation.target).forEach(ea => {
            if (ea.isMetaNode) return;
            var cbArray = map.get(ea) 
            if (cbArray) {
              cbArray.forEach(eaCB => {
                eaCB(changeEvent)
              })
            }
          
         })      
        }
      });
    })
    obj["_contextStyleObserver" + domain] = observer 
    observer.observe(obj, { 
      subtree: true,
      attributes: true,
      attributeFilter: ["style"]
    });
    return observer 
  }
  
  
  
  // #TODO refactor magic numbers to style? maybe lively.css?
  static addDeepMousePressed(element, listFunc, cb) {
    if (!listFunc) {
      throw new Error("listFunc argument is missing")
    }
    var deepListId = "deep-list"
    function clearList() {
      var oldList = element.querySelector("#" + deepListId)
      if (oldList) oldList.remove()
    }
    lively.addEventListener("HTMLDeepPress", element, "mousedown", async (evt) => {
      clearList()
      element._deepPressedLastMouseUp = null
      element.cancelOnBack = null
      await lively.sleep(1000)
      if (!element._deepPressedLastMouseUp) {
        element.cancelOnBack = true
        var list = <div id={deepListId} style="font-size:12pt"><ul>{... 
          listFunc().map(ea => {
            var item = <li>{ea}</li>
            item.addEventListener("mouseenter", () => item.style.backgroundColor = "lightgray")
            item.addEventListener("mouseleave", () => item.style.backgroundColor = "")
            item.addEventListener("mouseup", (evt) => {
              evt.stopPropagation()
              evt.preventDefault()
              list.remove()
              cb && cb(evt, ea)
            })
            return item
          })
        }</ul></div>
        list.style.position = 'absolute';
        element.appendChild(list)
        lively.setGlobalPosition(list, lively.getGlobalPosition(list).addPt(pt(0,25)))
        list.style.textAlign = "left"
        list.style.zIndex = 1000
        list.style.backgroundColor = "white"
        list.style.opacity = 0.8
        list.style.minWidth = "200px"
      }
    })
      
    lively.addEventListener("HTMLDeepPress", element, "mouseup", evt => {
      element._deepPressedLastMouseUp = Date.now()
      // I don't know were to ged rid of it when not here_
      clearList()
    });
  }
  
  // #TODO refactor magic numbers to style? maybe lively.css?
  static addChooseList(element, listFunc, cb) {
    if (!listFunc) {
      throw new Error("listFunc argument is missing")
    }
    var deepListId = "choose-list"
    function clearList() {
      var oldList = element.querySelector("#" + deepListId)
      if (oldList) {
        oldList.remove()
        return true
      }
      return false
    }
    lively.addEventListener("ChooseList", element, "click", async (evt) => {
      if (clearList()) return; // click closed old...
      var list = <div id={deepListId} style="font-size:12pt"><ul>{... 
          listFunc().map(ea => {
            // we accept a list of objects or HTMLElements
            var item;
            if (ea instanceof HTMLElement) {
              item = ea;
            } else {
              item = <li>{ea.toString()}</li>;
              if (ea.style) { item.style = ea.style; }
            }

              item.addEventListener("mouseenter", () => item.style.backgroundColor = "lightgray")
            item.addEventListener("mouseleave", () => item.style.backgroundColor = "")
            item.addEventListener("mouseup", (evt) => {
              evt.stopPropagation()
              evt.preventDefault()
              list.remove()
              cb && cb(evt, ea)
            })

            return item
          })
        }</ul></div>
        list.style.position = 'absolute';
        element.appendChild(list)
        lively.setGlobalPosition(list, lively.getGlobalPosition(list).addPt(pt(0,lively.getExtent(element).y)))
        list.style.textAlign = "left"
        list.style.zIndex = 1000
        list.style.backgroundColor = "white"
        list.style.opacity = 0.8
        list.style.minWidth = "300px"
      
    })
  }
  
  
  static findHeaders(roots) {
    var headers = []
    roots.forEach(eaRoot => {
      if (eaRoot.localName && eaRoot.localName.match(/^h[1-3]$/)) {
        headers.push(eaRoot)
      }
      if (eaRoot.querySelectorAll) {
        eaRoot.querySelectorAll("h1,h2,h3").forEach(ea => headers.push(ea))
      }
    })
    return headers
  } 
  
  static allQuerySelectorAll(roots,query) {
    var result = []
    roots.forEach(eaRoot => {
      // if (eaRoot.localName && eaRoot.localName.match(/^h[1-3]$/)) {
      //   result.push(eaRoot)
      // }
      if (eaRoot.querySelectorAll) {
        result.push(...eaRoot.querySelectorAll(query))
      }
    })
    return result
  } 
  
  static numberHeadings(root, customCount=0) {
    var roots = []
    var parents = []
    var children = new WeakMap()
    var numbers = new WeakMap()
    var contents = root.querySelectorAll("h1,h2,h3,h4")
    
    function level(h) {
      return parseInt(h.localName.replace(/h/,""))
    }
    
    function numberChildren(node, array=[]) {
      numbers.set(node, array)
      var counter=1
      if (!children.get(node)) return
      for(var ea of children.get(node)) {
        if (customCount && (ea === roots.first)) {
          counter = customCount // start with custom counter
        }
        numberChildren(ea, array.concat([counter++]))
      }
    }

    for(let ea of contents) {

        var parent = parents.pop()
        while (parent && level(parent) >= level(ea)) {
          parent = parents.pop()
        }
        if (parent) {
          parents.push(parent)

          if (!children.get(parent)) children.set(parent, [])
          children.get(parent).push(ea)
        } else {
          roots.push(ea)
        }
        parents.push(ea)
      }
    debugger
    children.set(this, roots)
    numberChildren(this, [])

    for(let ea of contents) {
      ea.innerHTML = numbers.get(ea).join(".") + " " + ea.innerHTML
    }
  }
  
  static async highlightBeforeAndAfterPromise(element, promise) {
    return new Promise(async resolve => {
      var animation = element.animate([
         { outline: "2px solid transparent",  }, 
         { outline: "2px solid blue",   }], 
        {
          duration: 500
        });
      animation.onfinish = () => element.style.outline = "2px solid blue"

      
      await promise
      animation.finish()
      animation = element.animate([
         { outline: "2px solid blue",  }, 
         { outline: "2px solid green",   }, 
         { opacity: 1, }, 
         { opacity: 0, }], 
        {
          duration: 1000
        });  
      animation.onfinish = () => resolve()
    })
  } 
  
}

// #LiveProgramming #Hack #CircularDependency #TODO
if (window.lively) {
  window.lively.html = HTML
}


