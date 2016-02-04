'use strict';

import * as preferences from './preferences.js';

var persistenceTimerInterval;
var persistenceEnabled = false;
var persistenceInterval = 5000;
var persistenceTarget = 'http://lively4/';

function hasDoNotPersistTag(node, checkForChildrenValueToo = false) {
    return node.attributes
        && node.attributes.hasOwnProperty('data-lively4-donotpersist')
        && (checkForChildrenValueToo ?
            node.dataset.lively4Donotpersist == 'children' || node.dataset.lively4Donotpersist == 'all' :
            node.dataset.lively4Donotpersist == 'all');
}

function hasParentTag(node) {
    return node.parentNode != null;
}

function hasNoDonotpersistFlagInherited(nodes, isParent = false) {
    let parents = new Set();
    for (let node of nodes) {
        if (!hasDoNotPersistTag(node, isParent) && hasParentTag(node)) {
            parents.add(node.parentNode);
        }
    }
    if (parents.size == 0) return false;
    if (parents.has(document)) return true;
    return hasNoDonotpersistFlagInherited(parents, true);
}

function checkRemovedNodes(nodes, orphans) {
    return !nodes.every(hasDoNotPersistTag) && !nodes.every(n => orphans.has(n))
}

function initialize(){
    resetPersistenceSessionStore();
    loadPreferences();

    var orphans = new Set();

    $(window).unload(saveOnLeave);

    let observer = new MutationObserver((mutations, observer) => {
        mutations.forEach(record => {
            if (record.target.id == 'console'
                || record.target.id == 'editor') return;

            let shouldSave = true;
            if (record.type == 'childList') {
                let addedNodes = [...record.addedNodes],
                    removedNodes = [...record.removedNodes],
                    nodes = addedNodes.concat(removedNodes);

                //removed nodes never have a parent, so remeber orphans when they are created
                for (let node of addedNodes) {
                    if (hasParentTag(node) == false) {
                        orphans.add(node);
                    }
                }
                
                shouldSave = hasNoDonotpersistFlagInherited(addedNodes) || checkRemovedNodes(removedNodes, orphans);

                //remove removed orphan nodes from orphan set
                for (let node of removedNodes) {
                    if (orphans.has(node)) {
                        orphans.delete(node);
                    }
                }
            }
            else if (record.type == 'attributes'
                || record.type == 'characterData') {
                shouldSave = hasNoDonotpersistFlagInherited([record.target]);
            }

            if (shouldSave) {
                sessionStorage["lively.scriptMutationsDetected"] = 'true';
                restartPersistenceTimerInterval();
            }
        })
    });
    observer.observe(document, {childList: true, subtree: true, characterData: true, attributes: true});
}

function loadPreferences() {
    persistenceInterval = parseInt(preferences.read('persistenceInterval'));
    persistenceTarget = preferences.read('persistenceTarget');
    persistenceEnabled = preferences.read('persistenceEnabled') == 'true';
}

function saveOnLeave() {
    stopPersistenceTimerInterval();
    if (isPersistenceEnabled() && sessionStorage["lively.scriptMutationsDetected"] === 'true') {
        console.log("[persistence] window-closed mutations detected, saving DOM...")
        saveDOM(false);
    }
};

function getURL(){
    var baseurl = getPersistenceTarget();
    var filename;

    var url = document.URL;
    var r = /https:\/\/([\w-]+)\.github\.io\/([\w-]+)\/(.+)/i;
    var results = url.match(r);

    if (results)
    {
        filename = results[3];
    }
    else
    {
        r = /^(?:(https?):\/\/)?(?:(\w+)(?:\:(\w+))?\@)?([\w\.\-\~]+)+(?:\:(\d+))?(?:\/([\w\.\-\~\/\%]+))?(?:\?([\w\=\&]+))?(?:\#(\w+))?$/;
        results = url.match(r);
        if (results)
        {
            filename = results[6];
        } else {
            throw "Could not parse URL to persist changes!";
        }
    }

    return new URL(baseurl + filename)
}

export function startPersistenceTimerInterval() {
    persistenceTimerInterval = setInterval(checkForMutationsToSave, persistenceInterval);
}

export function stopPersistenceTimerInterval() {
    clearInterval(persistenceTimerInterval);
    persistenceTimerInterval = undefined;
}

export function getPersistenceInterval() {
    return persistenceInterval;
}

export function setPersistenceInterval(interval) {
    if (interval == persistenceInterval) return;

    persistenceInterval = interval;
    preferences.write('persistenceInterval', interval);

    restartPersistenceTimerInterval();
}

function restartPersistenceTimerInterval() {
    stopPersistenceTimerInterval();
    startPersistenceTimerInterval();
}

function resetPersistenceSessionStore() {
    sessionStorage["lively.scriptMutationsDetected"] = 'false';
    sessionStorage["lively.persistenceCurrentlyCloning"] = 'false';
}

function checkForMutationsToSave() {
    if (isPersistenceEnabled() && sessionStorage["lively.scriptMutationsDetected"] === 'true') {
        console.log("[persistence] timer-based mutations detected, saving DOM...")
        saveDOM();
    }
}

export function isPersistenceEnabled() {
    return persistenceEnabled;
}

export function setPersistenceEnabled(enabled) {
    if (enabled == persistenceEnabled) return;

    persistenceEnabled = enabled;
    preferences.write('persistenceEnabled', enabled);
}

export function getPersistenceTarget() {
    return persistenceTarget;
}

export function setPersistenceTarget(target) {
    if (target == persistenceTarget) return;

    persistenceTarget = target;
    preferences.write('persistenceTarget', target);
}

export function isCurrentlyCloning() {
    return sessionStorage["lively.persistenceCurrentlyCloning"] === 'true';
}

export function saveDOM(async = true) {
    var world;
    sessionStorage["lively.persistenceCurrentlyCloning"] = 'true';
    try {
        world = $("html").clone();
    }
    finally {
        sessionStorage["lively.persistenceCurrentlyCloning"] = 'false';
    }

    world.find("[data-lively4-donotpersist='children']").empty();
    world.find("[data-lively4-donotpersist='all']").remove();
    world.find("#editor").empty();
    world.find("#console").empty();
    world.find("#ace_editor\\.css").remove();
    world.find("#ace-tm").remove();
    world.find("style").filter((i,e) => /\s*\.error_widget_wrapper+/.test(e.textContent)).remove();
    
    var content = "<!DOCTYPE html>\n" + world[0].outerHTML;

    resetPersistenceSessionStore();

    writeFile(content, async);
}

function writeFile(content, async = true) {
    var url = getURL()
    console.log("[persistence] save " + url)
    $.ajax({
        url: url,
        type: 'PUT',
        async: async,
        data: content,
        success: text => {
            console.log("[persistence] file " + url + " written.")
        },
        error: (xhr, status, error) => {
            console.log("[persistence] could not write " + url + ": " + error)
        }
    });
}

initialize();