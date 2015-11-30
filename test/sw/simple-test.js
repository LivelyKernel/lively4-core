var expect = chai.expect;

import * as messaging from './../../src/client/messaging.js';

describe('SIMPLE TEST', function() {
  it('SHOULD WORK', function(done) {
    expect(8).to.equal(2**3);
    done();
  });

  it('should answer a single message', function(done) {
    var message = 'expected message';

    messaging.postMessage({
      meta: {
        type: 'bar'
      },
      message: '2+3'
    })
      .then(function(event) {
        expect(event.data.meta.receivedMessage.meta.type).to.equal('bar');
        expect(event.data.message.error).to.equal(undefined);
        expect(event.data.message.result).to.equal('5');
      })
      .then(done)
      .catch(done);
  });
});
