import {expect} from 'src/external/chai.js';
import {testWorld, loadComponent} from './templates-fixture.js';

describe("VivideList Component",  () => {
  var that;
  before("load",  function(done) {
    this.timeout(35000);
    var templateName = "vivide-list";
    loadComponent(templateName).then(c => {
      that = c;
      done();
    }).catch(e => done(e));
  });
  
  it("accepts data", function(done) {
    that.clearTransformations();
    that.pushTransformation(list => list);
    that.show(["hello", "world"]);
    expect(that.model.length).to.equal(2);
    expect(that.model[0].object).to.equal("hello");
    expect(that.model[1].object).to.equal("world");
    done();
  });

  it("transforms data", function(done) {
    that.clearTransformations();
    that.pushTransformation(
      list => list.filter(
        elem => elem.length > 3
      ).map(
        elem => elem.toUpperCase()
      ));
    that.show(["hello", "world", "xyz"]);
    expect(that.model.length).to.equal(2);
    expect(that.model[0].object).to.equal("HELLO");
    expect(that.model[1].object).to.equal("WORLD");
    done()
  });

  after("cleanup", function() {
    testWorld().innerHTML = "";
  });

});