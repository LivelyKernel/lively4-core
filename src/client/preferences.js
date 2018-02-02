import components from './morphic/component-loader.js';

/*
 * Stores page-specific preferences in the body, so it gets saved/loaded with other content
 */


export default class Preferences {
  
  static load() {
    console.info('Load preferences')
    
    // Keys must be upper case
    const defaults = {
      GridSize: {default: 100, short: "grid size"},
      SnapSize: {default: 20, short: "snap size"},
      SnapPaddingSize: {default: 20, short: "padding while snapping size"},
      SnapWindowsInGrid: {default: false, short: "snap windows in grid"},
      ShowFixedBrowser: {default: true, short: "show fixed browser"},
      InteractiveLayer: {default: false, short: "dev methods"},
      ShowDocumentGrid: {default: false, short: "show grid"},
      DisableAExpWorkspace: {default: false, short: "disable AExp in workspace"},
      DisableAltGrab: {default: false, short: "disable alt grab with hand"},
      UseAsyncWorkspace: {default: false, short: "support await in eval"},
      UseTernInCodeMirror: {default: false, short: "enable tern autocomplete and navigation"},
      CtrlAsHaloModifier: {default: false, short: "ctrl key as halo modifier"},
      EnableSyvisEditor: {default: false, short: 'Enable syvis editor'},
    }
    
    // Make defaults immutable
    Object.freeze(defaults)
    
    this.defaults = defaults
    
    Object
      .entries(defaults)
      .forEach(([key, obj]) => {
        this.set(key, obj.default)
      })
  }
  
  // List all avaiable preferences
  static list () {
    return Object
      .keys(this.defaults)
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
    if (this.node) return this.node
    // #BUG: reloading Preferences causes dataset to be not defined anymore
    this.node = document.body.querySelector('lively-preferences');
    if (!this.node) {
      this.node = document.createElement('lively-preferences')
      this.node.classList.add("lively-content")
      components.openInBody(this.node)
    }
    return this.node
  }
  
  static read(preferenceKey) {
    return this.prefsNode && this.prefsNode.dataset ?
      this.prefsNode.dataset[preferenceKey] :
      undefined;
  }
  
  static write(preferenceKey, preferenceValue) {
    if(!this.prefsNode || !this.prefsNode.dataset) { return; }
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
      console.warn(`[preference] No event handler registered for "${preferenceKey}"`)
      return
    }
    
    const config = this.get(preferenceKey)
    lively[msg](config)
  }
  
  static loadPreferences() {
    Object.keys(this.prefsNode.dataset).forEach(preferenceKey => {
      this.applyPreference(preferenceKey)
    })
  }

  static getURLParameter(theParameter) {
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

