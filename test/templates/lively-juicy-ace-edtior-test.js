import Sync from '../../templates/lively-sync.js';
import {expect} from '../../node_modules/chai/chai.js';
import {testWorld, loadComponent} from './templates-fixture.js';

describe("Ace Editor Component",  function() {

  var that;
  before("load", function(done){
    this.timeout(35000);
    loadComponent("juicy-ace-editor")
      .then(c => {that = c; done()})
      .catch(e => {
        lively.notify("before failed: " + e);
      });
  });

  it("should load", function(done) {
    done();
  });
  
  it("should have an editor", function(done) {
    expect(that.editor).to.be.an("object");
    done();
  });

  it("should display text", function(done) {
    var text = "abc, die Katze liegt im schnee.";
    that.editor.setValue(text);
    expect(that.editor.getValue()).to.contain(text);
    done();
  });

  after("cleanup", function() {
    testWorld().innerHTML = "";
  });

});
