import {expect} from 'src/external/chai.js';
import {MockEvent, createHTML, testWorld, loadComponent} from './templates-fixture.js';
import {pt,rect} from 'src/client/graphics.js';

describe("LivelyBibtexEntryTest",  function() {

  var that;
  before("load", function(done){
    this.timeout(35000);
    var templateName = "lively-bibtex-entry";
    loadComponent(templateName).then(c => {that = c; done()}).catch(e => done(e));
  });

  it("should load", function(done) {
    done();
  });

  describe("generateFilename",  () => {
    it("works in happy case", () => {
      that.value = {
        entryTags: {
          author: "Hans Mustermann",
          year: "1997",
          title: "Amazing Paper Writing Style"
        }
      }
      expect(that.generateFilename()).to.equal("Mustermann_1997_AmazingPaperWritingStyle")
    });
    it("removes one letter word....", () => {
      that.value = {
        entryTags: {
          author: "Hans Mustermann",
          year: "1997",
          title: "Amazing a Paper in a Writing Style"
        }
      }
      expect(that.generateFilename()).to.equal("Mustermann_1997_AmazingPaperInWritingStyle")
    });
    it("splits meta-reflective", () => {
      that.value = {
        entryTags: {
          author: "Hans Mustermann",
          year: "1997",
          title: "A meta-reflective paper for people"
        }
      }
      expect(that.generateFilename()).to.equal("Mustermann_1997_MetaReflectivePaperForPeople")
    });
    it("deals with hands-on", () => {
      that.value = {
        entryTags: {
          author: "Hans Mustermann",
          year: "1997",
          title: "A hands-on paper for people"
        }
      }
      expect(that.generateFilename()).to.equal("Mustermann_1997_HandsonPaperForPeople")
    });
  })
  
  after("cleanup", function() {
    testWorld().innerHTML = "";
  });

});
