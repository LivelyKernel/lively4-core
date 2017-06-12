import {expect} from '../../node_modules/chai/chai.js';
import {MockEvent, createHTML, testWorld, loadComponent} from './templates-fixture.js';
import {pt,rect} from 'src/client/graphics.js';

describe("LivelyProgressTest",  function() {

  var that;
  before("load", function(done){
    this.timeout(35000);
    var templateName = "lively-progress";
    loadComponent(templateName).then(c => {that = c; done()}).catch(e => done(e));
  });

  it("should load", function(done) {
    done();
  });

  it("should update progress bar", function(done) {
    that.style.width = "100px"
    that.value = 0.5
    expect(that.get("#progress").style.width).to.equal("50%")
    done();
  });

  after("cleanup", function() {
    testWorld().innerHTML = "";
  });

});
