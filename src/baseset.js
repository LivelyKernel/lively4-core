define(function module(require) { "use strict"

  var pushIfMissing = require('./utils').pushIfMissing;
  var removeIfExisting = require('./utils').removeIfExisting;

  var BaseSet = Object.subclass('BaseSet', {
    initialize: function() {
      this.items = [];
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
      return this.items.slice();
    },
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
