## lib/events.js

A simple node.js-like cross-platform event emitter implementation.


- [events](#events)

### <a name="events"></a>events

 A simple node.js-like cross-platform event emitter implementation that can
 be used as a mixin. Emitters support the methods: `on(eventName, handlerFunc)`,
 `once(eventName, handlerFunc)`, `emit(eventName, eventData)`,
 `removeListener(eventName, handlerFunc)`, `removeAllListeners(eventName)`
 

```js
var emitter = events.makeEmitter({});
var log = [];
emitter.on("test", function() { log.push("listener1"); });
emitter.once("test", function() { log.push("listener2"); });
emitter.emit("test");
emitter.emit("test");
log // => ["listener1","listener2","listener1"]
emitter.removeAllListeners("test");
emitter.emit("test");
log // => is still ["listener1","listener2","listener1"]
```