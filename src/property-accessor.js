var View = function() {};

import { pushIfMissing, removeIfExisting, Stack, isPrimitive, identity } from './utils.js';

// cop.create('SelectionLayer')
//     .refineObject(users.timfelgentreff.jsinterpreter, {
//         get InterpreterVisitor() {
//             return SelectionInterpreterVisitor;
//         }
//     });

var PROPERTY_ACCESSOR_NAME = 'wrappedValue';
export class PropertyAccessor {
    constructor(obj, propName) {
        this.selectionItems = new Set();

        this.safeOldAccessors(obj, propName);

        try {
            obj.__defineGetter__(propName, (function() {
                if(propName === 'prop') debugger;
                obj;
                return this[PROPERTY_ACCESSOR_NAME];
            }).bind(this));
        } catch (e) { /* Firefox raises for Array.length */ }
        var newGetter = obj.__lookupGetter__(propName);
        if (!newGetter) {
            // Chrome silently ignores __defineGetter__ for Array.length
            this.externalVariables(solver, null);
            return;
        }

        obj.__defineSetter__(propName, (function(newValue) {
            var returnValue = this[PROPERTY_ACCESSOR_NAME] = newValue;
            console.log('newValue for', obj, propName, newValue);
            if(!isPrimitive(newValue)) {
                this.recalculate();
            }
            this.applyCallbacks();
            return returnValue;
        }).bind(this));
    }

    safeOldAccessors(obj, propName) {
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
    }

    addCallback(selectionItem) {
        this.selectionItems.add(selectionItem);
        selectionItem.propertyAccessors.add(this);
    }

    applyCallbacks() {
        this.selectionItems.forEach(function(selectionItem) {
            selectionItem.propertyAssigned();
        });
    }

    recalculate() {
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
}

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

class Listener {
    constructor() {
        
    }
}

// users.timfelgentreff.jsinterpreter.InterpreterVisitor.subclass('SelectionInterpreterVisitor', {
//
//     visitGetSlot: function($super, node) {
//
//         var obj = this.visit(node.obj),
//             propName = this.visit(node.slotName);
//
//         PropertyAccessor
//             .wrapProperties(obj, propName)
//             .addCallback(View.current());
//
//         return $super(node);
//     },
//
//     shouldInterpret: function(frame, fn) {
//         if (this.isNative(fn)) return false;
//         return typeof(fn.forInterpretation) == 'function';
//     }
// });

class Operator {}
class IdentityOperator extends Operator {
    constructor(upstream, downstream) {
        super();

        this.downstream = downstream;
        upstream.downstream.push(this);
        upstream.now().forEach(function(item) {
            downstream.safeAdd(item);
        });
    }
    newItemFromUpstream(item) {
        this.downstream.safeAdd(item);
    }
    destroyItemFromUpstream(item) {
        this.downstream.safeRemove(item);
    }
}

class FilterOperator extends IdentityOperator {
    constructor(upstream, downstream, expression, context) {
        super(upstream, downstream);
        this.expression = expression;
        this.expression.varMapping = context;

        this.selectionItems = [];

        this.downstream = downstream;
        upstream.downstream.push(this);
        upstream.now().forEach(function(item) {
            this.newItemFromUpstream(item);
        }, this);
    }
    newItemFromUpstream(item) {
        this.trackItem(item);
    }
    trackItem(item) {
        if(this.expression(item)) {
            this.downstream.safeAdd(item);
        }

        if(this.selectionItems.any(function(selectionItem) {
                return selectionItem.item === item;
            })) {
            throw Error('Item already tracked', item);
        }

        var selectionItem = new SelectionItem(this, item, this.onChangeCallback.bind(this, item));

        this.selectionItems.push(selectionItem);

        selectionItem.installListeners();
    }
    onChangeCallback(item) {
        console.log('check');
        if(this.expression(item)) {
            this.addDueToFilterExpression(item);
        } else {
            this.removeDueToFilterExpression(item);
        }
    }
    addDueToFilterExpression(item) {
        this.downstream.safeAdd(item);
    }
    removeDueToFilterExpression(item) {
        this.downstream.safeRemove(item);
    }
    destroyItemFromUpstream(item) {
        var selectionItem = this.selectionItems.find(function(selectionItem) {
            return selectionItem.item === item;
        });

        if(!selectionItem) {
            console.warn('remove non-existing item from upstream', item, this);
            return;
        }

        selectionItem.removeListeners();

        var gotRemoved = removeIfExisting(this.selectionItems, selectionItem);
        if(gotRemoved) { console.log('removed via baseset', item); }

        this.downstream.safeRemove(selectionItem.item);
    }
}

export var stack = new Stack();
stack.current = function() { return stack.top(); };
stack.with = function(el, callback, context) {
    stack.push(el);
    try {
        callback.call(context);
    } finally {
        stack.pop();
    }
};

export class SelectionItem {
    constructor(selection, item, callback) {
        this.selection = selection;
        this.item = item;
        this.callback = callback;

        this.propertyAccessors = new Set();
    }

    installListeners() {
        var item = this.item;
        stack.with(this, function() {
            cop.withLayers([SelectionLayer], (function() {
                this.expression.forInterpretation().apply(null, [item]);
            }).bind(this));
        }, this.selection);
    }

    removeListeners() {
        this.propertyAccessors.forEach(function(propertyAccessor) {
            propertyAccessor.selectionItems.delete(this);
        }, this);
        this.propertyAccessors.clear();
    }
}

export function select(Class, predicate, context) {
    var newSelection = new View();

    new FilterOperator(Class.__livingSet__, newSelection, predicate, context);

    return newSelection;
}
