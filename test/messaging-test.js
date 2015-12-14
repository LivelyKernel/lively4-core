"use strict";

var expect = chai.expect;
import * as messaging from './../src/client/messaging.js';

describe('Client Messaging API', function() {
  it('should answer a single message', function(done) {
    var message = 'expected message';

    messaging.postMessage({
      meta: {
        type: 'foo'
      },
      message: message
    })
      .then(function(event) {
        expect(event.data.meta.receivedMessage.meta.type).to.equal('foo');
        expect(event.data.meta.receivedMessage.message).to.equal(message);
      })
      .then(done);
  });

  it('should resolve the correct Promise when answering messages', function(done) {
    var answers = [];

    function buildMessage(id) {
      var message = 'expected message' + id;

      return messaging.postMessage({
        meta: {
          type: 'foo'
        },
        message: message
      })
        .then(function(event) {
          expect(event.data.meta.receivedMessage.meta.type).to.equal('foo');
          expect(event.data.meta.receivedMessage.message).to.equal(message);
        })
    }

    for(var i = 0; i < 100; i++) {
      answers.push(buildMessage(i));
    }

    Promise.all(answers).then(function() {
      done();
    });
  });
});
