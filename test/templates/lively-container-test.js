import Sync from '../../templates/lively-sync.js';
import {expect} from '../../node_modules/chai/chai.js';
import {loadComponent} from './templates-fixture.js';

window.expect = expect;
// System.import(lively4url + '/node_modules/chai/chai.js').then( m => window.expect = m.expect);

describe("Container Tool",  function() {

  var that;
  before("load", function(done){
    this.timeout(35000);
    loadComponent("lively-container").then(c => {that = c; done()});
  });

  it("should visit an url when setPath", function(done) {
    that.setPath("https://lively4/sys/mounts").then(() => {
        expect(that.getContentRoot().textContent).match(/\"path\": \"\/\"/);
        done();
      })
      .catch(e => done(e));
  });
  
  it("should open a filebrowser for a dir", function(done) {
    var url = "https://lively4/sys/"
    that.setPath(url).then(() => {
      var fileBrowser = that.getContentRoot().querySelector("lively-file-browser");
      expect(fileBrowser).to.be.an('object');
      expect(fileBrowser.path).to.be.an(url);
      
      done();
    })
    .catch(e => done(e));
  });
});


console.log("load lively-container-test");

