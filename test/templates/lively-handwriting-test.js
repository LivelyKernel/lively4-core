import {expect} from 'src/external/chai.js';
import {MockEvent, createHTML, testWorld, loadComponent} from './templates-fixture.js';
import {pt,rect} from 'src/client/graphics.js';

function charRange(from, to) {
  var fromIndex = from.charCodeAt(0)
  var toIndex = to.charCodeAt(0)
  var result = []
  for(var i = fromIndex;i <= toIndex; i++) {
    result.push(String.fromCharCode(i))
  }
  return result
}



describe("LivelyHandwritingTest",  function() {
  
  var that;
  var handwritingData = []
  var handwriting
  
  before("load", async function(done){
        
    this.timeout(35000);
    var templateName = "lively-handwriting";
    handwriting = await loadComponent(templateName) // .then(c => {that = c; done()}).catch(e => done(e));
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
    done()
  });

  describe("alphabet", () => {
      
    // handwritingData = [{character: "A"}]
    for(let char of charRange("a", "z")) {
      describe("character "+ char, () => {
         
        it("recognize", async () => {
          var ea = handwritingData.find(ea => ea.character == char)
          expect(ea, "no test data").not.undefined()
          expect(ea.points, "no no points").not.undefined()
          var c = handwriting.characterFromStrokes(ea.strokes, ea.strokesWithDiagonals, ea.points )
          expect(char).to.equal(ea.character)
        });
      })
    }
  })
  
  after("cleanup", function() {
    testWorld().innerHTML = "";
  });  
});
