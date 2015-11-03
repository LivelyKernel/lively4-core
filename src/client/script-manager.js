'use strict';

var messaging = require('./messaging.js');

function functionFromString(funcOrString) {
    if (typeof funcOrString === 'function') {
        return funcOrString;
    }
    return eval('(' + funcOrString.toString() + ')');
}

function findLively4Script(parent) {
    for (var i = 0; i < parent.children.length; ++i) {
        var child = parent.children[i];
        if (child.tagName.toLocaleLowerCase() == "script" && child.type == "lively4script") {
            var name = child.dataset.name;
            var func = functionFromString(child.textContent);
            if (typeof func !== 'function') {
                throw 'no valid function provided!';
            }
            parent.__scripts__[name] = parent[name] = func.bind(parent);
        }
        else findLively4Script(child);
    }
}


function loadScriptsFromDOM() {
    findLively4Script(document);
}

function persistToDOM(object, funcString, data) {
    data = data || {};
    data.type = "lively4script";
    $("<script>").attr(data).text(funcString).appendTo(object);

    var world = $("html").clone();
    world.find("#editor").empty();
    world.find("#console").empty();
    var s = new XMLSerializer();
    var content = "<!DOCTYPE html>" + s.serializeToString(world[0]);

    var url = document.URL;
    var r = /https:\/\/([\w-]+)\.github\.io\/([\w-]+)\/(.+)/i;
    var results = url.match(r);

    writeFile(results[2], results[3], results[1], content);
}

function writeFile(repo, path, user, content) {
    return messaging.postMessage({
        meta: {
            type: 'github api'
        },
        message: {
            credentials: {
                token: localStorage.GithubToken,
                auth: 'oauth'
            },
            topLevelAPI: 'getRepo',
            topLevelArguments: [user, repo],
            method: 'write',
            args: ['gh-pages', path, content, 'auto commit']
        }
    }).then(function(event) {
        return event;
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
