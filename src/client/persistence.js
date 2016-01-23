'use strict';

var persistenceTimerInterval;
var persistenceEnabled = false;
var persistenceInterval = 5000;
var persistenceTarget = 'http://lively4/';

function isDoNotPersistTag(node) {
    return node.attributes
        && node.attributes.hasOwnProperty('data-lively4-donotpersist')
        && node.dataset.lively4Donotpersist == 'all'
}

function hasParentTag(node) {
    return node.parentElement != null;
}

function initialize(){
    resetPersistenceSessionStore();

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
                
                shouldSave = !nodes.every(isDoNotPersistTag)
                    && (addedNodes.length <= 0 || addedNodes.some(hasParentTag))
                    && (removedNodes.length <= 0 || !removedNodes.every(n => orphans.has(n)))

                //remove removed orphan nodes from orphan set
                for (let node of removedNodes) {
                    if (orphans.has(node)) {
                        orphans.delete(node);
                    }
                }
            }

            if (shouldSave) {
                sessionStorage["lively.scriptMutationsDetected"] = 'true';
                restartPersistenceTimerInterval();
            }
        })
    });
    observer.observe(document, {childList: true, subtree: true, characterData: true, attributes: true});
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
        r = /localhost:8080\/(.+)/i;
        results = url.match(r);
        if (results)
        {
            filename = results[1];
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

    let evt = $.Event('persistenceInterval');
    evt.persistenceInterval = interval;
    $(window).trigger(evt);

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

    let evt = $.Event('persistenceEnabled');
    evt.persistenceEnabled = enabled;
    $(window).trigger(evt);
}

export function getPersistenceTarget() {
    return persistenceTarget;
}

export function setPersistenceTarget(target) {
    if (target == persistenceTarget) return;

    persistenceTarget = target;

    let evt = $.Event('persistenceTarget');
    evt.persistenceTarget = target;
    $(window).trigger(evt);
}

export function isCurrentlyCloning() {
    return sessionStorage["lively.persistenceCurrentlyCloning"] === 'true';
}

function saveDOM(async = true) {
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