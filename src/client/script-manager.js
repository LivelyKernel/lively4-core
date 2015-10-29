'use strict';

function functionFromString(funcOrString) {
    if (typeof funcOrString === 'function') {
        return funcOrString;
    }
    return eval('(' + funcOrString.toString() + ')');
}

export function addScript(object, funcOrString, opts) {
    if (object instanceof jQuery) {
        jQuery.each(object, function(k, v) {
            addScript(v, funcOrString, opts);
        });
        return;
    }

    opts = opts || {};
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

    object.__scripts__[name] = object[name] = func.bind(object);
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