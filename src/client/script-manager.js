'use strict';

import * as _ from '../external/underscore.js';

function functionFromString(funcOrString) {
    if (typeof funcOrString === 'function') {
        return funcOrString;
    }

    // lets trick babel to allow the usage of 'this' in outermost context
    var innerWrap = '(function() { return (' + funcOrString + ').apply(this, args)}).call(temp)',
        transpiled = (babel.transform(innerWrap).code
          .replace(/^\s*('|")use strict('|");/, '"use strict"; return (') + ')')
          .replace(/;\s*\)$/, ')'),
        outerWrap = `(function() {
  var args = arguments;
  return (function(temp) {` +
          transpiled +
  `})(this);
})`;

    // this makes sure we always create a function
    try {
        // this fails if it has no `function ()` header
        return eval('(' + outerWrap.toString() + ')');
    } catch(err) {
        // this works with just a block of code (for lively4script)
        return new Function(outerWrap.toString());
    }
}

function isLively4Script(object) {
    return object.tagName.toLocaleLowerCase() == "script" &&
        object.type == 'lively4script';
}

function persistToDOM(object, funcString, data={}) {
    var DOMScript = $('<script>', _.extend(data, {
        type: 'lively4script',
        text: funcString
    }));
    $(object).append(DOMScript);
}

function removeFromDOM(object, name) {
    var children = $(object).children('script[type="lively4script"][data-name="' + name + '"]');

    if (children.size() != 1) {
        throw 'multiple children detected ' + children;
    }

    children.remove();
}

function asCollection(object) {
    if (object instanceof jQuery) {
        return object;
    }

    return [object];
}

function prepareFunction(funcOrString, options) {
    var func = functionFromString(funcOrString);
    if (typeof func !== 'function') {
        throw 'no valid function provided!';
    }

    var name = func.name || options.name;
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
        persistToDOM(object, funcOrString.toString(), {"data-name": name});
    }
}

export default class ScriptManager {

  static findLively4Script(parent, shadow) {
    // if shadow is set, look for the scripts in the shadow root
    var children = shadow ? parent.shadowRoot.children : parent.children;

    _.each(children, (child) => {
        if (isLively4Script(child)) {
            try {
                var scriptName = child.dataset.name;

                this.addScript(parent, child.textContent, {
                    name: scriptName,
                    persist: false
                });

            } catch(e) {
                debugger
                lively.notify('Error adding function: ' + scriptName + ' to object: ' + parent,
                ""+e , 20, () => lively.openWorkspace("" + e + "Source: " + child.textContent));
                console.error('Error while adding function ' + scriptName + ' to object:');
                console.error($(parent));
                console.error(e);
            }
        } else {
            this.findLively4Script(child, false);
        }
    });

    // dont do it here...
    // if(parent.initialize) parent.initialize() // initialize only after all scripts are there.
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

  static updateScript(object, funcOrString, options={}) {
      var objects = asCollection(object);

      _.each(objects, (object) => {
          var func = prepareFunction(funcOrString, options);

          this.removeScript(object, func.name);
          this.addScript(object, func.executable, options);
      });
  }

  static addScript(object, funcOrString, options={}) {
      var objects = asCollection(object);

      _.each(objects, function(object) {
          var func = prepareFunction(funcOrString, options);
          initializeScriptsMap(object);

          if(scriptExists(object, func.name)) {
              throw 'script name "' + func.name + '" is already reserved!';
          }

          bindFunctionToObject(object, func, options);
          addFunctionToScriptsMap(object, func.name, funcOrString);
          persistScript(object, func.name, funcOrString, options);
      });
  }

  static removeScript(object, name) {
      var objects = asCollection(object);

      _.each(objects, function(object) {
          if(!scriptExists(object, name)) {
              throw 'script name "' + name + '" does not exist!';
          }
          delete object.__scripts__[name];
          delete object[name];
          removeFromDOM(object, name);
      });
  }

  static callScript(object, name) {
      var optionalArgs = [].splice.call(arguments, 2);
      var objects = asCollection(object);

      _.each(objects, function(object) {
          if(!scriptExists(object, name)) {
              throw 'unknown script "' + name +'"!';
          }

          var returnValue = object[name].apply(object, optionalArgs);
      });

      return returnValue;
  }
}


ScriptManager.load()

