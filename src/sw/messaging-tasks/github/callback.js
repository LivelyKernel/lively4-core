l4.importScripts('src/sw/messaging-tasks/github/github.js');
//l4.importScripts('src/sw/messaging-tasks/github/credentials.js');

l4.callbacks = {}

l4.registerCallback = function(id, cb) {
    l4.callbacks[id] = cb
}

l4.messageTask('callbacks', function match(event) {
    return hasPort(event) &&
        event.data &&
        event.data.type === 'callback';
}, function react(event) {
    var message = event.data 

    var cb = l4.callbacks[message.callbackId] 
    if (cb) {
        delete l4.callbacks[message.callbackId] 
        cb.apply(self, message.args)
    } else{
        console.log("no callback found for: " + JSON.stringify(message))
    }

    return true;
});