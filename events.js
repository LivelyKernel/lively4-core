/*global process, jsext, require*/

;(function(exports) {
"use strict";

var isNode = typeof process !== 'undefined' && process.versions && process.versions.node;

var events = exports.events = {

  makeEmitter: isNode ? function(obj) {
    if (obj.on && obj.removeListener) return obj;
    var events = require("events");
    require("util")._extend(obj, events.EventEmitter.prototype);
    events.EventEmitter.call(obj);
    return obj;
  } : function(obj) {
    if (obj.on && obj.removeListener) return obj;

    obj.listeners = {};

    obj.on = function(type, handler) {
      if (!obj.listeners[type]) obj.listeners[type] = [];
      obj.listeners[type].push(handler);
    }

    obj.once = function(type, handler) {
      function onceHandler(/*args*/) {
        obj.removeListener(type, onceHandler);
        handler.apply(this, arguments);
      }
      obj.on(type, onceHandler);
    }

    obj.removeListener = function(type, handler) {
      if (!obj.listeners[type]) return;
      obj.listeners[type] = obj.listeners[type].filter(function(h) {
        return h !== handler; });
    }

    obj.removeAllListeners = function(type) {
      if (!obj.listeners[type]) return;
      obj.listeners[type] = [];
    }

    obj.emit = function(/*type and args*/) {
      var args = Array.prototype.slice.call(arguments);
      var type = args.shift();
      var handlers = obj.listeners[type];
      if (!handlers || !handlers.length) return;
      handlers.forEach(function(handler) {
        try { handler.apply(null, args) } catch (e) {
          console.error("Error in event handler: %s", e.stack || String(e));
        }
      });
    }

    return obj;
  }
};

})(typeof jsext !== 'undefined' ? jsext : require('./base').jsext);

