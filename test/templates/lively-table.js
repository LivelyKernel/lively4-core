import {expect} from '../../node_modules/chai/chai.js';
import {MockEvent, createHTML, testWorld, loadComponent} from './templates-fixture.js';
import {pt,rect} from 'src/client/graphics.js';

import LivelyTable from "templates/lively-table.js"

describe("LivelyTable Component",  () => {

  var that;
  before("load",  function(done) {
    this.timeout(35000);
    var templateName = "lively-table";
    loadComponent(templateName).then(c => {
      that = c;
      done();
    }).catch(e => done(e));
  });


  describe("setFromArray",  () => {
    it("shouuld set contents", done => {
      that.setFromArray([["hello", "world"],["one", "two"]])
      expect(that.innerHTML).to.match(/hello/)
      expect(that.querySelectorAll("td").length).to.equal(2)
      done()
    });
  })

  it("should load", (done) => {
    done();
  });

  after("cleanup", () => {
    testWorld().innerHTML = "";
  });
});
