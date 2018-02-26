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

  it("should set content", async function(done) {
    await that.setContent("# hello")
    expect(that.shadowRoot.querySelector("#content").innerHTML).to.match(/<h1>/)
    done();
  });
  
// #TODO make them work in travis

//   it("should run scritpts", async function(done) {
//     window.livelyMarkdownTestScriptDone = done
//     await that.setContent(
//     `# a script
// <script>
// window.livelyMarkdownTestScriptDone()
// </script>`
// )
//   });

  // it("should set src", async function(done) {
  //   await that.setSrc(lively4url + "/README.md")
  //   expect(that.shadowRoot.querySelector("#content").innerHTML).to.match(/<h1>/)
  //   done();
  // });

  after("cleanup", function() {
    testWorld().innerHTML = "";
  });

});
