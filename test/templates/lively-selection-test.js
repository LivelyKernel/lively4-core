import {expect} from '../../node_modules/chai/chai.js';
import {MockEvent, createHTML, testWorld, loadComponent} from './templates-fixture.js';
import {pt,rect} from 'src/client/graphics.js';

describe("LivelySelectionTest",  function() {

  var that;
  var a,b, container;

  function setup() {
    a = document.createElement("div")
    a.style.backgroundColor = "red"
    a.textContent = "a"
    lively.setExtent(a, pt(100,100))
    lively.setPosition(a, pt(100,100))

    b = document.createElement("div")
    b.style.backgroundColor = "blue"
    b.textContent = "b"
    lively.setExtent(b, pt(100,100))
    lively.setPosition(b, pt(300,100))

    container = document.createElement("div")
    testWorld().appendChild(container)
    container.appendChild(a)
    container.appendChild(b)
  }
  
  before("load",function(done){
    this.timeout(35000);
    var templateName = "lively-selection";
    loadComponent(templateName).then(c => {
      that = c; 
      setup();
      done();
    }).catch(e => done(e));
    
    
  });

  it("should load", function(done) {
    done();
  });

  it("should drag select elements", (done) => {
    that.nodes = [a,b]
    
    lively.setPosition(a, pt(100,100))
    lively.setPosition(b, pt(300,150))

    var old = lively.getPosition(a)
    that.haloDragStart(pt(100,100))
    that.haloDragTo(pt(100,200),pt(100,100))
    expect(lively.getPosition(a).y).to.equal(200)
    expect(lively.getPosition(b).y).to.equal(250)
    done();
  })


  after("cleanup", function() {
    testWorld().innerHTML = "";
  });

});
