import preferences from './preferences.js';
import focalStorage from 'src/external/focalStorage.js'
import {debounce} from "utils"
import scriptManager from  "src/client/script-manager.js";
import Connection from 'src/components/halo/Connection.js'

export function isCurrentlyCloning() {
    return sessionStorage["lively.persistenceCurrentlyCloning"] === 'true';
}


export default class Persistence {
  
  constructor() {
    this.saveDelay = (() => {
        this.saveLivelyContent();
        this.showMutationIndicator().style.backgroundColor = "rgba(10,10,10,0.3)"
    })::debounce(3000) // save the world 3seconds after a change
  }

  // work around non stavle module global state
  static get current() {
    if (!window.lively4persistence) {
      window.lively4persistence = new Persistence()
    }
    return window.lively4persistence
  }
  static set current(obj) {
    window.lively4persistence = obj
  }

  static enable() {
    this.disable()
    this.current = new Persistence()
    this.current.start()
  }
  
  static disable() {
    if (this.current) {
      this.current.stop()
    }
  }
  
  start() {
    this.observeHTMLChanges()
  }
  
  stop() {
    if (this.mutationObserver) this.mutationObserver.disconnect()
  }
  
  urlToKey(urlString) {
    urlString = "" + urlString
    return "livelyWindows_"+urlString.replace(/^https?:\/\//,"").replace(/[^A-Za-z0-9]/,"_")
  }

  defaultTarget() {
    return document.body
  }

  defaultURL() {
    return (document.location.protocol + "//" + document.location.hostname + document.location.pathname) 
  }

  async getLivelyContentForURL(url) {
    url = url || this.defaultURL()   
    var content = await focalStorage.getItem(this.urlToKey(url.toString()))
    if (!content) {
      try {
        var elementSource = await lively.files.loadFile(lively4url + "/src/parts/initial-content.html")
        content = lively.html.parseHTML(elementSource)[0].innerHTML
      } catch(e) {
        lively.error("Could not load default desktop conent for lively", e)
      }
    }
    return content
  }
  
  
  setLivelyContentForURL(url, source) {
    url = url || this.defaultURL()   
    return focalStorage.setItem(this.urlToKey(url.toString()), source)
  }

  async loadLivelyContentForURL(url, target) {
    var source = await this.getLivelyContentForURL(url) 
    target = target || this.defaultTarget()
    var div = document.createElement("div")
    div.innerHTML = source
    var topLevel = Array.from(div.querySelectorAll(":scope > *"))
    var objs = Array.from(div.childNodes)
    
    // somehow zIndex gets lost...
    var zIndexMap = new Map()
    topLevel.forEach(ea => {
       zIndexMap.set(ea, ea.style.zIndex)
    })
    
    objs.map(ea => {
      if(ea.classList && ea.classList.contains('lively-preferences')) {
        target.querySelectorAll('div.lively-preferences').forEach(ele => ele.remove());
      }
      target.appendChild(ea);
    });
    await lively.components.loadUnresolved(target, true, "loadLivelyContentForURL", true)
    
    // restore zIndex in an Async way... it seems focus is responsible for it #Hack
    lively.sleep(0).then(() => {
      topLevel.forEach(ea => {
        ea.style.zIndex = zIndexMap.get(ea)
      })
    })
    
    objs.map(ea => { Persistence.initLivelyObject(ea)})
    return 
  }
  
  static initLivelyObject(obj) {
    if (!obj) return;
    try {
      scriptManager.findLively4Script(obj, false);
      if (obj.livelyLoad) obj.livelyLoad()
      Connection.deserializeFromObjectIfNeeded(obj)
      if (!obj.querySelectorAll) return;
      obj.querySelectorAll("*").forEach(ea => {
        if (ea.livelyLoad) ea.livelyLoad()
        Connection.deserializeFromObjectIfNeeded(ea)
      })       
    } catch(e) {
      lively.showError(e)
    }
  }

  async storeLivelyContentForURL(url, target) {
    target = target || this.defaultTarget()
    this.isPersisting = true
    var source = lively.html.getGlobalSource(target)
    this.setLivelyContentForURL(url, source)
    setTimeout(() => {
      this.isPersisting = false
    }, 0) // the mutation events triggered are still pending here...
    return source
  }
  
  async saveLivelyContent() {
    // console.log("[peristence] save after " + 
    //   (Date.now() - this.lastSaved) +"ms")
    this.lastSaved = Date.now()   
    await this.storeLivelyContentForURL()
    // console.log("[peristence] saved lively content into focalStorage " + 
    //   (Date.now() - this.lastSaved) +"ms")
  }
  
  
  hasDoNotPersistTag(node,) {
    var donotperist =  node.attributes && 
      node.attributes.hasOwnProperty('data-lively4-donotpersist');
    if (donotperist) return true
    if (!node.parentElement) return false
    return this.hasDoNotPersistTag(node.parentElement)
  }
  
  isBlacklisted(mutation) {
    if (mutation.target.tagName == "BODY") return true
    if (mutation.target.tagName == "LIVELY-MENU") return true
    if (mutation.target.tagName == "LIVELY-SELECTION") return true
    if (mutation.target.tagName == "LIVELY-HAND") return true
    if (mutation.target.tagName == "LIVELY-HALO") return true
    if (mutation.target.tagName == "LIVELY-NOTIFICATION-LIST") return true
    if (mutation.target.id == "mutationIndicator") return true
    if (mutation.target.getAttribute && mutation.target.getAttribute("data-is-meta")) return true
    if (this.hasDoNotPersistTag(mutation.target)) return true
    return false
  }
  
  showMutationIndicator() {
    var indicator = document.body.querySelector("#mutationIndicator")
    if (!indicator)  {
      var div = document.createElement("div")
      div.id = "mutationIndicator"
      document.body.appendChild(div)
      div.style.position = "fixed"
      div.style.right = "0px"
      div.style.top = "0px"
      div.style.width = "10px"
      div.style.height = "10px"
      div.style.backgroundColor = "blue"
      div.style.pointerEvents = "none"
      div.style.zIndex = 2000
      
      indicator = div
    }
    return indicator
  }
  
  
  onMutation(mutations, observer) {
    if (this.isPersisting) {
      // console.log("ignore mutation ", mutations)
      return // we mutate while persisting 
    }
    
    mutations.filter(ea => !this.isBlacklisted(ea)).forEach(record => {
      this.showMutationIndicator().style.backgroundColor = "rgba(200,0,0,0.5)"
      this.saveDelay()
    })  
  }
  
  observeHTMLChanges(target) {
    target = target || this.defaultTarget()
    if (this.mutationObserver) this.mutationObserver.disconnect()
    this.mutationObserver = new MutationObserver((mutations, observer) => {
        this.onMutation(mutations, observer)
    });
    this.mutationObserver.observe(target, {
      childList: true, 
      subtree: true, 
      characterData: true, 
      attributes: true});
  }
  
  
  
  
}
