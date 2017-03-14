import * as preferences from './preferences.js';
import focalStorage from 'src/external/focalStorage.js'
import DelayedCall from 'src/client/delay.js'

export function isCurrentlyCloning() {
    return sessionStorage["lively.persistenceCurrentlyCloning"] === 'true';
}

export default class Persistence {
  
  constructor() {
    this.saveDelay = new DelayedCall()
    this.saveDelay.delay = 1000
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
    var source = await this.getLivelyContentForURL() 
    target = target || this.defaultTarget()
    var div = document.createElement("div")
    div.innerHTML = source
    lively.array(div.childNodes).forEach(ea => {
      target.appendChild(ea)
    })
  }
  
  async storeLivelyContentForURL(url, target) {
    target = target || this.defaultTarget()
    var source = lively.html.getGlobalSource(target)
    this.setLivelyContentForURL(url, source)
    return source
  }
  
  async saveLivelyContent() {
  
    var start = Date.now()   
    await this.storeLivelyContentForURL()
    console.log("[peristence] saved lively content into focalStorage " + (Date.now() - start) +"ms")
  }
  
  onMutation(mutations, observer) {
    if (this.isPersisting) return // we mutate while persisting 
    
    mutations.forEach(record => {
      // var indicator = this.get("#changeIndicator")
      // if (indicator ) {
      //   indicator.style.backgroundColor = "rgb(250,250,0)";
      // }
    })  
    this.saveDelay.call(() => {
      this.saveLivelyContent()
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
