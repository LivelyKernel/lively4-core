/*global beforeEach, afterEach, describe, it, setTimeout*/

var expect = typeof module !== 'undefined' && module.require ?
  module.require('expect.js') : this.expect;

var jsext = typeof module !== 'undefined' && module.require ?
  module.require('../index') : this.jsext;

var message = jsext.message;
var fun = jsext.fun;

describe('messengers', function() {

  var sendDataA, messengerA, messengerAIsOnline,
      sendDataB, messengerB, messengerBIsOnline;

  beforeEach(function() {
    sendDataA = [];
    messengerA = message.makeMessenger({
      id: "messengerA",
      send: fun.debounce(10, function(msg, thenDo) {
        sendDataA.push(msg); thenDo(); 
      }),
      listen: function() { setTimeout(function() { messengerAIsOnline = true; }, 10); },
      isOnline: function() { return messengerAIsOnline; }
    });

    sendDataB = [];
    messengerB = message.makeMessenger({
      send: fun.debounce(5, function(msg, thenDo) {
        sendDataB.push(msg); thenDo(); 
      }),
      listen: function() { setTimeout(function() { messengerBIsOnline = true; }, 5); },
      isOnline: function() { return messengerBIsOnline; }
    });
  });

  describe("messenger attributes", function() {
    
    it("have ids", function() {
      expect(messengerA.id()).to.be("messengerA");
      expect(messengerB.id()).to.match(/^[a-z0-9-]+$/i);
    });

  });

  describe("interface - implementation binding", function() {

    it('binds a sender implementation', function(done) {
      var msg = {target: "foo", action: "test", data: "some data"};

      fun.composeAsync(
        function(next) { messengerA.send(msg); next(); },
        function(next) {
          fun.waitForAll({timeout: 200}, [messengerA.whenOnline, messengerB.whenOnline], next)
          messengerA.listen();
          messengerB.listen();
        },
        function(_, next) {
          expect(sendDataA).to.be.empty();
          expect(messengerA.pendingOut()).to.eql([msg]);
          next();
        },
        function(next) { setTimeout(next, 20); },
        function(next) {
          expect(sendDataA).to.eql([msg]);
          expect(messengerA.pendingOut()).to.eql([]);
          next();
        }
      )(function(err) { expect(err).to.be(null); done(); })

    });

  });

});

