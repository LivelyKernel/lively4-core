define(function module(require) { "use strict";

  var pushIfMissing = require('./utils').pushIfMissing;
  var removeIfExisting = require('./utils').removeIfExisting;
  var identity = require('./utils').identity;

  var BaseSet = Object.subclass('BaseSet', {
    initialize: function(mapFunction) {
      this.mapFunction = mapFunction || identity;
      this.items = [];
      this.outputItemsByItems = new Map();
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
        var outputItem = this.mapFunction(item);
        this.outputItemsByItems.set(item, outputItem);
        console.log('added to selection', outputItem);
        this.enterCallbacks.forEach(function(enterCallback) { enterCallback(outputItem); });
        this.downstream.forEach(function(ea) { ea.newItemFromUpstream(outputItem); });
      }
    },
    safeRemove: function(item) {
      var gotRemoved = removeIfExisting(this.items, item);
      if(gotRemoved) {
        var outputItem = this.outputItemsByItems.get(item);
        this.outputItemsByItems.delete(item);
        console.log('removed from selection', outputItem);
        this.exitCallbacks.forEach(function(exitCallback) { exitCallback(outputItem); });
        this.downstream.forEach(function(ea) { ea.destroyItemFromUpstream(outputItem); });
      }
    },
    /**
     *  Get persistent version of the current state of the Selection.
     */
    now: function() {
      var arr = [];
      this.outputItemsByItems.forEach(function(outputItems) {
        arr.push(outputItems);
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
