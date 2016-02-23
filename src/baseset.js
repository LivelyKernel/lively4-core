define(function module(require) { "use strict";

  var pushIfMissing = require('./utils').pushIfMissing;
  var removeIfExisting = require('./utils').removeIfExisting;
  var identity = require('./utils').identity;

  var BaseSet = Object.subclass('BaseSet', {
    initialize: function() {
      this.items = [];
      this.downstream = [];
      this.enterCallbacks = [];
      this.exitCallbacks = [];

      this.layersByItem = new Map();
    },

    // explicitly adding or removing objects to the set
    addToBaseSet: function(item) {
      return this.safeAdd(item);
    },
    removeFromBaseSet: function(item) {
      return this.safeRemove(item);
    },

    safeAdd: function(item) {
      var wasNewItem = pushIfMissing(this.items, item);
      if(wasNewItem) {
        console.log('added to selection', item);
        this.enterCallbacks.forEach(function(enterCallback) { enterCallback(item); });
        this.downstream.forEach(function(ea) { ea.newItemFromUpstream(item); });
      }
    },
    safeRemove: function(item) {
      var gotRemoved = removeIfExisting(this.items, item);
      if(gotRemoved) {
        console.log('removed from selection', item);
        this.exitCallbacks.forEach(function(exitCallback) { exitCallback(item); });
        this.downstream.forEach(function(ea) { ea.destroyItemFromUpstream(item); });
      }
    },
    /**
     *  Get persistent version of the current state of the Selection.
     */
    now: function() {
      var arr = [];
      this.items.forEach(function(item) {
        arr.push(item);
      });

      return arr;
    },
    size: function() { return this.now().length; },
    /**
     *  Specify callbacks that are executed everytime an object is added/removed from the set
     */
    enter: function(callback) {
        this.enterCallbacks.push(callback);
        this.now().forEach(function(item) {  callback(item); });

        return this;
    },
    exit: function(callback) {
        this.exitCallbacks.push(callback);

        return this;
    },
    /**
     * Define partial behavior attached to each object while it is contained in the set.
     * @param partialBehavior
     * @returns {BaseSet} The callee of this method. This is done for method chaining.
     */
    // TODO: is this currently limited to 1 layer per item-view combination?
    layer: function(partialBehavior) {
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
  });

  return BaseSet;
});
