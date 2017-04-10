import components from './morphic/component-loader.js';

var prefsNode;


var _baseURL  = window.lively4url || (window.location.origin + "/lively4-NOTHING/") // gets overridden... but this is a sane default

export function getBaseURL() { return _baseURL}
export function setBaseURL(val) { _baseURL = val}

initialize();

function initialize() {
  prefsNode = createOrGetPreferenceNode();
}

function createOrGetPreferenceNode() {
  let node = document.querySelectorAll('lively-preferences');
  if (node.length == 0) {
    var comp = document.createElement('lively-preferences')
    comp.classList.add("lively-content")
    components.openInBody(comp)
  }

  return document.querySelector('lively-preferences');
}

export function read(preferenceKey) {
  return prefsNode.dataset[preferenceKey];
}

export function write(preferenceKey, preferenceValue) {
  prefsNode.dataset[preferenceKey] = preferenceValue;
}

export function getURLParameter(theParameter) {
  var params = window.location.search.substr(1).split('&');

  for (var i = 0; i < params.length; i++) {
    var p=params[i].split('=');
    if (p[0] == theParameter) {
      return decodeURIComponent(p[1]);
    }
  }
  return false;
}
