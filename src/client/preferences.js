/*
 * Stores page-specific preferences in the body, so it gets saved/loaded with other content
 */

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
      TabbedWindows: {default: false, short: "use experimental window tabs"},
      SWEDebugging: {default: false, short: "bug showcase in swe lecture"},
      AEXPGraphExperimental: {default: false, short: "AExpr graph experimental"},
      GSFullLogInfo: {default: false, short: "full log info for GS"},
      StefansExperimentalPreference: {default: false, short: "Stefans experimental preference"},
    }
  }
  
  static load() {
    console.info('Load preferences')
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
  
  static get prefsNode() {
    // #BUG: reloading Preferences causes dataset to be not defined anymore
    if (!(window && window.document)) return null;
    
    let node = document.body.querySelector('.lively-preferences');
    if (!node) {
      console.log("Create prefereces")
      node = document.createElement('div'); // we cannot use custom comps they are async
      node.classList.add("lively-preferences")
      node.classList.add("lively-content")
      document.body.insertBefore(node, document.body.firstChild);
    }
    return node
  }
  
  static read(preferenceKey) {
    return this.prefsNode && this.prefsNode.dataset ?
      this.prefsNode.dataset[preferenceKey] :
      undefined;
  }
  
  static write(preferenceKey, preferenceValue) {
    if(!this.prefsNode) { return; }
    if (!this.prefsNode.dataset) {
      this.prefsNode.setAttribute("data-foo", true); // force dataset
    }
    this.prefsNode.dataset[preferenceKey] = preferenceValue;
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

