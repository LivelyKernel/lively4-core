import preferences from './preferences.js';
import focalStorage from 'src/external/focalStorage.js'
import {debounce} from "utils"
import scriptManager from  "src/client/script-manager.js";

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

  getLivelyContentForURL(url) {
    url = url || this.defaultURL()   
    return focalStorage.getItem(this.urlToKey(url.toString()))
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
    var objs = Array.from(div.childNodes)
    objs.map(ea => {
      if(ea.classList && ea.classList.contains('lively-preferences')) {
        target.querySelectorAll('div.lively-preferences').forEach(ele => ele.remove());
      }
      target.appendChild(ea);
    });
    await lively.components.loadUnresolved(target)
    objs.map(ea => { Persistence.initLivelyObject(ea)})
    return 
  }
  
  static initLivelyObject(obj) {
    if (!obj) return;
    try {
      scriptManager.findLively4Script(obj, false);
      if (obj.livelyLoad) obj.livelyLoad()
      if (!obj.querySelectorAll) return;
      obj.querySelectorAll("*").forEach(ea => {
        if (ea.livelyLoad) ea.livelyLoad()
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
Persistence.disable()
Persistence.enable()

/*


var persistenceTimerInterval;
var persistenceTimerEnforceSaveInterval;
var persistenceEnabled = false;
var persistenceInterval = 5000;
var persistenceTarget = window.location.protocol + '//lively4/';

function hasDoNotPersistTag(node, checkForChildrenValueToo = false) {
    return node.attributes
        && node.attributes.hasOwnProperty('data-lively4-donotpersist')
        && (checkForChildrenValueToo ?
            node.dataset.lively4Donotpersist == 'children' || node.dataset.lively4Donotpersist == 'all' :
            node.dataset.lively4Donotpersist == 'all');
}

function hasParentTag(node) {
    return node.parentNode != null;
}

function hasNoDonotpersistFlagInherited(nodes, isParent = false) {
    let parents = new Set();
    for (let node of nodes) {
        if (!hasDoNotPersistTag(node, isParent) && hasParentTag(node)) {
            parents.add(node.parentNode);
        }
    }
    if (parents.size == 0) return false;
    if (parents.has(document)) return true;
    return hasNoDonotpersistFlagInherited(parents, true);
}

function checkRemovedNodes(nodes, orphans) {
    return !nodes.every(hasDoNotPersistTag) && !nodes.every(n => orphans.has(n))
}

function initialize(){
    return; // currently does not work in Chrome :(
    resetPersistenceSessionStore();
    loadPreferences();

    var orphans = new Set();

    window.addEventListener('unload', saveOnLeave);

    let observer = new MutationObserver((mutations, observer) => {
        mutations.forEach(record => {
            if (record.target.id == 'console'
                || record.target.id == 'editor') return;

            let shouldSave = true;
            if (record.type == 'childList') {
                let addedNodes = [...record.addedNodes],
                    removedNodes = [...record.removedNodes],
                    nodes = addedNodes.concat(removedNodes);

                //removed nodes never have a parent, so remeber orphans when they are created
                for (let node of addedNodes) {
              
                    if (hasParentTag(node) == false) {
                        orphans.add(node);
                    }
                }

                shouldSave = hasNoDonotpersistFlagInherited(addedNodes) || checkRemovedNodes(removedNodes, orphans);

                //remove removed orphan nodes from orphan set
                for (let node of removedNodes) {
                    if (orphans.has(node)) {
                        orphans.delete(node);
                    }
                }
            }
            else if (record.type == 'attributes'
                || record.type == 'characterData') {
                shouldSave = hasNoDonotpersistFlagInherited([record.target]);
            }

            if (shouldSave) {
                sessionStorage["lively.scriptMutationsDetected"] = 'true';
                restartPersistenceTimerInterval();
            }
        })
    });
    observer.observe(document, {childList: true, subtree: true, characterData: true, attributes: true});
}

function loadPreferences() {
    persistenceInterval = parseInt(preferences.read('persistenceInterval'));
    persistenceTarget = preferences.read('persistenceTarget');
    persistenceEnabled = preferences.read('persistenceEnabled') == 'true';
}

function saveOnLeave() {
    stopPersistenceTimerInterval(true);
    if (isPersistenceEnabled() && sessionStorage["lively.scriptMutationsDetected"] === 'true') {
        console.log("[persistence] window-closed mutations detected, saving DOM...")
        saveDOM(false);
    }
};

function getURL(){
    var baseurl = getPersistenceTarget();
    var filename;

    var url = document.URL;
    var r = /https:\/\/([\w-]+)\.github\.io\/([\w-]+)\/(.+)/i;
    var results = url.match(r);

    if (results)
    {
        filename = results[3];
    }
    else
    {
        r = /^(?:(https?):\/\/)?(?:(\w+)(?:\:(\w+))?\@)?([\w\.\-\~]+)+(?:\:(\d+))?(?:\/([\w\.\-\~\/\%]+))?(?:\?([\w\=\&]+))?(?:\#(\w+))?$/;
        results = url.match(r);
        if (results)
        {
            filename = results[6];
        } else {
            throw "Could not parse URL to persist changes!";
        }
    }

    return new URL(baseurl + filename)
}

export function startPersistenceTimerInterval() {
    persistenceTimerInterval = setInterval(checkForMutationsToSave, persistenceInterval);
    if (persistenceTimerEnforceSaveInterval == undefined)
        persistenceTimerEnforceSaveInterval = setInterval(checkForMutationsToSave, persistenceInterval * 10);
}

export function stopPersistenceTimerInterval(stopEnforceSave = false) {
    clearInterval(persistenceTimerInterval);
    persistenceTimerInterval = undefined;
    if (stopEnforceSave) {
        stopPersistenceTimerEnforceSaveInterval()
    }
}

export function stopPersistenceTimerEnforceSaveInterval() {
    clearInterval(persistenceTimerEnforceSaveInterval);
    persistenceTimerEnforceSaveInterval = undefined;
}

export function getPersistenceInterval() {
    return persistenceInterval;
}

export function setPersistenceInterval(interval) {
    if (interval == persistenceInterval) return;

    persistenceInterval = interval;
    preferences.write('persistenceInterval', interval);

    restartPersistenceTimerInterval();
}

function restartPersistenceTimerInterval() {
    stopPersistenceTimerInterval();
    startPersistenceTimerInterval();
}

function resetPersistenceSessionStore() {
    //sessionStorage["lively.scriptMutationsDetected"] = 'false';
    //sessionStorage["lively.persistenceCurrentlyCloning"] = 'false';
}

function checkForMutationsToSave() {
    if (isPersistenceEnabled() && sessionStorage["lively.scriptMutationsDetected"] === 'true') {
        console.log("[persistence] timer-based mutations detected, saving DOM...")
        saveDOM();
    }
}

export function isPersistenceEnabled() {
    return persistenceEnabled;
}

export function setPersistenceEnabled(enabled) {
    if (enabled == persistenceEnabled) return;

    persistenceEnabled = enabled;
    preferences.write('persistenceEnabled', enabled);
}

export function getPersistenceTarget() {
    return persistenceTarget;
}

export function setPersistenceTarget(target) {
    if (target == persistenceTarget) return;

    persistenceTarget = target;
    preferences.write('persistenceTarget', target);
}


export function saveDOM(async = true) {
    var world;
    sessionStorage["lively.persistenceCurrentlyCloning"] = 'true';
    try {
        world = $("html").clone();
    }
    finally {
        sessionStorage["lively.persistenceCurrentlyCloning"] = 'false';
    }

    world.find("[data-lively4-donotpersist='children']").empty();
    world.find("[data-lively4-donotpersist='all']").remove();
    world.find("#editor").empty();
    world.find("#console").empty();
    world.find("#ace_editor\\.css").remove();
    world.find("#ace-tm").remove();
    world.find("style").filter((i,e) => /\s*\.error_widget_wrapper+/.test(e.textContent)).remove();

    var content = "<!DOCTYPE html>\n" + world[0].outerHTML;

    resetPersistenceSessionStore();

    writeFile(content, async);
    stopPersistenceTimerEnforceSaveInterval();
}

function writeFile(content, async = true) {
    var url = getURL()
    console.log("[persistence] save " + url)
    $.ajax({
        url: url,
        type: 'PUT',
        async: async,
        data: content,
        success: text => {
            console.log("[persistence] file " + url + " written.")
        },
        error: (xhr, status, error) => {
            console.log("[persistence] could not write " + url + ": " + error)
        }
    });
}

initialize();

*/
