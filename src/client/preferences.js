import components from './morphic/component-loader.js';

/*
 * Stores page-specific preferences in the body, so it gets saved/loaded with other content
 */


export default class Preferences {
  
  static load() {
    this.defaults = {
      gridSize: {default: 100, short: "grid size"},
      snapSize: {default: 20, short: "snap size"},
      SnapWindowsInGrid: {default: false, short: "snap windows in grid"},
      ShowFixedBrowser: {default: true, short: "show fixed browser"},
      InteractiveLayer: {default: false, short: "dev methods"},
      ShowDocumentGrid: {default: false, short: "show grid"},
    };
  }

  static shortDescription(preferenceKey) {
    var pref =  this.defaults[preferenceKey]
    if (pref && pref.short) 
      return pref.short
    else
      return preferenceKey
  }


  
  /* get preference, consider defaults */
  static get(preferenceKey) {
    var pref = this.read(preferenceKey)     
    if (pref === undefined) {
      var pref =  this.defaults[preferenceKey]
      if (pref) return pref.default
    } else  {
      return pref
    }
  }
  
  static get prefsNode() {
    if (this.node) return this.node
    
    this.node = document.body.querySelector('lively-preferences');
    if (!this.node) {
      this.node = document.createElement('lively-preferences')
      this.node.classList.add("lively-content")
      components.openInBody(this.node)
    }
    return this.node
  }
  
  static  read(preferenceKey) {
    return this.prefsNode.dataset[preferenceKey];
  }
  
  static write(preferenceKey, preferenceValue) {
    this.prefsNode.dataset[preferenceKey] = preferenceValue;
  }
  
  static isEnabled(preferenceKey, defaultValue) {
    var pref =  this.read(preferenceKey);
    if (pref === undefined) return defaultValue;
    return pref == "true"
  }

  static enable(preferenceKey) {
    Preferences.write(preferenceKey, "true")
    this.applyPreference(preferenceKey)
  }

  static disable(preferenceKey) {
    Preferences.write(preferenceKey, "false")
    this.applyPreference(preferenceKey)
  }
  
  static applyPreference(preferenceKey) {
    var msg = "on" +  preferenceKey[0].toUpperCase() + preferenceKey.slice(1) + "Preference"
    if (lively[msg]) {
      try {
        var json = this.read(preferenceKey)
        var config = JSON.parse(json)
        lively[msg](config)
      } catch(e) {
        console.log("[preference] could not parse json: " + json)
      }
    } else {
      console.log("[preference] lively does not understand: " + msg)
    }
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

