import Stack from 'stack-es2015-modules';

const layerStack = new Stack();

function memorizeState(layers) {
    layerStack.push(layers.map(l => l.isActive()));
}

function restoreState(layers) {
    let previouslyActivated = layerStack.top();
    layerStack.pop();
    layers.forEach((l, i) => {
        if(previouslyActivated[i]) {
            if(!l.isActive()) {
                l.activate();
            }
        } else {
            if(l.isActive()) {
                l.deactivate();
            }
        }
    });
}

// TODO: is this worth factoring into a template method (memorize, try finally and restore are shared across all four functions)
export function withLayers(layers, callback) {
    memorizeState(layers);
    try {
        layers.forEach(l => l.activate());
        return callback();
    }
    finally {
        restoreState(layers);
    }
}

export function withoutLayers(layers, callback) {
    memorizeState(layers);
    try {
        layers.forEach(l => l.deactivate());
        return callback();
    }
    finally {
        restoreState(layers);
    }
}

const instanceStack = new Stack();

function memorizeInstanceState(layers, objs) {
    layerStack.push(layers.map(l => {
        let objectStates = new Map();
        objs.forEach(o => objectStates.set(o, l.isActiveFor(o)));

        return objectStates;
    }));
}

function restoreInstanceState(layers) {
    let previouslyActivated = layerStack.top();
    layerStack.pop();
    layers.forEach((l, i) => {
        previouslyActivated[i].forEach((previousstatus, obj) => {
            if(previousstatus) {
                if(!l.isActiveFor(obj)) {
                    l.activateFor(obj);
                }
            } else {
                if(l.isActiveFor(obj)) {
                    l.deactivateFor(obj);
                }
            }
        });
    });
}

export function withLayersFor(layers, objs, callback) {
    memorizeInstanceState(layers, objs);
    try {
        layers.forEach(l =>
            objs.forEach(o =>
                l.activateFor(o)));
        return callback();
    }
    finally {
        restoreInstanceState(layers);
    }
}

export function withoutLayersFor(layers, objs, callback) {
    memorizeInstanceState(layers, objs);
    try {
        layers.forEach(l =>
            objs.forEach(o =>
                l.deactivateFor(o)));
        return callback();
    }
    finally {
        restoreInstanceState(layers);
    }
}

