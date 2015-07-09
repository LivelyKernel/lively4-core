define(function module(require) { "use strict"

  var pushIfMissing = require('./utils').pushIfMissing;
  var removeIfExisting = require('./utils').removeIfExisting;

  var BaseSet = Object.subclass('BaseSet', {
    initialize: function(mapFunction) {
      this.mapFunction = mapFunction || function identity(x) { return x; };
      this.items = [];
      this.outputItemsByItems = new Map();
      this.downstream = [];
      this.enterCallbacks = [];
      this.exitCallbacks = [];
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
    }
  });

  return BaseSet;
});
