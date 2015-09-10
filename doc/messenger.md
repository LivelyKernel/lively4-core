## lib/messenger.js

A pluggable interface to provide asynchronous, actor-like message
communication between JavaScript systems. Provides a unified message protocol
and send / receive methods.


- [messenger](#messenger)

### <a name="messenger"></a>messenger



A messenger is an object that provides a common, message-based interface. Messengers expect you to provide an implementation of a small number of methods: `send`, `listen`, `close`, and `isOnline`. A messenger will then provide a unified interface for sending and receiving messages. Common boilerplate functionality such as queuing messages, error handling, dealing with instable connections, heartbeats, etc. is handled by the messenger object automatically (and can be parameterized).

This allows to use a single interface across a range of heterogeneous objects without having to implement every detail of the abstraction repeatedly. This is especially valuable when dealing with asynchronous or remote communication (web workers, XHR requests, WebSockets, node.js processes, ...).

To see a minimal example of how to use messengers for the local communication between JavaScript objects [see this example](#messenger-example).

A more sophisticated example of messengers is [the worker implementation](worker.js) which provides an actor-like worker interface that uses web workers in web browsers and child_process.fork in node.js.

```js
var msger = lively.lang.messenger.create({
  send: function(msg, onSendDone) { console.log(msg); onSendDone(); },
  listen: function(thenDo) { thenDo(); },
  close: function(thenDo) { thenDo(); },
  isOnline: function() { return true }
});
```

#### Messenger interface

The interface methods are build to enable an user to send and receive
messages. Each messenger provides the following methods:

##### msger.id()

Each msger has an id that can either be defined by the user when the
msger is created or is automatically assigned. The id should be unique for each
messenger in a messenger network. It is used as the `target` attribute to
address messages and internally in the messaging implementation for routing.
See the [message protocol](#messenger-message-protocol) description for more info.

##### msger.isOnline()

Can the msger send and receive messages right now?

##### msger.heartbeatEnabled()

Does the msger send automated heartbeat messages?

##### msger.listen(optionalCallback)

Brings the messenger "online": Starts listening for messages and brings it
into a state to send messages. `optionalCallback` is a function that is called
when listening begins. It should accept one argument `error` that is null if no
error occured when listening was started, an Error object otherwise.

##### msger.send(msg, onReceiveFunc)

Sends a message. The message should be structured according to the [message
protocol](#messenger-message-protocol). `onReceiveFunc` is triggered when the `msg` is being
answered. `onReceiveFunc` should take two arguments: `error` and `answer`.
`answer` is itself a message object.

##### msger.sendTo(target, action, data, onReceiveFunc)

A simpler `send`, the `msg` object is automatically assembled. `target`
should be an id of the receiver and `action` a string naming the service that
should be triggered on the receiver.

##### msger.answer(msg, data, expectMore, whenSend)

Assembles an answer message for `msg` that includes `data`. `expectMore`
should be truthy when multiple answers should be send (a streaming response,
see the [messaging protocol](#messenger-message-protocol)).

##### msger.close(thenDo)

Stops listening.

##### msger.whenOnline(thenDo)

Registers a callback that is triggered as soon as a listen attempt succeeds
(or when the messenger is listening already then it succeeds immediately).

##### msger.outgoingMessages()

Returns the messages that are currently inflight or not yet send.

##### msger.addServices(serviceSpec)

Add services to the messenger. `serviceSpec` should be  JS object whose keys
correspond to message actions:

```js
msg.addServices({
  helloWorld: function(msg, messenger) {
    messenger.answer(msg, "received a message!");
  }
});
```

See the examples below for more information.

##### *[event]* msger.on("message")

To allow users to receive messages that were not initiated by a send,
messengers are [event emitters](events.js) that emit `"message"` events
whenever they receive a new message.

The messenger object is used to create new messenger interfaces and ties
them to a specific implementation. Please see [worker.js]() for examples of
how web workers and node.js processes are wrapped to provide a cross-platform
interface to a worker abstraction.


#### <a name="messenger-message-protocol"></a>Message protocol

A message is a JSON object with the following fields:

```js
var messageSchema = {

    // REQUIRED selector for service lookup. By convention action gets
    // postfixed with "Result" for response messages
    action: STRING,

    // REQUIRED target of the message, the id of the receiver
    target: UUID,

    // OPTIONAL arguments
    data: OBJECT,

    // OPTIONAL identifier of the message, will be provided if not set by user
    messageId: UUID,

    // OPTIONAL sender of the message, will be provided if not set by user
    sender: UUID,

    // OPTIONAL identifier of a message that this message answers, will be provided
    inResponseTo: UUID,

    // OPTIONAL if message is an answer. Can be interpreted by the receiver as
    // a streaming response. Lively participants (tracker and clients) will
    // trigger data bindings and fire callbacks for a message for every streaming
    // response
    expectMoreResponses: BOOL,

    // EXPERIMENTAL UUIDs of trackers/sessions handlers that forwarded this
    // message
    route: ARRAY
}
```

The `sendTo` and `answer` methods of messengers will automatically create these
messages. If the user invokes the `send` method then a JS object according to
the schema above should be passed as the first argument.

#### <a name="messenger-example"></a>Messenger examples

The following code implements what is needed to use a messenger to communicate
between any number of local JavaScript objects. Instead of dispatching methods using
a local list of messengers you will most likely use an existing networking /
messaging mechanism.

See the [worker](#) and [its implementation](worker.js) for a real use case in
which forking processes in the browser using Web Workers and in node.js using
child_process.fork is unified.

```js
// spec that defines message sending in terms of receivers in the messengers list
var messengers = [];
var messengerSpec = {
  send: function(msg, onSendDone) {
    var err = null, recv = arr.detect(messengers, function(ea) {
          return ea.id() === msg.target; });
    if (recv) recv.onMessage(msg);
    else err = new Error("Could not find receiver " + msg.target);
    onSendDone(err);
  },
  listen: function(thenDo) { arr.pushIfNotIncluded(messengers, this); },
  close: function(thenDo) { arr.remove(messengers, this); },
  isOnline: function() { return arr.include(messengers, this); }
};

// Create the messengers and add a simple "service"
var msger1 = messenger.create(messengerSpec);
var msger2 = messenger.create(messengerSpec);
msger2.addServices({
  add: function(msg, msger) { msger.answer(msg, {result: msg.data.a + msg.data.b}); }
});

// turn'em on...
msger1.listen();
msger2.listen();

// ...and action!
msger1.sendTo(msger2.id(), 'add', {a: 3, b: 4},
  function(err, answer) { alert(answer.data.result); });
```



#### <a name="deliver"></a>deliver(queued)

 timed out