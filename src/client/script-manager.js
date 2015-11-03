'use strict';

var messaging = require('./messaging.js');

function functionFromString(funcOrString) {
    if (typeof funcOrString === 'function') {
        return funcOrString;
    }
    return eval('(' + funcOrString.toString() + ')');
}

function getURL(){
    var baseurl = $('#baseurl').val() // How to abstract from UI? #TODO #JensLincke
    var filename = $('#filename').val()
    return new URL(baseurl + filename)
}

function persistToDOM(object, funcString, data) {
    data = data || {};
    data.type = "lively4script";
    $("<script>").attr(data).text(funcString).appendTo(object);

    var world = $("html").clone();
    world.find("#editor").empty();
    world.find("#console").empty();
    world.find("#ace_editor\\.css").remove();
    world.find("#ace-tm").remove();
    var s = new XMLSerializer();
    var content = "<!DOCTYPE html>" + s.serializeToString(world[0]);

    writeFile(content);
}

function writeFile(content) {
    var url = getURL()
    console.log("[script-manager] save " + url)
    $.ajax({
        url: url,
        type: 'PUT',
        data: content,
        success: function(text) {
            console.log("[script-manager] file " + url + " written.")
        },
        error: function(xhr, status, error) {
            console.log("[script-manager] could not write " + url + ": " + error)
        }
    });
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

    persistToDOM(object, func.toString(), {"data-name": name});
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
