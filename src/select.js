define(function module() {

var pushIfMissing = function(array, item) {
    // check for already existing.
    var exists = false;
    var len = array.length;
    for(var i = 0; i < len; i++)
        if(array[i] == item) {
            exists = true;
            break;
        };

    // do not add an already existing item
    if (!exists) {
        array.push(item);
    }

    // return true if the given element was pushed, otherwise false
    return !exists;
};

var removeIfExisting = function(array, item) {
    var index = array.indexOf(item);
    if (index !== -1) {
        array.splice(index, 1);
        // return true if the given element was actually removed
        return true;
    }
    return false;
};


cop.create('SelectionLayer')
    .refineObject(users.timfelgentreff.jsinterpreter, {
        get InterpreterVisitor() {
            return SelectionInterpreterVisitor;
        }
    });

var PROPERTY_ACCESSOR_NAME = 'wrappedValue';
var PropertyAccessor = Object.subclass('whjfqggkewgdkewgfiuewgfeldigdk3v3m', {
    initialize: function(obj, propName) {
        this.callbacks = [];

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

    addCallback: function(callback) { this.callbacks.push(callback); },
    applyCallbacks: function() {
        this.callbacks.forEach(function(callback) {
            callback();
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

        //console.log('visitGetSlot', obj, propName, obj[propName]);

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

var Stack = function() {
    this.arr = [];
};
Stack.prototype.push = function(el) {
    this.arr.push(el);
};

Stack.prototype.pop = function() {
    this.arr.length--;
};

Stack.prototype.top = function() {
    return this.arr.last();
};

var Selection = function() { this.initialize.apply(this, arguments); };

Selection.stack = new Stack();
Selection.current = function() { return Selection.stack.top(); };

Selection.prototype.initialize = function(baseSet, expression, context) {
    //this.baseSet = baseSet;
    baseSet.downstream.push(this);
    this.expression = expression;
    this.expression.varMapping = context;

    this.items = [];
};
Selection.prototype.newItem = function(item) {
    this.trackItem(item);
};
Selection.prototype.trackItem = function(item) {
    if(this.expression(item)) {
        this.items.push(item);
    }

    this.withOnStack((function(item) {
        console.log('check');
        if(this.expression(item)) {
            this.safeAdd(item);
        } else {
            this.safeRemove(item);
        }
    }).bind(this, item), function() {
        cop.withLayers([SelectionLayer], (function() {
            this.expression.forInterpretation().apply(null, [item]);
        }).bind(this));
    }, this);
};
Selection.prototype.destroyItem = function(item) { /* TODO */ };

Selection.prototype.safeAdd = function(item) {
    var wasNewItem = pushIfMissing(this.items, item);
    /* TODO: push changes downstream if necessary */
    if(wasNewItem) { console.log('added', item); }
};
Selection.prototype.safeRemove = function(item) {
    var gotRemoved = removeIfExisting(this.items, item);
    /* TODO: push changes downstream if necessary */
    if(gotRemoved) { console.log('removed', item); }
};
Selection.prototype.size = function() { return this.items.length; };
Selection.prototype.withOnStack = function(el, callback, context) {
    Selection.stack.push(el);
    try {
        callback.call(context);
    } finally {
        Selection.stack.pop();
    }
}

var select = function(Class, expression, context) {
    return new Selection(Class.__livingSet__, expression, context);
};

return select;

});
