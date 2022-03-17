import preferences from './preferences.js';
import focalStorage from 'src/external/focalStorage.js'
import {debounce} from "utils"
import scriptManager from  "src/client/script-manager.js";
import Connection from 'src/components/halo/Connection.js'
import moment from 'src/external/moment.js'
import ViewNav from 'src/client/viewnav.js'

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

  backupStep() {
    if (this.running && lively.persistence.current === this) {
      this.ensureLivelyContentBackups()
      setTimeout(() => this.backupStep(), 60 * 1000)
    } else {
      // stop silently
    }
    
  }
  
  
  // work around non static module global state
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
    this.disable() // #TODO this only works with one module... and breaks when we have many....
    this.current = new Persistence()
    this.current.start()
  }
  
  static disable() {
    if (this.current) {
      this.current.stop()
    }
  }
 
  start() {
    this.running = true
    this.ensureLivelyContentBackups();
    this.observeHTMLChanges()
    this.backupStep()
  }
 
  ensureLivelyContentBackups() {
    var list = Persistence.backupIntervals().reverse()
    for(let i in list) {
      var ea = list[i]
      var previous = list[i + 1]
      this.ensureLivelyContentBackup(undefined, ea, previous)      
    }
  }

  stop() {
    if (this.mutationObserver) this.mutationObserver.disconnect()
    this.running = false
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
    return this.loadLivelyContent(source, target)
  }
  
  async loadLivelyContent(source, target) {
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

  
  
  async ensureLivelyContentBackup(url=this.defaultURL(), interval="yesterday", previousInterval, force) {
    var key = this.urlToKey(url.toString())
    const datePrefix = `backup_${interval}_date_` 
    const sourcePrefix = `backup_${interval}_source_` 
    const dateFormat = "YYYY-MM-DD HH:mm:ss"
    
    var dateString = await focalStorage.getItem(datePrefix+ key)  
    var lastBackupDate = moment(dateString, dateFormat)
    if (Number.isNaN(0+lastBackupDate)) {
      lively.warn("[backup] Currupt date string", dateString)
      dateString = undefined // handle corrupt date string
    }
    
    var today = moment()  
    // lively.notify("minutes since "  + interval + " "  + today + " " + lastBackupDate + " " + this.minutesForBackupInterval(interval))
    if (force || !dateString ||  today.diff(lastBackupDate, "minutes") > this.minutesForBackupInterval(interval)) {
      var backupDate =  today.format(dateFormat)
      var previousBackupKey = key
      if (previousInterval) {
        previousBackupKey = `backup_${previousInterval}_source_` + key
        backupDate =  await focalStorage.getItem(`backup_${previousInterval}_date_` + key) 
        if (!moment(backupDate, dateFormat) ) {
          backupDate = moment().format(dateFormat) // handle corrupt date string
        }
        
      }
      var source = await focalStorage.getItem(previousBackupKey) // get current source ... @onsetsu or should we use current world?

      await focalStorage.setItem(datePrefix + key, backupDate)
      await focalStorage.setItem(sourcePrefix + key, source)
      lively.notify(`Ensured ${interval} backup! ` + backupDate)
    } else {
      // lively.notify(`Last ${interval} backup is not old enough`)
    }
  }

  async loadLivelyContentBackup(url=this.defaultURL(), interval="yesterday", target=this.defaultTarget()) {
    var key = this.urlToKey(url.toString())
    const sourcePrefix = `backup_${interval}_source_` 
    var source = await focalStorage.getItem(sourcePrefix + key)    
    if (source) {
      this.loadLivelyContent(source, target)
      lively.notify(`load ${interval} backup!`)
    } else {
      lively.notify(`could not load ${interval} backup!`)
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
  
  minutesForBackupInterval(interval) {
    // #TODO refactor... this duplication does not look nice
    if (interval === "lastminute") {
      return 1
    }
    if (interval === "someminutes") {
      return 2
    }
    if (interval === "yesterday") {
      return 1 * 24 * 60
    }
    if (interval === "hour") {
      return  1 * 60
    }
    if (interval === "twohours") {
      return  2 * 60
    }
    if (interval === "week") {
      return  7 * 24 * 60
    }
    if (interval === "month") {
      return  31 * 7 * 24 * 60
    }
    throw new Error(interval + " not supported")
  }
   
  static backupIntervals() {
    return ["lastminute", "someminutes", "hour", "twohours", "yesterday", "week", "month"]
  }
  
  static restoreBackupContextMenuItems() {
    var result = []
    for(let ea of this.backupIntervals()) {
      result.push(this.restoreBackupContextMenuItem(ea))
    }
    return result
  }
  
  static restoreBackupContextMenuItem(interval) {
    let time = <span></span>
    let key = `backup_${interval}_date_` + this.current.urlToKey(this.current.defaultURL())
    focalStorage.getItem(key).then(s => {
      time.innerHTML = "" + s
    })
    var label = <span style="">{time} {interval}</span>

                         
    return [label, async (evt) => {
          // #TODO refactor into component so that behavior is persistent
          var target = <div id="contentRoot"></div>
          var scrollPane = <div style="background-color: gray; position:relative; width:100%; height:100%; overflow:scroll">{target}</div>

          ViewNav.enable(target)
          var ui = <div>{scrollPane}
                <div style="position:absolute; top:0px; left:0px">
                <button click={() => {

                      var contents = Array.from(target.childNodes)
                      document.body.innerHTML = ""
                      for(let ea of contents) {
                        document.body.appendChild(ea)
                      }

                      lively.notify("would restore " + contents.length + " elements" )

                  }}>restore</button>
                </div></div>
          var win = await (<lively-window title={"Restore " + interval}>{ui}</lively-window>)
          document.body.appendChild(win)
          lively.setGlobalPosition(win, lively.getPosition(evt))
          lively.persistence.current.loadLivelyContentBackup(undefined, interval, target)
        }
      ]
  }
  
}


if (self.lively) {
  if (lively.persistence) lively.persistence.disable()
  lively.persistence = Persistence
  Persistence.enable()
}

