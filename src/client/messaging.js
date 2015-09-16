define(function(require, exports, module) {
    "use strict";

    window.addEventListener('error', function(error) {
        console.error(error);
    });

    module.exports = {
        /**
         * Send a message to the ServiceWorker and waits for an answer
         * @param message
         * @returns {Promise} A Promise resolving with the answer from the ServiceWorker
         */
        postMessage: function(message) {
            // TODO: what about rejecting the Promise onerror
            return new Promise(function(resolve, reject) {
                var channel = new MessageChannel();
                channel.port1.onmessage = resolve;

                navigator.serviceWorker.controller.postMessage(message, [channel.port2])
            });
        }
    };
});
