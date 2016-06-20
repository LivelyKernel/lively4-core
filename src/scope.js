const events = [
    'beforeActivation',
    'afterActivation',
    'beforeDeactivation',
    'afterDeactivation'
];

export class Layer {
    constructor() {
        this._isActive = false;
        // TODO: give _partials a set semantic
        this._partials = [];

        this._eventCallbacks = new Map();
        for(let eventName of events) {
            this._eventCallbacks.set(eventName, new Set());
        }
    }

    // Managing composites
    add(partial) {
        this._partials.push(partial);

        return this;
    }
    remove(partial) {
        var i = this._partials.indexOf(partial);
        if(i >= 0) {
            this._partials.splice(i, 1);
        }
        return this;
    }
    contains(partial) {
        return this._partials.includes(partial);
    }
    [Symbol.iterator]() {
        return this._partials.values()
    }

    // Scope Activation
    activate() {
        this._eventCallbacks.get('beforeActivation').forEach(callback => callback());

        this._isActive = true;
        this._partials.forEach(partial => partial.activate());

        this._eventCallbacks.get('afterActivation').forEach(callback => callback());

        return this;
    }
    deactivate() {
        this._eventCallbacks.get('beforeDeactivation').forEach(callback => callback());

        this._isActive = false;
        this._partials.forEach(partial => partial.deactivate());

        this._eventCallbacks.get('afterDeactivation').forEach(callback => callback());

        return this;
    }
    isActive() { return this._isActive; }

    // Activation Hooks
    on(event, callback) {
        var callbacks = this._eventCallbacks.get(event);
        callbacks.add(callback);

        return this;
    }
    off(event, callback) {
        var callbacks = this._eventCallbacks.get(event);
        callbacks.delete(callback);

        return this;
    }

    // TODO: Instance-based activation
    activateFor() {}
    deactivateFor() {}
    isActiveFor() {}
}
