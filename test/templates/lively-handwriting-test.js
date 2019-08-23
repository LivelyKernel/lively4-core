import {expect} from 'src/external/chai.js';
import {MockEvent, createHTML, testWorld, loadComponent} from './templates-fixture.js';
import {pt,rect} from 'src/client/graphics.js';

describe("LivelyHandwritingTest",  function() {
  
  var that;
  var handwritingData = []
  
    
  before("load", async function(done){
    this.timeout(35000);
    var templateName = "lively-handwriting";
    await loadComponent(templateName) // .then(c => {that = c; done()}).catch(e => done(e));

    
    
    done()
   
  });

    

  describe("alphabet", () => {

    it("shouild fuck async describe!!!", async () => {
        var resp = await fetch(lively4url + "/test/templates/lively-handwriting.data")
      var raw = await resp.text()

      raw.split("\n").forEach(line => {
        try {
          var json = JSON.parse(line)
          handwritingData.push(json)
          console.log('PUSH ' + json.character)
        } catch(e) {
          console.log("could not parse handwriting data: ", line)
        }
      })


        // handwritingData = [{character: "A"}]
        for(let ea of handwritingData) {
          describe("character "+ ea.character, () => {
            it("should have points", async () => {
              expect(ea.points, "no no points").not.undefined()
            });
          })
        }
    })   
  })
  
  after("cleanup", function() {
    testWorld().innerHTML = "";
  });

  
});
