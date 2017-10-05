import dropbox from "src/external/lively4-serviceworker/src/fs/dropbox.js"
import {expect} from 'node_modules/chai/chai.js';

var token
var sut

function readFile(file){
  return new Promise((resolve, reject) => {
    var fr = new FileReader();  
    fr.onload = () => {
      resolve(fr.result )
    };
    fr.readAsText(file.blob);
  });
}
sut

describe('Dropbox', function() {
  before("load", async function(done){
    // run this manually.... for now? 
    // window.lastDropboxToken = null
    if (window.lastDropboxToken) {
        token = window.lastDropboxToken
    } else {
      await new Promise(resolve => {
        lively.authDropbox.challengeForAuth(Date.now(), (t) => {
          token = t;
          window.lastDropboxToken = t
          resolve()
          })
      })
    }                   
    sut = new dropbox("/dropbox", {
      subfolder: "Lively4",
      token: token
    }) 
    console.log("had a token, we are done: " + ("" +window.lastDropboxToken).slice(0,5))
    done()
  });

  describe('authenticated test on dropbox', function() {
    it('should have a token', () => {
      expect(token, "no token defined").to.not.equal(undefined)
    })

    if (token) {
      describe('stat', function() {
        this.timeout(35000);
        it('shoult get metainfo of a file', async function(done) {
          var info = await sut.stat("/foo.txt", new Request("https://lively4/dropbox"))
          done()
        });

        it('shoult get metainfo of a directory', async function(done) {
          var info = await sut.stat("", new Request("https://lively4/dropbox"))
          expect(info.contents.length).to.be.above(0)
          done()
        });
      }) 

      describe('read', function() {
        this.timeout(35000);
        it('read a file', async function(done) {
          try {
            var file = await sut.read("/foo.txt", new Request("https://lively4/dropbox"))
            debugger
            expect(file).to.not.be.undefined()
            expect(file.fileversion, "fileversion").to.not.be.undefined()
            done()
          } catch(e) {
            done(e)
          } 
        });
      }) 

      describe('write', function() {
        this.timeout(35000);
        it('write a file', async function(done) {
          try {
            var content = "Hello World  " + Math.random()
            var filename = "/foo2.txt";
            var existing = await sut.read(filename, new Request("https://lively4/dropbox"))

            var request = new Request("https://lively4/dropbox", {
              headers: {
                "lastversion": existing.fileversion 
              }
            });

            await sut.write(filename, content, request)

            var file = await sut.read(filename, new Request("https://lively4/dropbox"))
            var read = await readFile(file)
            expect(read).to.be.equal(content)
            done()
          } catch(e) {
            done(e)
          } 
        });
      }) 
    }
  }); 
})
  


  
