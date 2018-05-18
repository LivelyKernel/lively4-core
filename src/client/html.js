import Preferences from "src/client/preferences.js"
import _ from 'src/external/underscore.js'
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
      "37": "onLeft",
      "38": "onUp",
      "39": "onRight",
      "40": "onDown",
      "13": "onEnter",
      "27": "onEsc",
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
  
  static setHtmlContent(body, html) {
    var nodes = $.parseHTML(html)
    _.each(nodes, (ea) => {
      body.appendChild(html)
    })
  }
  
  static registerButtons(parent) {
    // Just an experiment for having to write lesser code.... which ended up in having more code here ;-) #Jens
    Array.prototype.forEach.call(parent.shadowRoot.querySelectorAll("button"), node => {
      var name = node.id
      var funcName = name.replace(/^./, c => "on"+ c.toUpperCase())
      // console.log("register button " + name)
      $(node).click(() => {
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
    if (! followPath) {
      throw new Error("argument followPath missing");
    }
    if (! nodes) return;
    
    Array.prototype.forEach.call(nodes, node => {
      if (node.getAttribute) {
        var href = node.getAttribute("href")
        if (href) {
          // #TODO load inplace....
          var path;
          var m
          if (m = href.match(/javascript:visitPath\('webwerkstatt\/(.*)'\)/)) {
            path = "/Thesis/" + m[1]
          } else if (m = href.match(/javascript:(.*)'\)/)) {
            var code = m[1]
            // do nothing
            
            // $(node).click(() => { 
            //   alert("eval " + code)
            // })
          } else if (href.match(/([A-Za-z]+):\/\/.*/)) {
            // console.log("ignore "  + href);
            path = href;
          } else if (href.match(/^\//)) {
            path = href; // ABSOLTUE paths
          } else {
            path = dir + href // that leaves us RELATIVE paths
            
            if(!path.match(/((\.[A-Za-z]+)|(\/))$/)) {
              // no ending?
              // we could check, or assume md for the moment
              path += ".md"
              console.log("assume Markdown for "+ path)
            }
          } 
          if (path) {
            // console.log("fix "  + href + " to " + path + "(dir " + dir + ")")
            $(node).click(() => { 
              // if (path.match(/https:\/\/lively4\/notes/)) {
              //     if (window.confirm("follow path? " + path)) {
              //       followPath(path); return false;
              //     }
              //     return false
              // }
              followPath(path); return false; });

            // ALTERNATIVE to navigate it inline, but the link will not be followed....
            // var link = lively4url + "/draft/start.html?load=" + path
            // node.setAttribute("href", link)
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
    obj._attrObserver = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {  
        if(mutation.type == "attributes") { 
          console.log('mutation ' + mutation.attributeName )
          var methodName = "on" + Strings.toUpperCaseFirst(mutation.attributeName) + "Changed"
          if (obj[methodName]) {
            console.log("found " + methodName)
            obj[methodName](
              mutation.target.getAttribute(mutation.attributeName),
              mutation.oldValue)
          } else {
             console.log("NOT found: " + methodName)
          }
        }
      });
    });
    obj._attrObserver.observe(obj, { attributes: true });  
  }
  
}

