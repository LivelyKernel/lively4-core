'use strict';

var prefsNode;

initialize();

function initialize() {
    prefsNode = createOrGetPreferenceNode();
}

function createOrGetPreferenceNode() {
    let node = $('lively-preferences');
    if (node.size() == 0) {
        $('body').append($('<lively-preferences>'));
    }
    return $('lively-preferences')[0];
}

export function read(preferenceKey) {
    return prefsNode.dataset[preferenceKey];
}

export function write(preferenceKey, preferenceValue) {
    prefsNode.dataset[preferenceKey] = preferenceValue;
}