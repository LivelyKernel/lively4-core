import { pushIfMissing, removeIfExisting, identity } from './utils.js';

/**
 *
 * @class View
 * @classdesc This is the class representing a view.
 */
export default class View {
  constructor() {
    this.items = [];
    this.downstream = [];
    this.enterCallbacks = [];
    this.exitCallbacks = [];

    this.layersByItem = new Map();
  }

  safeAdd(item) {
    var wasNewItem = pushIfMissing(this.items, item);
    if(wasNewItem) {
      console.log('added to selection', item);
      this.enterCallbacks.forEach(function(enterCallback) { enterCallback(item); });
      this.downstream.forEach(function(ea) { ea.newItemFromUpstream(item); });
    }
  }

  safeRemove(item) {
    var gotRemoved = removeIfExisting(this.items, item);
    if(gotRemoved) {
      console.log('removed from selection', item);
      this.exitCallbacks.forEach(function(exitCallback) { exitCallback(item); });
      this.downstream.forEach(function(ea) { ea.destroyItemFromUpstream(item); });
    }
  }

  // Get persistent version of the current state of the Selection.
  /**
   * Returns an Array of the objects that are currently in the set. This Array does not update automatically.
   * @function View#now
   * @return {Array}
   */
  now() {
    var arr = [];
    this.items.forEach(function(item) {
      arr.push(item);
    });

    return arr;
  }

  /**
   * Returns the current number of objects the set contains.
   * @function View#size
   * @return {Number}
   */
  size() { return this.now().length; }

  /**
   * Takes a callback that consumes a single parameter. This callback is called whenever an object is added to the reactive set with that very object.
   * @function View#enter
   * @param {View~enterCallback} callback - this is executed everytime an object is added to the set
   * @return {View} The callee of this method.
   */
  enter(callback) {
    this.enterCallbacks.push(callback);
    this.now().forEach(function(item) {  callback(item); });

    return this;
  }

  /**
   * Similar to \texttt{enter}, but the callback is called everytime an object is removed from the set.
   * @function View#exit
   * @param {View~exitCallback} callback
   * @return {View} The callee of this method.
   */
  exit(callback) {
    this.exitCallbacks.push(callback);

    return this;
  }

  /**
   * Define partial behavior attached to each object while it is contained in the set.
   * @function View#layer
   * @param {Object} partialBehavior - the mixin to be applied.
   * @returns {View} The callee of this method.
   */
  // TODO: is this currently limited to 1 layer per item-view combination?
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

/**
 * This callback is call whenever an item is added to this {@link View}.
 * @callback View~enterCallback
 * @param {Object} item - the item that was just added to the {@link View}.
 */

/**
 * This callback is call whenever an item is removed from this {@link View}.
 * @callback View~exitCallback
 * @param {Object} item - the item that was just removed from the {@link View}.
 */
