define(function module(require) { "use strict"

  var withAdvice = require('./../lib/flight/advice').withAdvice;

  var pushIfMissing = require('./utils').pushIfMissing;
  var removeIfExisting = require('./utils').removeIfExisting;

  var BaseSet = Object.subclass('BaseSet', {
    initialize: function() {
      this.items = [];
      this.downstream = [];
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
        this.downstream.forEach(function(ea) { ea.newItemFromUpstream(item); });
      }
    },
    safeRemove: function(item) {
      var gotRemoved = removeIfExisting(this.items, item);
      if(gotRemoved) {
        console.log('removed from selection', item);
        this.downstream.forEach(function(ea) { ea.destroyItemFromUpstream(item); });
      }
    },
    /**
     *  Get persistent version of the current state of the Selection.
     */
    now: function() {
      return this.items.slice();
    }
  });

  return BaseSet;
});
