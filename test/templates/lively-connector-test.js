import {expect} from '../../node_modules/chai/chai.js';
import {MockEvent, createHTML, testWorld, loadComponent} from './templates-fixture.js';
import {pt,rect} from 'src/client/graphics.js';

describe("LivelyConnectorTest",  function() {

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


  before("load", async function(done){
    this.timeout(35000);
    setup()

    var templateName = "lively-connector";
    loadComponent(templateName).then(c => {
      that = c; done()
      container.appendChild(that)
    }).catch(e => done(e));

  });

  it("should load", function(done) {
    done();
  });

  it("should connect", function(done) {
    that.connect(a,b)

    done();
  });

  after("cleanup", function() {
    testWorld().innerHTML = "";
  });

});
