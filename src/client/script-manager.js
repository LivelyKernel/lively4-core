'use strict';



var messaging = require('./messaging.js');

function functionFromString(funcOrString) {
    if (typeof funcOrString === 'function') {
        return funcOrString;
    }

    // this makes sure we always create a function
    try {
        // this fails if it has no `function ()` header
        return eval('(' + funcOrString.toString() + ')');    
    } catch(err) {
        // this works with just a block of code (for lively4script)
        return new Function(funcOrString.toString());   
    }
}

function findLively4Script(parent, shadow) {
    // if shadow is set, look for the scripts in the shadow root
    var children = shadow ? parent.shadowRoot.children : parent.children;

    for (var i = 0; i < children.length; ++i) {
        var child = children[i];
        if (child.tagName.toLocaleLowerCase() == "script" && child.type == "lively4script") {
            var name = child.dataset.name;
            var func = functionFromString(child.textContent);
            if (typeof func !== 'function') {
                throw 'no valid function provided!';
            }
            if (typeof parent.__scripts__ === 'undefined') {
                parent.__scripts__ = {};
            }
            parent.__scripts__[name] = parent[name] = func.bind(parent);
        } else {
            // do never look into the shadow dom of child elements
            findLively4Script(child, false);
        }
    }
}


export function loadScriptsFromDOM() {
    findLively4Script(document);
}

export function attachScriptsFromShadowDOM(root) {
    findLively4Script(root, true);
}

function persistToDOM(object, funcString, data={}) {
    data.type = "lively4script";
    $("<script>").attr(data).text(funcString).appendTo(object);    
}

function removeFromDOM(object, name) {
    var children = $(object).children("script[type='lively4script'][data-name='" + name + "']");
    if (children.size() != 1)  throw 'multiple children detected ' + children;
    children.remove();
}

export function updateScript(object, funcOrString, opts={}) {
    if (object instanceof jQuery) {
        jQuery.each(object, function(k, v) {
            addScript(v, funcOrString, opts);
        });
        return;
    }

    var func = functionFromString(funcOrString);
    if (typeof func !== 'function') {
        throw 'no valid function provided!';
    }

    var name = func.name || opts.name;
    if (!name) {
        throw 'cannot update script without name!';
    }

    removeScript(object, name);
    addScript(object, funcOrString, opts)
}

export function addScript(object, funcOrString, opts={}) {
    if (object instanceof jQuery) {
        jQuery.each(object, function(k, v) {
            addScript(v, funcOrString, opts);
        });
        return;
    }

    if (typeof object.__scripts__ === 'undefined') {
        object.__scripts__ = {};
    }

    var func = functionFromString(funcOrString);
    if (typeof func !== 'function') {
        throw 'no valid function provided!';
    }

    var name = func.name || opts.name;
    if (!name) {
        throw 'cannot add script without name!';
    }

    if (typeof object[name] !== 'undefined') {
        throw 'script name "' + name + '" is already reserved!';
    }

    object[name] = func.bind(object);
    object[name].isScript = true;
    object.__scripts__[name] = funcOrString.toString();

    persistToDOM(object, func.toString(), {"data-name": name});
}

export function removeScript(object, name) {
    if (object instanceof jQuery) {
        jQuery.each(object, function(k, v) {
            removeScript(v, name);
        });
        return;
    }
    
    if (typeof object.__scripts__ === 'undefined'
        || typeof object.__scripts__[name] === 'undefined') {
        throw 'script name "' + name + '" does not exist!';
    }

    delete object.__scripts__[name];
    delete object[name];
    removeFromDOM(object, name);
}

export function callScript(object, name) {
    var optionalArgs = [].splice.call(arguments, 2);
    if (object instanceof jQuery) {
        jQuery.each(object, function(k, v) {
            var args = [v, name];
            args = args.concat(optionalArgs);
            callScript.apply(this, args);
        });
        return;
    }
    if (typeof object.__scripts__ !== 'undefined' && typeof object.__scripts__[name] !== 'undefined') {
        return object[name].apply(object, optionalArgs);
    }
    throw 'unknown script "' + name +'"!'
}
