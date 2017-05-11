import {expect} from '../../node_modules/chai/chai.js';
import {MockEvent, createHTML, testWorld, loadComponent} from './templates-fixture.js';
import {pt} from 'src/client/graphics.js';

import LivelyHand from "templates/lively-hand.js"

describe("Hand Component",  function() {

  var that;
  var hand;
  before("load", function(done){
    this.timeout(35000);
    var templateName = "lively-hand";
    loadComponent(templateName).then(c => {
      that = c;
      hand = c;
      done();
    }).catch(e => done(e));
  });

  it("should grab on pointer down", function(done) {

    var element = createHTML("<div>Hello</div>")
    var other = createHTML("<div>World</div>")
    hand.onPointerDown(new MockEvent(element, {altKey: true}))
    expect(element.parentElement).to.be.equal(hand);
    hand.onPointerUp(new MockEvent(other))
    done()
  })
  
  it("should not grab elements in shadow dom", function(done) {
    var element = createHTML("<div>Element</div>")
    var root = element.createShadowRoot();
    var inner = createHTML("<div>Inner</div>")
    root.appendChild(inner)

    var evt = new MockEvent(element, {altKey: true})
    // emulate the evt.path of an event hitting inside the shadow 
    var oldPath = evt.path
    evt.path = []
    evt.generatePath(inner)
    evt.path = evt.path.concat(oldPath)
    
    expect(evt.path.indexOf(element)).to.be.gt(0)
    expect(hand.elementUnderHand(evt)).to.be.equal(element)
    
    
    hand.onPointerDown(evt)
    try {
      expect(inner.parentElement).not.to.be.equal(hand);
      expect(element.parentElement).to.be.equal(hand);
    } finally {
      hand.onPointerUp(evt)
    }    
    done();
  });



  it("should grab and drop elements", function(done) {
    
    var element = document.createElement("div")
    element.innerHTML = "Hallo"
    testWorld().appendChild(element)

    var pos = lively.getGlobalPosition(element)
    lively.setGlobalPosition(hand,pos)
    hand.grab(element)
    expect(element.parentElement).to.be.equal(hand);
    
    lively.setGlobalPosition(hand, pos.addPt(pt(0,100)))
    hand.drop()
    expect(element.parentElement).to.be.not.equal(hand);
    lively.setGlobalPosition(hand, pos.addPt(pt(0,0)))

    done();
  });



  it("should load", function(done) {
    done();
  });


  after("cleanup", function() {
    testWorld().innerHTML = "";
  });

});
