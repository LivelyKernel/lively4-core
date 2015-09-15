define(function(require, exports, module) {
    "use strict";

    var getNextId = (function() {
        var nextId = 1;

        return function() {
            return nextId++;
        }
    })();

    var also = function(obj, prop, cb) {
        var previousFunction = obj[prop];
        if(previousFunction) {
            obj[prop] = function() {
                previousFunction.apply(obj, arguments);
                cb.apply(obj, arguments);
            }
        } else {
            obj[prop] = cb;
        }
    };

    var waitingForResponse = new Map();

    function handleMessage(e) {
        console.log('Received Message from ServiceWorker', e.data);

        var id = e.data.meta &&
            e.data.meta.receivedMessage &&
            e.data.meta.receivedMessage.meta &&
            e.data.meta.receivedMessage.meta.id;

        if(id && waitingForResponse.has(id)) {
            var resolve = waitingForResponse.get(id);
            waitingForResponse.delete(id);
            resolve(e);
        } else {
            console.log('MESSAGE WITHOUT RESPONSE LISTENER!');
        }

    }

    also(window, 'onerror', function(error) {
        console.error(error);
    });
    //also(window, 'onmessage', handleMessage);
    //also(navigator.serviceWorker, 'onmessage', handleMessage);

    module.exports = {
        /**
         * Send a message to the ServiceWorker and waits for an answer
         * @param message
         * @returns {Promise} A Promise resolving with the answer from the ServiceWorker
         */
        postMessage: function(message) {
            return new Promise(function(resolve, reject) {
                var channel = new MessageChannel(),
                    id = getNextId();

                also(channel.port1, 'onmessage', handleMessage);

                // TODO: get to run resolve(e)
                waitingForResponse.set(id, resolve);
                message.meta.id = id;

                console.log(channel);
                console.log(channel.port1);
                console.log(navigator);
                console.log(navigator.serviceWorker);
                console.log(navigator.serviceWorker.controller);

                navigator.serviceWorker.controller.postMessage(message, [channel.port2])
            });
        }
    };
});
