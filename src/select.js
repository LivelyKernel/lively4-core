define(function module(require) {

var pushIfMissing = require('./utils').pushIfMissing;
var removeIfExisting = require('./utils').removeIfExisting;
var Stack = require('./utils').Stack;
var isPrimitive = require('./utils').isPrimitive;

cop.create('SelectionLayer')
    .refineObject(users.timfelgentreff.jsinterpreter, {
        get InterpreterVisitor() {
            return SelectionInterpreterVisitor;
        }
    });

var PROPERTY_ACCESSOR_NAME = 'wrappedValue';
var PropertyAccessor = Object.subclass('whjfqggkewgdkewgfiuewgfeldigdk3v3m', {
    initialize: function(obj, propName) {
        this.selectionItems = new Set();

        this.safeOldAccessors(obj, propName);

        try {
            obj.__defineGetter__(propName, function() {
                return this[PROPERTY_ACCESSOR_NAME];
            }.bind(this));
        } catch (e) { /* Firefox raises for Array.length */ }
        var newGetter = obj.__lookupGetter__(propName);
        if (!newGetter) {
            // Chrome silently ignores __defineGetter__ for Array.length
            this.externalVariables(solver, null);
            return;
        }

        obj.__defineSetter__(propName, function(newValue) {
            var returnValue = this[PROPERTY_ACCESSOR_NAME] = newValue;
            console.log('newValue for', obj, propName, newValue);
            if(!isPrimitive(newValue)) {
                this.recalculate();
            }
            this.applyCallbacks();
            return returnValue;
        }.bind(this));
    },

    safeOldAccessors: function(obj, propName) {
        // take existing getter, if existent, and assign to
        var existingSetter = obj.__lookupSetter__(propName),
            existingGetter = obj.__lookupGetter__(propName);
        if (existingGetter && existingSetter) {
            this.__defineGetter__(PROPERTY_ACCESSOR_NAME, existingGetter);
            this.__defineSetter__(PROPERTY_ACCESSOR_NAME, existingSetter);
        }

        // assign old value to new slot
        if (!existingGetter &&
            !existingSetter &&
            obj.hasOwnProperty(propName)
        ) {
            this[PROPERTY_ACCESSOR_NAME] = obj[propName];
        }
    },

    addCallback: function(selectionItem) {
        this.selectionItems.add(selectionItem);
        selectionItem.propertyAccessors.add(this);
    },
    applyCallbacks: function() {
        this.selectionItems.forEach(function(selectionItem) {
            selectionItem.callback();
        });
    },
    recalculate: function() {
        console.log('should recalculate');

        var selectionItems = [];
        this.selectionItems.forEach(function(selectionItem) {
            selectionItems.push(selectionItem);
        });

        selectionItems.forEach(function(selectionItem) {
            selectionItem.removeListeners();
        });
        selectionItems.forEach(function(selectionItem) {
            selectionItem.installListeners();
        });
    }
});

PropertyAccessor.accessors = new Map();
PropertyAccessor.wrapProperties = function(obj, propName) {
    var mapObj;
    if(PropertyAccessor.accessors.has(obj)) {
        mapObj = PropertyAccessor.accessors.get(obj);
    } else {
        mapObj = {};
        PropertyAccessor.accessors.set(obj, mapObj);
    }

    if(!mapObj.hasOwnProperty(propName)) {
        mapObj[propName] = new PropertyAccessor(obj, propName);
    }

    return mapObj[propName];
};

users.timfelgentreff.jsinterpreter.InterpreterVisitor.subclass('SelectionInterpreterVisitor', {

    visitGetSlot: function($super, node) {

        var obj = this.visit(node.obj),
            propName = this.visit(node.slotName);

        PropertyAccessor
            .wrapProperties(obj, propName)
            .addCallback(Selection.current());

        return $super(node);
    },

    shouldInterpret: function(frame, fn) {
        if (this.isNative(fn)) return false;
        return typeof(fn.forInterpretation) == 'function';
    }
});

Object.subclass('Selection', {
    initialize: function(baseSet, expression, context) {
        //this.baseSet = baseSet;
        baseSet.downstream.push(this);
        this.expression = expression;
        this.expression.varMapping = context;

        this.items = [];
        this.selectionItems = new Set();
    },
    newItem: function(item) {
        this.trackItem(item);
    },
    trackItem: function(item) {
        if(this.expression(item)) {
            this.items.push(item);
        }

        var selectionItem = new SelectionItem(this, item);

        this.selectionItems.add(selectionItem);

        selectionItem.installListeners();
    },
    destroyItem: function(item) { /* TODO */ },

    safeAdd: function(item) {
        var wasNewItem = pushIfMissing(this.items, item);
        /* TODO: push changes downstream if necessary */
        if(wasNewItem) { console.log('added', item); }
    },
    safeRemove: function(item) {
        var gotRemoved = removeIfExisting(this.items, item);
        /* TODO: push changes downstream if necessary */
        if(gotRemoved) { console.log('removed', item); }
    },
    size: function() { return this.items.length; }
});

Selection.stack = new Stack();
Selection.current = function() { return Selection.stack.top(); };
Selection.withOnStack = function(el, callback, context) {
    Selection.stack.push(el);
    try {
        callback.call(context);
    } finally {
        Selection.stack.pop();
    }
};

Object.subclass('SelectionItem', {
    initialize: function(selection, item) {
        this.selection = selection;

        this.callback = (function() {
            console.log('check');
            if(this.expression(item)) {
                this.safeAdd(item);
            } else {
                this.safeRemove(item);
            }
        }).bind(selection);

        this.item = item;
        this.propertyAccessors = new Set();
    },

    installListeners: function() {
        var item = this.item;
        Selection.withOnStack(this, function() {
            cop.withLayers([SelectionLayer], (function() {
                this.expression.forInterpretation().apply(null, [item]);
            }).bind(this));
        }, this.selection);
    },

    removeListeners: function() {
        this.propertyAccessors.forEach(function(propertyAccessor) {
            propertyAccessor.selectionItems.delete(this);
        }, this);
        this.propertyAccessors.clear();
    }
});

    var select = function(Class, expression, context) {
    return new Selection(Class.__livingSet__, expression, context);
};

return select;

});
