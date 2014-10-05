/*global clearTimeout, setTimeout, clearInterval, setInterval*/

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
      {name: "close", args: ['callback']},
      {name: "isOnline", args: []}
    ];
    expectedMethods.forEach(function(exp) {
      if (spec[exp.name]) return;
        var msg = "message implementation needs function "
                + exp.name + "(" + (exp.args.join(',')) + ")";
        throw new Error(msg);
    });

    var heartbeatInterval = spec.sendHeartbeat && (spec.heartbeatInterval || 1000);

    var messenger = {

      _outgoing: [],
      _inflight: [],
      _id: spec.id || string.newUUID(),
      _whenOnlineCallbacks: [],
      _statusWatcherProc: null,
      _startHeartbeatProcessProc: null,
      _listenInProgress: null,
      _heartbeatInterval: heartbeatInterval,
      _status: 'OFFLINE',

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

      _ensureStatusWatcher: function() {
        if (messenger._statusWatcherProc) return;
        messenger._statusWatcherProc = setInterval(function() {
          if (messenger.isOnline() && messenger._whenOnlineCallbacks.length)
            messenger._runWhenOnlineCallbacks();
          var prevStatus = messenger._status;
          messenger._status = messenger.isOnline() ? 'ONLINE' : 'OFFLINE';
          if (messenger._status !== 'ONLINE' && messenger._statusWatcherProc) {
            messenger.reconnect();
          }
          if (messenger._status !== prevStatus && messenger.onStatusChange) {
            messenger.onStatusChange();
          }
        }, 20);
      },

      _queueSend: function(msg, whenSendFunc) {
        messenger._outgoing.push([msg, whenSendFunc]);
      },

      _deliverMessageQueue: function() {
        if (!spec.allowConcurrentSends && messenger._inflight.length) return;
        if (!messenger.isOnline()) {
          messenger.whenOnline(function() { messenger._deliverMessageQueue(); });
          return;
        }

        var queued = messenger._outgoing.shift();
        if (!queued) return;

        messenger._inflight.push(queued);
        var msg = queued[0], callback = fun.once(queued[1]);

        spec.send(msg, function(err) {
          err && console.error(err);
          arr.remove(messenger._inflight, queued);
          callback && callback(err, msg);
          messenger._deliverMessageQueue();
        });

        if (spec.allowConcurrentSends && messenger._outgoing.length)
          messenger._deliverMessageQueue();
        
        if (typeof spec.sendTimeout === 'number') {
          setTimeout(function() {
            if (!messenger._inflight.indexOf(queued) === -1) return;
            arr.remove(messenger._inflight, queued);
            var errMsg = 'Timeout sending message';
            console.error(errMsg);
            var err = new Error(errMsg)
            callback && callback(err, msg);
            messenger._deliverMessageQueue();
          }, spec.sendTimeout);
        }
      },

      _startHeartbeatProcess: function() {
        if (messenger._startHeartbeatProcessProc) return;
        messenger._startHeartbeatProcessProc = setTimeout(function() {
          spec.sendHeartbeat(function(err, result) {
            messenger._startHeartbeatProcessProc = null;
            messenger._startHeartbeatProcess();
          })
        }, messenger._heartbeatInterval);
      },

      // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-

      id: function() { return messenger._id; },

      isOnline: function() { return spec.isOnline(); },

      heartbeatEnabled: function() {
        return typeof messenger._heartbeatInterval === 'number';
      },

      listen: function(thenDo) {
        if (messenger._listenInProgress) return;
        messenger._listenInProgress = true;
        messenger._ensureStatusWatcher();
        return spec.listen(function(err) {
          messenger._listenInProgress = null;
          thenDo && thenDo(err);
          if (messenger.heartbeatEnabled())
            messenger._startHeartbeatProcess();
        });
      },

      reconnect: function() {
        if (messenger._status === 'ONLINE') return;
        messenger.listen();
      },

      send: function(msg, whenSendFunc) {
        messenger._queueSend(msg, whenSendFunc);
        messenger._deliverMessageQueue();
        return messenger;
      },

      close: function(thenDo) {
        clearInterval(messenger._statusWatcherProc);
        messenger._statusWatcherProc = null;
        spec.close(function(err) {
          messenger._status = 'OFFLINE';
          thenDo && thenDo(err);
        });
      },

      whenOnline: function(thenDo) {
        messenger._whenOnlineCallbacks.push(thenDo);
        if (messenger.isOnline()) messenger._runWhenOnlineCallbacks();
      },

      outgoingMessages: function() {
        return arr.pluck(messenger._inflight.concat(messenger._outgoing), 0);
      },

      status: function() { return messenger._status; }

    }

    return messenger;
  }

};

})(typeof jsext !== 'undefined' ? jsext : this);