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
    lively.addEventListener(target, type, listener, domain) ;
    expect(lively.eventListeners).property("length").to.be.equal(1);
  });
  
  it('should unregister events of a domain',  () => {
    lively.eventListeners = [];
    lively.addEventListener(target, type, listener, domain);
    lively.addEventListener(target, type, listener, "domain2");
    expect(lively.eventListeners).property("length").to.be.equal(2);
    lively.removeEventListener(undefined, undefined, undefined, domain); 
    expect(lively.eventListeners).property("length").to.be.equal(1);
  });

  it('should unregister events of a target',  () => {
    lively.eventListeners = [];
    lively.addEventListener(target, type, listener, domain);
    lively.addEventListener(target2, type, listener, domain);
    expect(lively.eventListeners).property("length").to.be.equal(2);
    lively.removeEventListener(target2, undefined, undefined, undefined); 
    expect(lively.eventListeners).property("length").to.be.equal(1);
  });
  
    
  it('should unregister events of a type',  () => {
    lively.eventListeners = [];
    lively.addEventListener(target, type, listener, domain);
    lively.addEventListener(target, "mousedown", listener, domain);
    expect(lively.eventListeners).property("length").to.be.equal(2);
    lively.removeEventListener(undefined, "click", undefined, undefined); 
    expect(lively.eventListeners).property("length").to.be.equal(1);
  });

  it('should unregister events of a listener',  () => {
    lively.eventListeners = [];
    lively.addEventListener(target, type, listener, domain);
    lively.addEventListener(target, type, listener2, domain);
    expect(lively.eventListeners).property("length").to.be.equal(2);
    lively.removeEventListener(undefined, undefined, listener2, undefined); 
    expect(lively.eventListeners).property("length").to.be.equal(1);
  });

    
    // lively.addEventListener(target, type, listener, domain) 
    
    // lively.removeEventListener(target, undefined, undefined, domain)
    // expect(lively.eventListeners.filter(ea => ea.domain == domain)).to.be.equal([])
  
});
