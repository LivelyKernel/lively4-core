define(function(require) {
    "use strict";

    var expect = chai.expect;
    var messaging = require('./../src/client/messaging.js');

    describe('Client Messaging API', function() {
        it('should answer messages', function(done) {
            var message = 'expected message';

            messaging.postMessage({
                meta: {
                    type: 'foo'
                },
                message: message
            })
                .then(function(event) {
                    console.log('INSIDE PROMISE!!!!!!!!!!!!!!!!!!!!!!!');
                    console.log(event);
                    console.log(event.data);
                    console.log(event.data.meta);
                    console.log(event.data.meta.receivedMessage);
                    console.log(event.data.meta.receivedMessage.meta);
                    console.log(event.data.meta.receivedMessage.meta.type);
                    expect(event.data.meta.receivedMessage.meta.type).to.equal('foo');
                    expect(event.data.meta.receivedMessage.message).to.equal(message);
                })
                .then(done);
        });
    });
});
