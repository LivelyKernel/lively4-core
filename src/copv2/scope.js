const events = [
    'beforeActivation',
    'afterActivation',
    'beforeDeactivation',
    'afterDeactivation',

    'beforeActivationFor',
    'afterActivationFor',
    'beforeDeactivationFor',
    'afterDeactivationFor'
];

const staticEvent = [
    'created',
    'activated',
    'deactivated'
];

export const COMPOSE_ANY = {};
export const COMPOSE_ALL = {};
export const COMPOSE_LAST = {};
const COMPOSE_DEFAULT = COMPOSE_ALL;

// TODO: add activation types
const ACTIVATION_TYPE_TRANSITION = {};
const ACTIVATION_TYPE_STATE = {};

function getWithEmptySetAsDefault(map, key) {
    if(!map.has(key)) {
        map.set(key, new Set());
    }

    return map.get(key);
}

class EventEmitter {
    constructor() {
        this._eventHandlers = new Map();
    }

    getHandlers(event) {
        return getWithEmptySetAsDefault(this._eventHandlers, event);
    }

    on(event, callback) {
        this.getHandlers(event).add(callback);
    }

    off(event, callback) {
        this.getHandlers(event).delete(callback);
    }

    emit(event, ...args) {
        this.getHandlers(event).forEach(callback => callback(...args));
    }
}

// TODO: rename to PartialBehavior or adaption
export class Partial {
    constructor(compositionMode) {
        this.compositionMode = compositionMode;
        this._isActive = false;
        this._activatedItems = new Set();

        // TODO: use a dedicated event listener library
        this._eventEmitter = new EventEmitter();
    }
    isActive() { return this._isActive; }
    isActiveFor(obj) {
        return this._activatedItems.has(obj);
    }

    // Activation of the partial behavior
    // TODO: these methods are candidates for around advices
    activate() {
        if(!this.isActive()) {
            this._eventEmitter.emit('beforeActivation');

            this._isActive = true;
            this.__activate__();

            this._eventEmitter.emit('afterActivation');
        }

        return this;
    }
    deactivate() {
        if(this.isActive()) {
            this._eventEmitter.emit('beforeDeactivation');

            this._isActive = false;
            this.__deactivate__();

            this._eventEmitter.emit('afterDeactivation');
        }

        return this;
    }

    activateFor(obj) {
        if(!this.isActiveFor(obj)) {
            this._eventEmitter.emit('beforeActivationFor', obj);

            this._activatedItems.add(obj);
            this.__activateFor__(obj);

            this._eventEmitter.emit('afterActivationFor', obj);
        }

        return this;
    }
    deactivateFor(obj) {
        if(this.isActiveFor(obj)) {
            this._eventEmitter.emit('beforeDeactivationFor', obj);

            this._activatedItems.delete(obj);
            this.__deactivateFor__(obj);

            this._eventEmitter.emit('afterDeactivationFor', obj);
        }

        return this;
    }

    __activate__() {}
    __deactivate__() {}
    __activateFor__() {}
    __deactivateFor__() {}

    // Activation Hooks
    on(event, callback) {
        this._eventEmitter.on(event, callback);

        return this;
    }
    off(event, callback) {
        this._eventEmitter.off(event, callback);

        return this;
    }
}

const scopeEmitter = new EventEmitter();
// TODO: conceptually, this could be a WeakSet
const activeScopes = new Set();
// TODO: conceptually, this could be a WeakMap of WeakSets
const activeScopesByObject = new Map();

export class Scope extends Partial {
    constructor() {
        super();

        this._partials = new Set();

        scopeEmitter.emit('created', this);
    }

    // Managing composites
    add(partial) {
        this._partials.add(partial);

        if(this.isActive()) {
            partial.activate();
        }
        this._activatedItems.forEach(activatedItem => partial.activateFor(activatedItem));

        return this;
    }
    remove(partial) {
        this._partials.delete(partial);

        if(this.isActive()) {
            partial.deactivate();
        }
        this._activatedItems.forEach(activatedItem => partial.deactivateFor(activatedItem));

        return this;
    }
    contains(partial) {
        return this._partials.has(partial);
    }
    [Symbol.iterator]() {
        return this._partials.values()
    }

    __activate__() {
        super.__activate__();

        activeScopes.add(this);
        scopeEmitter.emit('activated', this);

        this._partials.forEach(partial => partial.activate());
    }
    __deactivate__() {
        super.__deactivate__();

        activeScopes.delete(this);
        scopeEmitter.emit('deactivated', this);

        this._partials.forEach(partial => partial.deactivate());
    }
    __activateFor__(obj) {
        super.__activateFor__(obj);

        getWithEmptySetAsDefault(activeScopesByObject, obj).add(this);
        scopeEmitter.emit('activatedFor', this, obj);

        this._partials.forEach(partial => partial.activateFor(obj));
    }
    __deactivateFor__(obj) {
        super.__deactivateFor__(obj);

        getWithEmptySetAsDefault(activeScopesByObject, obj).delete(this);
        scopeEmitter.emit('deactivatedFor', this, obj);

        this._partials.forEach(partial => partial.deactivateFor(obj));
    }

    static on(event, callback) {
        scopeEmitter.on(event, callback);

        return this;
    }

    static off(event, callback) {
        scopeEmitter.off(event, callback);

        return this;
    }

    static activeScopes() {
        // TODO: should we really only provide a view
        // TODO: this is currently done because chai 'include' can only deal with Arrays
        return Array.from(activeScopes);
    }

    static activeScopesFor(obj) {
        return Array.from(getWithEmptySetAsDefault(activeScopesByObject, obj));
    }
}
