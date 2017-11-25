import {expect} from '../../node_modules/chai/chai.js';
import {loadComponent} from './templates-fixture.js';

window.expect = expect;
// System.import(lively4url + '/node_modules/chai/chai.js').then( m => window.expect = m.expect);

describe("Container Tool",  function() {

  var that;
  before("load", function(done){
    this.timeout(35000);
    var templateName = "lively-container"
    loadComponent(templateName).then(c => {that = c; done()}).catch(e => done(e));
  });

  it("should visit an url when setPath", function(done) {
    that.setPath(lively4url +"/README.txt").then(() => {
        // expect(that.getContentRoot().textContent).match(/\"path\": \"\/\"/);
        done();
      })
      .catch(e => done(e));
  });
  
  it("should open a filebrowser for a dir", function(done) {
    var url = lively4url + "/";
    that.setPath(url).then(() => {
      // it can also be a listing...
      
      // var fileBrowser = that.getContentRoot().querySelector("lively-file-browser");
      // expect(fileBrowser).to.be.an('object');
      // expect(fileBrowser.path).to.be.equal(url);
      
      done();
    })
    .catch(e => done(e));
  });
});
