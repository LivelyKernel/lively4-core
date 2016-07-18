"use strict";
import {expect} from '../node_modules/chai/chai.js'

// System.import(lively4url + '/node_modules/chai/chai.js').then( m => window.expect = m.expect)


var lively = window.lively; var it = window.it

describe('Register Event Listeners', function() {
  var target = document.createElement("div");
  var target2 = document.createElement("div");
  var type = "click";
  var listener = function hello() { } ;
  var listener2 = function hello2() { return 3} ;
  var domain = "selection";
  var oldListeners;

  before(() => {
    oldListeners = lively.eventListeners;
  })
  
  after(() => {
    lively.eventListeners = oldListeners;
  });

  it('should register events when adding events',  () => {
    lively.eventListeners = [];
    lively.addEventListener(domain, target, type, listener) ;
    expect(lively.eventListeners).length(1);
  });
  
  it('should unregister events of a domain',  () => {
    var removedCalled = false
    lively.eventListeners = [];
    var target1 = document.createElement("div");
    target1.removeEventListener = () => {
      removedCalled = true
    }
    
    lively.addEventListener(domain, target1, type, listener);
    lively.addEventListener("domain2", target2, type, listener);
    expect(lively.eventListeners).length(2);
    lively.removeEventListener(domain, undefined, undefined, undefined); 
    expect(lively.eventListeners).length(1);
    expect(removedCalled).to.be.true()
  });

  it('should unregister events of a target',  () => {
    lively.eventListeners = [];
    lively.addEventListener(domain, target, type, listener)
    lively.addEventListener(domain, target2, type, listener);
    expect(lively.eventListeners).length(2);
    lively.removeEventListener(undefined, target2, undefined, undefined); 
    expect(lively.eventListeners).length(1);
  });
  
    
  it('should unregister events of a type',  () => {
    lively.eventListeners = [];
    lively.addEventListener(domain, target, type, listener);
    lively.addEventListener(domain, target, "mousedown", listener);
    expect(lively.eventListeners).length(2);
    lively.removeEventListener(undefined, undefined, "click", undefined); 
    expect(lively.eventListeners).length(1);
  });

  it('should unregister events of a listener',  () => {
    lively.eventListeners = [];
    lively.addEventListener(domain, target, type, listener);
    lively.addEventListener(domain, target, type, listener2);
    expect(lively.eventListeners).length(2);
    lively.removeEventListener(undefined, undefined, undefined, listener2); 
    expect(lively.eventListeners).length(1);
  });

  it('should unregister events of a listener and domain',  () => {
    lively.eventListeners = [];
    lively.addEventListener(domain, target, type, listener);
    lively.addEventListener(domain, target, type, listener2);
    lively.addEventListener(domain, target, "mousedown", listener2);
    expect(lively.eventListeners).length(3);
    lively.removeEventListener(domain, undefined, undefined, listener2); 
    expect(lively.eventListeners).length(1);
  });

});


describe('Position API', function() {
  
  it('should return plain numbers in getter', () => {
    expect(lively.getPosition(document.querySelector('body')).x).to.be.a('number')
  })
})
  
  
  