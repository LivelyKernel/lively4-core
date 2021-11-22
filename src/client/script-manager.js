import _ from 'src/external/lodash/lodash.js'

export function functionFromString(funcOrString) {
  if (typeof funcOrString === 'function') {
    return funcOrString;
  }
  // this makes sure we always create a function
  return eval('(' + funcOrString.toString() + ')');
}

function isLively4Script(object) {
  return object.tagName.toLocaleLowerCase() == "script" &&
    object.type == 'lively4script';
}

function persistToDOM(object, funcString, name) {
  var DOMScript = <script type='lively4script' data-name={name}>{funcString}</script>
  object.appendChild(DOMScript);
}

function removeFromDOM(object, name) {
  var children = object.querySelectorAll('script[type="lively4script"][data-name="' + name + '"]');

  if (children.length > 1) {
    throw new Error('multiple children detected ' + children);
  }
  children.forEach(ea => ea.remove());
}

function prepareFunction(funcOrString, name) {
  var func = functionFromString(funcOrString);
  if (typeof func !== 'function') {
    throw 'no valid function provided!';
  }
  name = name || func.name;
  if (!_.isString(name)) {
    throw new Error("name should be a string, but it is ", name) 
  }
  if (!name) {
    throw 'cannot update script without name!';
  }

  return {
    executable: func,
    name: name
  };
}

function bindFunctionToObject(object, func, options) {
  object[func.name] = func.executable.bind(object);
  object[func.name].isScript = true;
}

function initializeScriptsMap(object) {
  if (typeof object.__scripts__ === 'undefined') {
    object.__scripts__ = {};
  }
}

function scriptExists(object, name) {
  return typeof object.__scripts__ !== 'undefined' &&
    typeof object.__scripts__[name] !== 'undefined';
}

function addFunctionToScriptsMap(object, name, funcOrString) {
  object.__scripts__[name] = funcOrString.toString();
}

function persistScript(object, name, funcOrString, options) {
  if (!options.hasOwnProperty("persist") || options.persist == true) {
    
    persistToDOM(object, funcOrString.toString(), name);
  }
}

export default class ScriptManager {

  static findLively4Script(parent, shadow) {
    // if shadow is set, look for the scripts in the shadow root
    var children = shadow ? parent.shadowRoot.children : parent.children;

    if (!children) return;
    for (let child of children) {
      if (isLively4Script(child)) {
        var scriptName = child.dataset.name;
        
        try {
          this.initializeScript(parent, child.textContent, false, {
            name: scriptName,
            persist: false
          });

        } catch (e) {
          lively.notify('Error adding function: ' + scriptName + ' to object: ' + parent,
            "" + e, 20, () => lively.openWorkspace("" + e + "Source: " + child.textContent));
          console.error('Error while adding function ' + scriptName + ' to object:');
          console.error(parent);
          console.error(e);
        }
      } else {
        this.findLively4Script(child, false);
      }
    }
  }


  static load() {
    this.loadScriptsFromDOM();
  }

  static loadScriptsFromDOM() {
    this.findLively4Script(document);
  }

  static attachScriptsFromShadowDOM(root) {
    this.findLively4Script(root, true);
  }

  static updateScript(object, funcOrString, options = {}) {
    var func = prepareFunction(funcOrString, options.name);
    
    this.removeScript(object, func.name);
    this.addScript(object, func.executable, options);
  }

  static initializeScript(object, funcOrString, checkExists, options = {}) {
    var func = prepareFunction(funcOrString, options.name);
    if (checkExists && scriptExists(object, func.name)) {
      throw 'script name "' + func.name + '" is already reserved!';
    }
    initializeScriptsMap(object);
    bindFunctionToObject(object, func, options);
    addFunctionToScriptsMap(object, func.name, funcOrString);    
    return func
  }
  
  static addScript(object, funcOrString, options = {}) {
    var func = this.initializeScript(object, funcOrString, true, options) 

    persistScript(object, func.name, funcOrString, options);
  }

  static removeScript(object, name) {
    if (!scriptExists(object, name)) {
      throw 'script name "' + name + '" does not exist!';
    }
    delete object.__scripts__[name];
    delete object[name];
    removeFromDOM(object, name);
  }

  static callScript(object, name) {
    var optionalArgs = [].splice.call(arguments, 2);
    if (!scriptExists(object, name)) {
      throw 'unknown script "' + name + '"!';
    }

    return object[name].apply(object, optionalArgs);
  }
}

ScriptManager.load()
