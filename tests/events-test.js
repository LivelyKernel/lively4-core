/*global process, beforeEach, afterEach, describe, it*/

var expect = this.expect || module.require('expect.js');
var lively = this.lively || {}; lively.lang = lively.lang || module.require('../index');
var events = lively.lang.events;

describe('events', function() {

  it('allows to add event interface to objects', function() {
    var obj = events.makeEmitter({});
    expect(typeof obj.on).to.be('function');
    expect(typeof obj.once).to.be('function');
    expect(typeof obj.removeListener).to.be('function');
    expect(typeof obj.removeAllListeners).to.be('function');
    expect(typeof obj.emit).to.be('function');
  });

  it('emits events', function() {
    var obj = events.makeEmitter({});
    var emittedData = "";
    obj.on("test", function(evt) { emittedData += evt; });
    obj.emit("test", "Hello");
    obj.emit("test", "World");
    expect(emittedData).to.be("HelloWorld");
  });

  it('emits events once', function() {
    var obj = events.makeEmitter({});
    var emittedData = "";
    obj.once("test", function(evt) { emittedData += evt; });
    obj.emit("test", "Hello");
    obj.emit("test", "World");
    expect(emittedData).to.be("Hello");
  });

  it('allows to remove a specific handler', function() {
    var obj = events.makeEmitter({});
    var emittedData1 = "", emittedData2 = "";
    function listener1(evt) { emittedData1 += evt; }
    function listener2(evt) { emittedData2 += evt; }
    obj.on("test", listener1);
    obj.on("test", listener2);
    obj.emit("test", "Hello");
    obj.removeListener("test", listener1);
    obj.emit("test", "World");
    expect(emittedData1).to.be("Hello");
    expect(emittedData2).to.be("HelloWorld");
  });

  it('allows to remove all handlers', function() {
    var obj = events.makeEmitter({});
    var emittedData1 = "", emittedData2 = "";
    obj.on("test", function(evt) { emittedData1 += evt; });
    obj.on("test", function(evt) { emittedData2 += evt; });
    obj.emit("test", "Hello");
    obj.removeAllListeners("test");
    obj.emit("test", "World");
    expect(emittedData1).to.be("Hello");
    expect(emittedData2).to.be("Hello");
  });

  it('multiple makeEmitter calls have no unwanted effect', function() {
    var obj = events.makeEmitter({});
    var emittedData = "";
    obj.on("test", function(evt) { emittedData += evt; });
    events.makeEmitter(obj);
    obj.emit("test", "Hello");
    expect(emittedData).to.be("Hello");
  });

  // it('invokes identical handler only once even if added multiple times', function() {
  //   var obj = events.makeEmitter({});
  //   var emittedData = "";
  //   function listener(evt) { emittedData += evt; }
  //   obj.on("test", listener);
  //   obj.on("test", listener);
  //   obj.emit("test", "Hello");
  //   expect(emittedData).to.be("Hello");
  // });

});
