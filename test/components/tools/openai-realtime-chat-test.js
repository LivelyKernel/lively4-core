import { testWorld, loadComponent } from 'test/templates/templates-fixture.js';

describe("OpenaiRealtimeChatTest", function() {
  let component;

  before("load component", function(done) {
    this.timeout(35000);
    loadComponent("openai-realtime-chat").then(c => {
      component = c;
      done();
    }).catch(e => done(e));
  });

  it("should load component", function(done) {
    done();
  });

  after("cleanup", function() {
    testWorld().innerHTML = "";
  });
});
