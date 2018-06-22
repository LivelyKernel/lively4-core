export { default as View} from './view.js';
import View from './view.js';
import { pushIfMissing, removeIfExisting, Stack, isPrimitive, identity } from './utils.js';
import { BaseActiveExpression } from "active-expressions";
import aexpr from 'aexpr-source-transformation-propagation';
import { withAdvice } from './../lib/flight/advice.js';
import * as cop  from "src/client/ContextJS/src/contextjs.js";
import { PausableLoop } from 'utils';

// TODO: this is use to keep SystemJS from messing up scoping
// (FilterOperation would not be defined in select)
const HACK = {};

/**
 * #TODO: this is from withlogging.js
 */
// #TODO: can we make this easier, e.g. automatically identifying the class to adapt from the very instance? What about superclasses?
export function trackInstance(instance) {
  ensureBaseViewForClass(this);
  this._instances_.safeAdd(instance);
}

export function untrackInstance(instance) {
  ensureBaseViewForClass(this);
  this._instances_.safeRemove(instance);
}

function ensureBaseViewForClass(Class) {
  Class._instances_ = Class._instances_ || new View();
}

// #TODO: ideally, we would track the constructor, maybe with **decorators**?
// #TODO: unused, maybe use cop instead of a functional mixin
// #TODO: use cop here
export function trackInitializeAndDestroy(Class) {
  withAdvice.call(Class.prototype);

  Class.prototype.after('initialize', function() {
    trackInstance.call(Class, this);
  });
  Class.prototype.before('destroy', function() {
    untrackInstance.call(Class, this);
  });
}

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
  constructor(upstream, downstream, expression) {
    super();
    this.expression = expression;

    this.selectionItems = [];

    this.upstream = upstream;
    this.downstream = downstream;
    upstream.downstream.push(this);
    upstream.now().forEach(item => this.newItemFromUpstream(item));
  }
  newItemFromUpstream(item) {
    this.onNewInstance(item);
  }
  onNewInstance(item) {
    aexpr(this.expression, item)
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
    upstream.now().forEach(item => this.newItemFromUpstream(item));
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

// #TODO: allow for more than 2 upstreams to merge
class UnionOperator extends IdentityOperator {
  constructor(downstream, upstream1, upstream2) {
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
    var itemAlreadyExists = this.downstream.now().includes(item);
    if(!itemAlreadyExists) {
      this.downstream.safeAdd(item);
    }
  }
  destroyItemFromUpstream(item) {
    var itemStillExists = this.upstream1.now().includes(item) || this.upstream2.now().includes(item);
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
            this.delays.set(item, setInterval(
              () => this.downstream.safeAdd(item),
              this.delayTime));
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
    constructor(upstream, reducer, initialValue) {
        this.upstream = upstream;
        upstream.downstream.push(this);
        this.aexpr = new BaseActiveExpression(() =>
          this.upstream.now().reduce(reducer, initialValue)
        );
    }
    newItemFromUpstream() {
        this.aexpr.checkAndNotify();
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

        new UnionOperator(newSelection, this, otherView);

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
     * Whenever the callee is modified, the returned Active Expression gets notified.
     * @function View#reduce
     * @param {View~reducer} reducer
     * @param initialValue - the initial value passed to the {@View~reducer}.
     * @returns {ActiveExpression} changing with the callee
     */
    reduce(reducer, initialValue) {
        const reduce = new ReduceOperator(this, reducer, initialValue);

        return reduce.aexpr;
    }
});

/**
 * The callback function to determine whether an Object should be part of the resulting derived {@link View}.
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

/**
 * ################## CSS SELECTORS ##################
 */
const selectorByAnimationName = new Map();
const selectors = {};
let animationCount = 0;
const styles = document.createElement('style');
const keyframes = document.createElement('style');
const head = document.getElementsByTagName('head')[0];
const startName = 'animationstart';
const startEvent = function(event) {
  event.selector = selectorByAnimationName.get(event.animationName);
  ((startListenerByRoot.get(this) || {})[event.animationName] || []).forEach(fn => {
    fn.call(this, event);
  });
};
const roots = new Set();
const startListenerByRoot = new Map();

styles.type = keyframes.type = 'text/css';
head.appendChild(styles);
head.appendChild(keyframes);

function addSelectorListener(root, selector, fn) {
  var key = selectors[selector];
  if(!startListenerByRoot.has(root)) {
    startListenerByRoot.set(root, {});
  }
  var listeners = startListenerByRoot.get(root);

  if (!key) {
    key = selectors[selector] = 'SelectorListener-' + animationCount++ + '-' + selector.replace(/[^0-9a-zA-Z]/gi, '');
    let node = document.createTextNode(`@keyframes ${key} {
  from { outline-color: #fff; }
  to { outline-color: #000; }
}`);
    keyframes.appendChild(node);
    styles.sheet.insertRule(`${selector} {
  animation-duration: 0.001s;
  animation-name: ${key} !important;
}`, 0);
    selectorByAnimationName.set(key, selector);
  }

  if(!roots.has(root)) {
    roots.add(root);
    root.addEventListener(startName, startEvent, false);
  }

  (listeners[key] = listeners[key] || []).push(fn);
}

/**
 * chrome does not support the animationcancel event, so we have to resort back to other means, namely polling
 */
const stopMatchingDetectors = new Set();

function removeObsoleteListeners() {
  Array.from(stopMatchingDetectors).forEach(detector => {
    if(!detector.matchesSelector()) {
      detector.removeElement();
      stopMatchingDetectors.delete(detector);
    }
  });
  if(stopMatchingDetectors.size === 0) {
    stopMatchingLoop.pause();
  }
}

const stopMatchingLoop = new PausableLoop(() => {
  lively.warn('check stop matching');
  removeObsoleteListeners();
});

function trackSelector(selector, { root = document }) {
  const view = new View();
  addSelectorListener(root, selector, event => {
    const element = event.target;
    view.safeAdd(element);
    
    stopMatchingDetectors.add({
      matchesSelector() {
        const inDOM = element.getRootNode({ composed: true }) === document;
        return inDOM && element.matches(selector);
      },
      removeElement() { view.safeRemove(element); }
    });
    stopMatchingLoop.ensureRunning();
  });
  return view;
}

export function __unload__() {
  styles.remove();
  keyframes.remove();
  roots.forEach(root => root.removeEventListener(startName, startEvent, false));
  
  stopMatchingLoop.pause();
}

/**
 * @function select
 * @param {Class} Class
 * @return {View}
 */
export default function select(Class, options) {
  // css selector given?
  if(typeof Class === 'string') {
    return trackSelector(Class, options || {})
  }

  // fall back to track all instances of a class
  ensureBaseViewForClass(Class);
  return Class._instances_;
}
