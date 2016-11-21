import Sync from '../../templates/lively-sync.js';
import {expect} from '../../node_modules/chai/chai.js';
import {testWorld, loadComponent} from './templates-fixture.js';

window.expect = expect;
System.import(lively4url + '/node_modules/chai/chai.js').then( m => window.expect = m.expect);

describe("File Browser Tool",  function() {

  var that;
  before("load", function(done){
    this.timeout(35000);
    var templateName = "lively-file-browser"
    loadComponent(templateName).then(c => {that = c; done()}).catch(e => done(e));
  });

  it("should visit an url when setURL", function(done) {
    var expectedURL ="https://lively4/sys/" ;
    that.setURL(expectedURL).then(() => {
        expect(that.getURL().toString()).to.be.equal(expectedURL);
        done();
      })
      .catch(e => done(e));
  });

  after("cleanup", function() {
    testWorld().innerHTML = "";
  });
});

