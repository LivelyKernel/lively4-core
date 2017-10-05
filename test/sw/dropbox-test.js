import dropbox from "src/external/lively4-serviceworker/src/fs/dropbox.js"
import {expect} from 'node_modules/chai/chai.js';

var token

describe('Dropbox', () => {
  before("load", async function(done){
    // run this manually.... for now? 
    await new Promise(resolve => {
      if (lively.authDropbox.lastToken) {
        token = lively.authDropbox.lastToken
        resolve()
      }
      lively.authDropbox.challengeForAuth(Date.now(), (t) => {
        token = t;
        lively.authDropbox.lastToken = t
        resolve()
      })        
    });

    this.sut = new dropbox("/dropbox", {
      subfolder: "Lively4",
      token: token
    }) 
  });

  if (token) {
    describe('stat', () => {
      it('shoult get metainfo of a file', async (done) => {
        var info = await db.stat("/foo.txt", new Request("https://lively4/dropbox"))
        done()
      });
    }) 
  }
})
  


  
