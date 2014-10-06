/*global clearTimeout, setTimeout, clearInterval, setInterval*/

;(function(exports) {
"use strict";

var arr = exports.arr;
if (!arr) throw new Error("messenger.js needs collection.js!")

var fun = exports.fun;
if (!fun) throw new Error("messenger.js needs function.js!")

var string = exports.string;
if (!string) throw new Error("messenger.js needs string.js!")

var events = exports.events;
if (!events) throw new Error("messenger.js needs events.js!")

var OFFLINE = 'offline';
var ONLINE = 'online';
var CONNECTING = 'connecting';

var message = exports.message = {
  
  OFFLINE: OFFLINE,
  ONLINE: ONLINE,
  CONNECTING: CONNECTING,

  makeMessenger: function(spec) {

    var expectedMethods = [
      {name: "send", args: ['msg', 'callback']},
      {name: "listen", args: ['messenger', 'callback']},
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
      _messageCounter: 0,
      _messageResponseCallbacks: {},
      _whenOnlineCallbacks: [],
      _statusWatcherProc: null,
      _startHeartbeatProcessProc: null,
      _listenInProgress: null,
      _heartbeatInterval: heartbeatInterval,
      _status: OFFLINE,

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
          messenger._status = messenger.isOnline() ? ONLINE : OFFLINE;
          if (messenger._status !== ONLINE && messenger._statusWatcherProc) {
            messenger.reconnect();
          }
          if (messenger._status !== prevStatus && messenger.onStatusChange) {
            messenger.onStatusChange();
          }
        }, 20);
      },

      _addMissingData: function(msg) {
        if (!msg.messageId) msg.messageId = string.newUUID();
        msg.sender = messenger.id();
        msg.messageIndex = messenger._messageCounter++;
        return msg;
      },

      _queueSend: function(msg, onReceiveFunc) {
        if (onReceiveFunc && typeof onReceiveFunc !== 'function')
          throw new Error("Expecing a when send callback, got: " + onReceiveFunc);
        messenger._outgoing.push([msg, onReceiveFunc]);
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
        if (messenger.isOnline()) deliver(queued);
        else messenger.whenOnline(function() { deliver(queued); });
        startTimeoutProc(queued);

        if (spec.allowConcurrentSends && messenger._outgoing.length)
          messenger._deliverMessageQueue();

        // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-

        function deliver(queued) {
          if (messenger._inflight.indexOf(queued) === -1) return; // timed out
          var msg = queued[0], callback = queued[1];
          if (callback)
            messenger._messageResponseCallbacks[msg.messageId] = callback;

          spec.send(msg, function(err) {
            arr.remove(messenger._inflight, queued);
            if (err) onSendError(err, queued);
            messenger._deliverMessageQueue();
          });
        }

        function startTimeoutProc(queued) {
          if (typeof spec.sendTimeout !== 'number') return;
          setTimeout(function() {
            if (messenger._inflight.indexOf(queued) === -1) return; // delivered
            arr.remove(messenger._inflight, queued);
            onSendError(new Error('Timeout sending message'), queued);
            messenger._deliverMessageQueue();
          }, spec.sendTimeout);
        }

        function onSendError(err, queued) {
          var msg = queued[0], callback = queued[1];
          delete messenger._messageResponseCallbacks[msg.messageId];
          console.error(err);
          callback && callback(err);
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
        return spec.listen(messenger, function(err) {
          messenger._listenInProgress = null;
          thenDo && thenDo(err);
          if (messenger.heartbeatEnabled())
            messenger._startHeartbeatProcess();
        });
        return messenger;
      },

      reconnect: function() {
        if (messenger._status === ONLINE) return;
        messenger.listen();
        return messenger;
      },

      send: function(msg, onReceiveFunc) {
        messenger._addMissingData(msg);
        messenger._queueSend(msg, onReceiveFunc);
        messenger._deliverMessageQueue();
        return msg;
      },

      onMessage: function(msg) {
        var cb = msg.inResponseTo && messenger._messageResponseCallbacks[msg.inResponseTo];
        if (cb && !msg.expectMoreResponses) delete messenger._messageResponseCallbacks[msg.inResponseTo];
        if (cb) cb(null, msg);
        console.log("%s got message", messenger.id());
        messenger.emit("message", msg);
      },

      answer: function(msg, data, expectMore, whenSend) {
        if (typeof expectMore === 'function') {
          whenSend = expectMore; expectMore = false; }
        var answer = {
          target: msg.sender,
          action: msg.action + 'Result',
          inResponseTo: msg.messageId,
          data: data};
        if (expectMore) answer.expectMoreResponses = true;
        debugger;
        return messenger.send(answer, whenSend);
      },

      close: function(thenDo) {
        clearInterval(messenger._statusWatcherProc);
        messenger._statusWatcherProc = null;
        spec.close(function(err) {
          messenger._status = OFFLINE;
          thenDo && thenDo(err);
        });
        return messenger;
      },

      whenOnline: function(thenDo) {
        messenger._whenOnlineCallbacks.push(thenDo);
        if (messenger.isOnline()) messenger._runWhenOnlineCallbacks();
        return messenger;
      },

      outgoingMessages: function() {
        return arr.pluck(messenger._inflight.concat(messenger._outgoing), 0);
      }

    }

    events.makeEmitter(messenger);

    return messenger;
  }

};

})(typeof jsext !== 'undefined' ? jsext : require('./base').jsext);
