
// TODO: support withoutLayers as well
export function withLayers(layers, callback) {
    try {
        // TODO: we should remember the state of these scopes and revert to them after the function call;
        layers.forEach(l => l.activate());
        return callback();
    }
    finally {
        layers.forEach(l => l.deactivate());
    }
}
