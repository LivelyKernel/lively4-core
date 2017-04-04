import View from './view.js';
import { pushIfMissing, removeIfExisting, Stack, isPrimitive, identity } from './utils.js';
import trigger from 'aexpr-trigger';

/*
    cop.create('SelectionLayer')
        .refineObject(users.timfelgentreff.jsinterpreter, {
            get InterpreterVisitor() {
                return SelectionInterpreterVisitor;
            }
        });

    var PROPERTY_ACCESSOR_NAME = 'wrappedValue';
    var PropertyAccessor = Object.subclass('whjfqggkewgdkewgfiuewgfeldigdk3v3m', {
        constructor: function(obj, propName) {
            this.selectionItems = new Set();

            this.safeOldAccessors(obj, propName);

            try {
                obj.__defineGetter__(propName, function() {
                    return this[PROPERTY_ACCESSOR_NAME];
                }.bind(this));
            } catch (e) { /* Firefox raises for Array.length *//* }
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
                .addCallback(View.current());

            return $super(node);
        },

        shouldInterpret: function(frame, fn) {
            if (this.isNative(fn)) return false;
            return typeof(fn.forInterpretation) == 'function';
        }
    });
 */

    class Operator {}
    class IdentityOperator extends Operator {
        // constructor(upstream, downstream) {
        //     super();
        //     this.downstream = downstream;
        //     upstream.downstream.push(this);
        //     upstream.now().forEach(function(item) {
        //         downstream.safeAdd(item);
        //     });
        // }
        newItemFromUpstream(item) {
            this.downstream.safeAdd(item);
        }
        destroyItemFromUpstream(item) {
            this.downstream.safeRemove(item);
        }
    }

    class FilterOperator extends IdentityOperator {
        constructor(upstream, downstream, expression, context) {
            super();
            this.expression = expression;
            this.expression.varMapping = context;

            this.selectionItems = [];

            this.upstream = upstream;
            this.downstream = downstream;
            upstream.downstream.push(this);
            upstream.now().forEach(function(item) {
                this.newItemFromUpstream(item);
            }, this);
        }
        newItemFromUpstream(item) {
            this.onNewInstance(item);
        }
        onNewInstance(item) {
            trigger(aexpr(this.expression, item))
                .onBecomeTrue(() => this.add(item))
                .onBecomeFalse(() => this.remove(item));
        }
        add(item) {
            if(this.upstream.now().indexOf(item) >= 0) {
                this.addDueToFilterExpression(item);
            }
        }
        remove(item) {
            this.removeDueToFilterExpression(item);
        }
        addDueToFilterExpression(item) {
            this.downstream.safeAdd(item);
        }
        removeDueToFilterExpression(item) {
            this.downstream.safeRemove(item);
        }
        destroyItemFromUpstream(item) {
            this.remove(item);
        }
    }

    class MapOperator extends IdentityOperator {
        constructor(upstream, downstream, mapFunction) {
            super();
            this.mapFunction = mapFunction || identity;
            this.items = [];
            this.outputItemsByItems = new Map();

            this.downstream = downstream;
            upstream.downstream.push(this);
            upstream.now().forEach(function(item) {
                this.newItemFromUpstream(item);
            }, this);
        }
        newItemFromUpstream(item) {
            var wasNewItem = pushIfMissing(this.items, item);
            if(wasNewItem) {
                var outputItem = this.mapFunction(item);
                this.outputItemsByItems.set(item, outputItem);
                this.downstream.safeAdd(outputItem);
            }
        }
        destroyItemFromUpstream(item) {
            var gotRemoved = removeIfExisting(this.items, item);
            if(gotRemoved) {
                var outputItem = this.outputItemsByItems.get(item);
                this.outputItemsByItems.delete(item);
                this.downstream.safeRemove(outputItem);
            }
        }
    }

    class UnionOperator extends IdentityOperator {
        constructor(upstream1, upstream2, downstream) {
            super();
            this.upstream1 = upstream1;
            this.upstream2 = upstream2;
            this.downstream = downstream;
            upstream1.downstream.push(this);
            upstream2.downstream.push(this);

            upstream1.now().concat(upstream2.now()).forEach(function(item) {
                this.newItemFromUpstream(item);
            }, this);
        }
        newItemFromUpstream(item) {
            var itemAlreadyExists = this.downstream.now().indexOf(item) >= 0;
            if(!itemAlreadyExists) {
                this.downstream.safeAdd(item);
            }
        }
        destroyItemFromUpstream(item) {
            var itemStillExists = this.upstream1.now().indexOf(item) >= 0 || this.upstream2.now().indexOf(item) >= 0;
            if(!itemStillExists) {
                this.downstream.safeRemove(item);
            }
        }
    }

    // TODO: make this reusable
    class FlowToFunction {
        constructor(upstream, create, destroy) {
            this.create = create;
            this.destroy = destroy;
            upstream.downstream.push(this);
        }
        newItemFromUpstream(item) {
            this.create(item);
        }
        destroyItemFromUpstream(item) {
            this.destroy(item);
        }
    }

    /**
     *
     * @class Pair
     * @classdesc This is used by the {@link View#cross} operator.
     * @property {Object} first
     * @property {Object} second
     */
    class Pair {
        constructor(first, second) {
            this.first = first;
            this.second = second;
        }
    }

    class CrossOperator {
        constructor(upstream1, upstream2, downstream) {
            this.upstream1 = upstream1;
            this.upstream2 = upstream2;
            this.downstream = downstream;

            this.trackedItems = [[], []];
            this.pairs = new Map();

            new FlowToFunction(upstream1, this.newItemFromUpstream.bind(this, 0), this.destroyItemFromUpstream.bind(this, 0));
            new FlowToFunction(upstream2, this.newItemFromUpstream.bind(this, 1), this.destroyItemFromUpstream.bind(this, 1));
            upstream1.now().forEach(this.newItemFromUpstream.bind(this, 0));
            upstream2.now().forEach(this.newItemFromUpstream.bind(this, 1));
        }
        newItemFromUpstream(index, item) {
            var wasNewItem = pushIfMissing(this.trackedItems[index], item);
            if(wasNewItem) {
                this.forEachPairWithDo(index, item, function(pair) {
                    this.downstream.safeAdd(pair);
                });
            }
        }
        destroyItemFromUpstream(index, item) {
            var gotRemoved = removeIfExisting(this.trackedItems[index], item);
            if(gotRemoved) {
                this.forEachPairWithDo(index, item, function(pair) {
                    this.downstream.safeRemove(pair);
                });
            }
        }
        forEachPairWithDo(index, item, callback) {
            var zeroes = index === 0 ? [item] : this.trackedItems[0];
            var ones = index === 1 ? [item] : this.trackedItems[1];

            zeroes.forEach(function(zeroElement) {
                ones.forEach(function(oneElement) {
                    var pair = this.getOrCreatePairForCombination(zeroElement, oneElement);
                    callback.call(this, pair);
                }, this);
            }, this);
        }
        getOrCreatePairForCombination(zero, one) {
            if(!this.pairs.has(zero)) {
                this.pairs.set(zero, new Map());
            }
            var map = this.pairs.get(zero);
            if(!map.has(one)) {
                map.set(one, new Pair(zero, one));
            }
            return map.get(one);
        }
    }

    class DelayOperator extends IdentityOperator {
        constructor(upstream, downstream, delayTime) {
            super(upstream, downstream);
            this.upstream = upstream;
            this.downstream = downstream;
            this.delayTime = delayTime;
            upstream.downstream.push(this);

            this.delays = new Map();

            upstream.now().forEach(function(item) {
                this.newItemFromUpstream(item);
            }, this);
        }
        newItemFromUpstream(item) {
            if(!this.delays.has(item)) {
                this.delays.set(item, setInterval((function() {
                    this.downstream.safeAdd(item);
                }).bind(this), this.delayTime));
            }
        }
        destroyItemFromUpstream(item) {
            this.downstream.safeRemove(item);
            if(this.delays.has(item)) {
                clearTimeout(this.delays.get(item));
                this.delays.delete(item);
            }
        }
    }

    class ReduceOperator {
        constructor(upstream, callback, reducer, initialValue) {
            this.callback = callback;
            this.reducer = reducer;
            this.initialValue = initialValue;
            this.upstream = upstream;
            upstream.downstream.push(this);

            this.newItemFromUpstream();
        }
        newItemFromUpstream() {
            this.callback(this.upstream.now().reduce(this.reducer, this.initialValue));
        }
        destroyItemFromUpstream() {
            this.newItemFromUpstream();
        }
    }

    Object.assign(View.prototype, {
        /**
         * Takes an additional filter function and returns a reactive object set. That set only contains the objects of the original set that also match the given filter function.
         * @function View#filter
         * @param {View~filterIterator} iterator
         * @return {View} The callee of this method.
         */
        filter(iterator, context) {
            var newSelection = new View();

            new FilterOperator(this, newSelection, iterator, context);

            return newSelection;
        },
        /**
         * Takes a mapping function and returns another reactive object set. That set always contains the mapped objects corresponding to the objects in the original set.
         * @function View#map
         * @param {View~mapIterator} iterator
         * @return {View} The callee of this method.
         */
        map(iterator) {
            var newSelection = new View();

            new MapOperator(this, newSelection, iterator);

            return newSelection;
        },
        /**
         * Create a new {@link View} containing all elements of the callee and the argument.
         * @function View#union
         * @param {View} otherView {@link View}
         * @return {View} Contains every object of both input Views.
         */
        union(otherView) {
            var newSelection = new View();

            new UnionOperator(this, otherView, newSelection);

            return newSelection;
        },
        /**
         * Create a new {@link View} containing all elements of the cartesian product of the callee and the argument as {@link Pair}.
         * @function View#cross
         * @param {View} otherView {@link View}
         * @return {View} Contains every combination of both input Views as two-element Array.
         */
        cross(otherView) {
            var newSelection = new View();

            new CrossOperator(this, otherView, newSelection);

            return newSelection;
        },

        /**
         * Delays the propagation of items of the callee.
         * Items are propagated to the returned {@link View} in {@link View#delay.delayTime} milliseconds,
         * if they are not removed from the callee before the timeout.
         * @function View#delay
         * @param {Number} delayTime - the time to delay given in milliSeconds.
         * @returns {View}
         */
        delay(delayTime) {
            var newSelection = new View();

            new DelayOperator(this, newSelection, delayTime);

            return newSelection;
        },

        /**
         * Whenever the callee is modified, this calls the given callback with the reduced value.
         * @function View#reduce
         * @param {View~reduceCallback} callback
         * @param {View~reducer} reducer
         * @param initialValue - the initial value passed to the {@View~reducer}.
         * @returns {View} the callee
         */
        reduce(callback, reducer, initialValue) {
            new ReduceOperator(this, callback, reducer, initialValue);

            return this;
        }
    });

    /**
     * The callback function called to determine whether an Object is in the derived {@link View}.
     * @callback View~filterIterator
     * @param {Object} item - item from the original {@link View}.
     * @return {Boolean}
     */

    /**
     * The callback that computes the item to be added to the mapped {@link View}.
     * @callback View~mapIterator
     * @param {Object} item - item from the original {@link View}.
     * @return {Object} mapped item
     */

    /**
     * The callback that is invoked when the {@link View} changes.
     * @callback View~reduceCallback
     */

    /**
     * The callback that computes the aggregation of the modified {@link View}.
     * @callback View~reducer
     * @param {Object} accumulator
     * @param {Object} item
     * @return {Object}
     */

    View.stack = new Stack();
    View.current = function() { return View.stack.top(); };
    View.withOnStack = function(el, callback, context) {
        View.stack.push(el);
        try {
            callback.call(context);
        } finally {
            View.stack.pop();
        }
    };

    class SelectionItem {
        constructor(selection, item, callback) {
            this.selection = selection;
            this.item = item;
            this.callback = callback;

            this.propertyAccessors = new Set();
        }

        installListeners() {
            var item = this.item;
            View.withOnStack(this, function() {
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

    /**
     * @function select
     * @param {Class} Class
     * @param {predicate} predicate
     * @return {View}
     */
    export default function select(Class, predicate, context) {
        var newSelection = new View();

        new FilterOperator(Class._instances_, newSelection, predicate, context);

        return newSelection;
    }

    /**
     * This callback to determine whether an item should be part of the resulting {@link View}.
     * @callback predicate
     * @param {Object} item
     * @return {Boolean}
     */
