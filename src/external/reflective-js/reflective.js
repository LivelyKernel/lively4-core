const baseSets = new Map();

function baseSetAdd(instance, cls) {
  if(!baseSets.has(cls)) {
    baseSets.set(cls, new Group());
  }
  let group = baseSets.get(cls);
  group.safeAdd(instance);
}

export function hookNewExpression(cls, ...args) {
  const instance = new cls(...args);
  baseSetAdd(instance, cls);
  return instance;
}

export class Stack {
  constructor() {
    this.arr = [];
  }

  push(el) {
    this.arr.push(el);
  }

  pop() {
    this.arr.length--;
  }

  top() {
    return this.arr.last();
  }
}

export function identity(x) { return x; }

class Group {
  constructor() {
    this.items = new Set();
    this.downstream = [];
    this.enterCallbacks = [];
    this.exitCallbacks = [];

    this.layersByItem = new Map();
  }

  safeAdd(item) {
    if(!(this.items.has(item))) {
      this.items.add(item);
      //console.log('added to selection', item);
      this.enterCallbacks.forEach(function(enterCallback) { enterCallback(item); });
      this.downstream.forEach(function(ea) { ea.newItemFromUpstream(item); });
    }
  }

  safeRemove(item) {
    if(this.items.has(item)) {
      this.items.delete(item);
      //console.log('removed from selection', item);
      this.exitCallbacks.forEach(function(exitCallback) { exitCallback(item); });
      this.downstream.forEach(function(ea) { ea.destroyItemFromUpstream(item); });
    }
  }

  now() {
    return Array.from(this.items);
  }

  size() { return this.now().length; }

  has(item) {
    return this.items.has(item);
  }

  enter(callback) {
    this.enterCallbacks.push(callback);
    this.now().forEach(function(item) {  callback(item); });

    return this;
  }

  exit(callback) {
    this.exitCallbacks.push(callback);

    return this;
  }
  
  filter(iterator, context) {
    var newSelection = new Group();
  
    new FilterOperator(this, newSelection, iterator, context);
  
    return newSelection;
  }
  
  map(iterator) {
    var newSelection = new Group();
  
    new MapOperator(this, newSelection, iterator);
  
    return newSelection;
  }
  
  union(otherView) {
    var newSelection = new Group();
  
    new UnionOperator(this, otherView, newSelection);
  
    return newSelection;
  }
  
  cross(otherView) {
    var newSelection = new Group();
  
    new CrossOperator(this, otherView, newSelection);
  
    return newSelection;
  }
  
  delay(delayTime) {
    var newSelection = new Group();
  
    new DelayOperator(this, newSelection, delayTime);
  
    return newSelection;
  }
  
  reduce(callback, reducer, initialValue) {
    new ReduceOperator(this, callback, reducer, initialValue);
  
    return this;
  }

  layer(partialBehavior) {
    var layersByItem = this.layersByItem;

    this.enter(function(item) {
      // lazy initialization
      if(!layersByItem.has(item)) {
        layersByItem.set(item, new Layer().refineObject(item, partialBehavior));
      }

      var layerForItem = layersByItem.get(item);
      if(!layerForItem.isGlobal()) {
        layerForItem.beGlobal();
      }
    });

    this.exit(function(item) {
      var layerForItem = layersByItem.get(item);
      if(layerForItem && layerForItem.isGlobal()) {
        layerForItem.beNotGlobal();
      }
    });

    return this;
  }
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
    this.onNewInstance(item, this.expression.varMapping);
  }
  onNewInstance(item, context) {
    // TODO: use aexprs here
    /*new ExpressionObserver(
      this.expression,
      context,
      item,
      () => this.conditionChanged(item)
    );*/
  
    if(this.expression(item)) {
      this.add(item);
    }
  }
  conditionChanged(item) {
    if(this.expression(item))
      this.add(item);
    else
      this.remove(item);
  }
  add(item) {
    if(this.upstream.now().indexOf(item) >= 0) {
      this.downstream.safeAdd(item);
    }
  }
  remove(item) {
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
    this.items = new Set();
    this.outputItemsByItems = new Map();
  
    this.downstream = downstream;
    upstream.downstream.push(this);
    upstream.now().forEach(item => this.newItemFromUpstream(item));
  }
  newItemFromUpstream(item) {
    if(!this.items.has(item)) {
      this.items.add(item);
      var outputItem = this.mapFunction(item);
      this.outputItemsByItems.set(item, outputItem);
      this.downstream.safeAdd(outputItem);
    }
  }
  destroyItemFromUpstream(item) {
    if(this.items.has(item)) {
      this.items.delete(item);
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
    if(!this.downstream.has(item)) {
      this.downstream.safeAdd(item);
    }
  }
  destroyItemFromUpstream(item) {
    var itemStillExists = this.upstream1.has(item) || this.upstream2.has(item);
    if(!itemStillExists) {
      this.downstream.safeRemove(item);
    }
  }
}

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
  
    this.trackedItems = [new Set(), new Set()];
    this.pairs = new Map();
  
    new FlowToFunction(upstream1, this.newItemFromUpstream.bind(this, 0), this.destroyItemFromUpstream.bind(this, 0));
    new FlowToFunction(upstream2, this.newItemFromUpstream.bind(this, 1), this.destroyItemFromUpstream.bind(this, 1));
    upstream1.now().forEach(this.newItemFromUpstream.bind(this, 0));
    upstream2.now().forEach(this.newItemFromUpstream.bind(this, 1));
  }
  newItemFromUpstream(index, item) {
    let items = this.trackedItems[index];
    if(!items.has(item)) {
      items.add(item);
        this.forEachPairWithDo(index, item, function(pair) {
          this.downstream.safeAdd(pair);
        });
    }
  }
  destroyItemFromUpstream(index, item) {
    let items = this.trackedItems[index];
    if(items.has(item)) {
      items.delete(item);
      this.forEachPairWithDo(index, item, function(pair) {
        this.downstream.safeRemove(pair);
      });
    }
  }
  forEachPairWithDo(index, item, callback) {
    var zeroes = index === 0 ? [item] : this.trackedItems[0];
    var ones = index === 1 ? [item] : this.trackedItems[1];
  
    zeroes.forEach(zeroElement => {
      ones.forEach(oneElement => {
        var pair = this.getOrCreatePairForCombination(zeroElement, oneElement);
        callback.call(this, pair);
      });
    });
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

Object.assign(Group.prototype, {});

Group.stack = new Stack();
Group.current = function() { return Group.stack.top(); };
Group.withOnStack = function(el, callback, context) {
  Group.stack.push(el);
  try {
    callback.call(context);
  } finally {
    Group.stack.pop();
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
    Group.withOnStack(this, function() {
      cop.withLayers([SelectionLayer], () => {
        this.expression.forInterpretation().apply(null, [item]);
      });
    }, this.selection);
  }
  
  removeListeners() {
    this.propertyAccessors.forEach(propertyAccessor => {
      propertyAccessor.selectionItems.delete(this);
    });
    this.propertyAccessors.clear();
  }
}

export function select(cls, expression, context) {
  let newSelection = new Group();
  new FilterOperator(baseSelect(cls), newSelection, expression, context);
  return newSelection;
}

// TODO: treat strings as query-selectors
export function baseSelect(cls) {
  if(!baseSets.has(cls)) {
    baseSets.set(cls, new Group());
  }
  return baseSets.get(cls);
}
