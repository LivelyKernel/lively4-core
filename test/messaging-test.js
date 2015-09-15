define(function(require) {
    "use strict";

    var expect = chai.expect;
    var messaging = require('./../src/client/messaging.js');

    describe('Client Messaging API', function() {
        it('should answer messages', function(done) {
            var message = 'expected message';

            messaging.postMessage(message).then(function(event) {
                console.log('INSIDE PROMISE!!!!!!!!!!!!!!!!!!!!!!!');
                console.log(event);
                console.log(event.data);
                console.log(event);
                expect(event.data.sendedMessage).to.equal(message);
                done();
            });
        });
    });
});
