"disable deepeval"
/*MD # Preferences

- Stores lively preferences localStorage, so it gets saved/loaded with other content
- Preferences are not page-specific any more, but apply to all lively instances on the site...
- #TODO is that fine, do we need page-specific preferences


MD*/

/* globals globalThis */

export default class Preferences {
  
  static get defaults() {
    return  {
      GridSize: {default: 100, short: "grid size"},
      SnapSize: {default: 20, short: "snap size"},
      SnapPaddingSize: {default: 20, short: "padding while snapping size"},
      SnapWindowsInGrid: {default: false, short: "snap windows in grid"},
      ShowFixedBrowser: {default: false, short: "show fixed browser"},
      InteractiveLayer: {default: false, short: "dev methods"},
      ShowDocumentGrid: {default: true, short: "show grid"},
      UseRP19JSX: {default: false, short: "use rp19 implementation for jsx"},
      DisableAExpWorkspace: {default: false, short: "disable AExp in workspace"}, 
      UseProxiesForAExprs: {default: false, short: "proxy-based Active Expressions"},
      EnableAEDebugging: {default: true, short: "enable Active Expression debugging"},
      SmartAELogging: {default: true, short: "Only log events for interesting Active Expressions"},
      DisableAltGrab: {default: false, short: "disable alt grab with hand"},
      UseAsyncWorkspace: {default: false, short: "support await in eval"},
      OfflineFirst: {default: false, short: "use offline first swx cache"},
      GraffleMode: {default: false, short: "create shapes by drag and hold S/C/F/D"},
      FileIndex: {default: false, short: "local file index"},
      SWXKeepAlive: {default: false, short: "keep SWX alive"},
      LogBoot: {default: false, short: "keep bootlog"},
      PiTerminalURL: {default: "http://localhost:3000/", short: "url of pi terminal"},
      PiTerminalCWD: {default: "", short: "current working directory of pi terminal"},
      PiTerminalSecret: {default: "", short: "pi terminal credentials"},
      ExtraSearchRoots: {default: [], short: "extra search roots"},
      TipOfTheDay: {default: false, short: "show tip of the day on startup"},
      WiderIndentation: {default: false, short: "sets the indentation to 4"},
      CommandModeAsDefault: {default: false, short: "command mode as default in editor"},
      CircumventCodeMirrorModes: {default: false, short: "circumvent code mirror modes"},
      BabylonianProgramming: {default: false, short: "use babylonian programming editor"},
      SandblocksText: {default: false, short: "use sandblocks text editor"},
      TabbedWindows: {default: false, short: "use experimental window tabs"},
      AltDragWindows: {default: false, short: "alt drag windows"},
      SWEDebugging: {default: false, short: "bug showcase in swe lecture"},
      AEXPGraphExperimental: {default: false, short: "AExpr graph experimental"},
      GSFullLogInfo: {default: false, short: "full log info for GS"},
      DisableSystemActivityTracing: {default: true, short: "disable system activity tracing"},
      StefansExperimentalPreference: {default: false, short: "Stefans experimental preference"},
      AIShadowText: {default: false, short: "complete w/ shadow text (key required)"},
      AILukasExperiment: {default: false, short: "AI Lukas Experiment"},
      DisableBabelCaching: {default: false, short: "Disable babel transpile caching"},
    }
  }
  
  static load() {
    console.info('Load preferences')
    Preferences.readPreferences()
  }
  
  static reset() {
    this.config = {}
  }
  
  // List all avaiable preferences
  static list () {
    return Object
      .keys(this.defaults)
  }

  static listBooleans () {
    return Object.keys(this.defaults)
      .filter(ea => _.isBoolean(this.defaults[ea].default))
  }

  
  static shortDescription(preferenceKey) {
    var pref = this.defaults[preferenceKey]
    if (pref && pref.short) 
      return pref.short
    else
      return preferenceKey
  }
  
  /* get preference, consider defaults */
  static get (preferenceKey) {
    if (!preferenceKey) {
      console.error('No preference key was specified')
      return
    }
    
    let pref = this.read(preferenceKey)
    if (typeof pref === 'string') {
      return JSON.parse(pref)
    }
    
    pref = this.defaults[preferenceKey]
    if (!pref) {
      console.error(`Preference "${preferenceKey}" does not exist`)
      return
    }
    
    if(pref.hasOwnProperty('default')) {
      return pref.default
    }
  }
  
  static set(preferenceKey, value) {
    var pref = this.write(preferenceKey, JSON.stringify(value))     
  }
  
  // #important only for migration 
  static loadOldPreferences() {
    if (!globalThis.document) {
      return 
    }
    
    let node = document.body.querySelector('.lively-preferences');
    
  
    if (!node) {
      console.warn("[preferencs] no old preferences found")
      return 
    }

    if (Preferences.get("oldPreferencesMigrated")) {
      console.log("[preferences] old preferences are migrated" )
      return 
    }
    
    for(let key of Object.keys(node.dataset)) {
      try {
        var value = JSON.parse(node.dataset[key])
        Preferences.set(key, value)
        lively.notify("restore " + key +" to " + value)        
      } catch(e) {
        console.warn("error restoring preference " + key, e)
      }
    } 
    Preferences.writePreferences() 
    Preferences.set("oldPreferencesMigrated", true)
  }
  
  
  
  
  static read(preferenceKey) {
    if (this.config) return this.config[preferenceKey]
  }
  
  get lively4preferencesKey() {
    return "lively4preferences"
  }
  
  static readPreferences() {   
    if (!globalThis.localStorage) {
      this.config = {}
      return
    }
    var str = globalThis.localStorage[this.lively4preferencesKey]
    try {
      this.config =  JSON.parse(str)
    } catch(e) {
      this.config = {}
    }
  }

  static writePreferences() {
    if (!globalThis.localStorage) {
      return
    }
    
    try {
      var str = JSON.stringify(this.config)
    } catch(e) {
      throw new Error("Could not serialize preferences ", str)
    }
    
    globalThis.localStorage[this.lively4preferencesKey] = str
  }

  
  static write(preferenceKey, preferenceValue) {
    this.config[preferenceKey] = preferenceValue
    this.writePreferences()
  }
  
  static enable(preferenceKey) {
    Preferences.write(preferenceKey, "true")
    this.applyPreference(preferenceKey)
  }

  static disable(preferenceKey) {
    Preferences.write(preferenceKey, "false")
    this.applyPreference(preferenceKey)
  }
  
  static applyPreference (preferenceKey) {
    if (!preferenceKey) {
      console.error('No preference key was specified')
      return
    }
    
    const msg = `on${preferenceKey}Preference`
    if (!lively[msg]) { 
      // console.warn(`[preference] No event handler registered for "${preferenceKey}"`)
      return
    }
    
    const config = this.get(preferenceKey)
    lively[msg](config)
  }
  
  static loadPreferences() {
    Object.keys(Preferences.defaults).forEach(preferenceKey => {
      this.applyPreference(preferenceKey)
    })
  }

  static getURLParameter(theParameter) {
    if (!window) {
      return false;
    }

    var params = window.location.search.substr(1).split('&');
  
    for (var i = 0; i < params.length; i++) {
      var p=params[i].split('=');
      if (p[0] == theParameter) {
        return decodeURIComponent(p[1]);
      }
    }
    return false;
  }
}

Preferences.load()


if (self.lively && lively.preferences) {
  lively.preferences = Preferences // make it live...
}

