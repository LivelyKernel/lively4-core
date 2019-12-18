import {expect} from 'src/external/chai.js';
import {MockEvent, createHTML, testWorld, loadComponent} from './templates-fixture.js';
import {pt,rect} from 'src/client/graphics.js';

describe("LivelyMarkdownTest",  function() {

  var that;
  before("load", function(done){
    this.timeout(35000);
    var templateName = "lively-markdown";
    loadComponent(templateName).then(c => {that = c; done()}).catch(e => done(e));
  });

  it("should set content", async () => {
    await that.setContent("# hello")
    expect(that.shadowRoot.querySelector("#content").innerHTML).to.match(/<h1/)
  });
  
  
  it("should support github taks lists ", async () => {
    await that.setContent(`
- [ ] todo
- [x] done
`)
    expect(that.shadowRoot.querySelectorAll("input").length).to.equal(2)
  });
  
  after("cleanup", function() {
    testWorld().innerHTML = "";
  });

});
