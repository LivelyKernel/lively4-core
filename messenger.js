/*global clearTimeout, setTimeout*/

;(function(exports) {
"use strict";

var arr = exports.arr;
if (!arr) throw new Error("message.js needs collection.js!")

var fun = exports.fun;
if (!fun) throw new Error("message.js needs function.js!")

var string = exports.string;
if (!string) throw new Error("message.js needs string.js!")

var message = exports.message = {
  
  makeMessenger: function(spec) {

    var expectedMethods = [
      {name: "send", args: ['msg', 'callback']},
      {name: "listen", args: ['callback']},
      {name: "isOnline", args: []}
    ];
    expectedMethods.forEach(function(exp) {
      if (spec[exp.name]) return;
        var msg = "message implementation needs function "
                + exp.name + "(" + (exp.args.join(',')) + ")";
        throw new Error(msg);
    });

    var messenger = {

      _outgoing: [],
      _id: spec.id || string.newUUID(),
      _whenOnlineCallbacks: [],
      _whenOnlineCallbackWaitProc: null,

      // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
      _runWhenOnlineCallbacks: function() {
        var cbs = arr.clone(messenger._whenOnlineCallbacks);
        messenger._whenOnlineCallbacks = [];
        cbs.forEach(function(ea) {
          try { ea.call(null, null, messenger); } catch (e) {
            console.error("error in _runWhenOnlineCallbacks: %s", e);
          }
        });
      },

      _ensureToWaitForWhenOnlineCallbacks: function() {
        if (messenger._whenOnlineCallbackWaitProc) return;
        messenger._whenOnlineCallbackWaitProc = setInterval(function() {
          if (!messenger.isOnline()) return;
          clearInterval(messenger._whenOnlineCallbackWaitProc);
          messenger._whenOnlineCallbackWaitProc = null;
          messenger._runWhenOnlineCallbacks();
        }, 20);
      },
      
      // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-

      id: function() { return messenger._id; },

      isOnline: function() { return spec.isOnline(); },

      listen: function(thenDo) {
        return spec.listen(function(err) { thenDo && thenDo(err); });
      },

      send: function(msg, thenDo) {
        if (!messenger.isOnline()) {
          messenger.whenOnline(function() { messenger.send(msg, thenDo); });
          // var err = new Error("Messenger " + messenger.id() + " not online");
          // if (thenDo) thenDo(err);
          // else throw err;
          return;
        }
        messenger._outgoing.push(msg);
        spec.send(msg, function(err) {
          err && console.error(err);
          arr.remove(messenger._outgoing, msg);
          thenDo && thenDo(err);
        });
        return messenger;
      },

      whenOnline: function(thenDo) {
        messenger._whenOnlineCallbacks.push(thenDo);
        if (messenger.isOnline()) messenger._runWhenOnlineCallbacks();
        else messenger._ensureToWaitForWhenOnlineCallbacks();
      },

      pendingOut: function() {
        return Array.prototype.slice.call(messenger._outgoing);
      }

    }

    return messenger;
  }

};

})(typeof jsext !== 'undefined' ? jsext : this);