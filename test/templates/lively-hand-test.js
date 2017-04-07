import Sync from '../../templates/lively-sync.js';
import {expect} from '../../node_modules/chai/chai.js';
import {testWorld, loadComponent} from './templates-fixture.js';
import {pt} from 'src/client/graphics.js';


describe("Hand Component",  function() {

  var that;
  before("load", function(done){
    this.timeout(35000);
    var templateName = "lively-hand";
    loadComponent(templateName).then(c => {
      that = c; 
    done()}).catch(e => done(e));
  });


  it("should grab and drop elements", function(done) {
    
    var element = document.createElement("div")
    element.innerHTML = "Hallo"
    document.body.appendChild(element)

    var hand = document.body.querySelector("lively-hand")

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
