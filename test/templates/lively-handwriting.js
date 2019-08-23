import {expect} from 'src/external/chai.js';
import {MockEvent, createHTML, testWorld, loadComponent} from './templates-fixture.js';
import {pt,rect} from 'src/client/graphics.js';

describe("LivelyHandwritingTest",  async function() {

  var that;
  var handwritingData = []
  
  var resp = await fetch(lively4url + "/test/templates/lively-handwriting.data")
  var raw = await resp.text()

  raw.split("\n").forEach(line => {
  try {
    var json = JSON.parse(line)
    handwritingData.push(json)
  } catch(e) {
    console.log("could not parse handwriting data: ", line)
  }
   
  before("load", async function(){
    this.timeout(35000);
    var templateName = "lively-handwriting";
    await loadComponent(templateName) // .then(c => {that = c; done()}).catch(e => done(e));
    
    })
  });

  it("have test data", () => {
    expect(handwritingData.length, "no data").gt(0)
  });


  describe("alphabet", () => {
    // data = [{character: "A"}]
    for(let ea of handwritingData) {
      describe("character "+ ea.character, () => {
        it("recognizes " + ea.character, async () => {
          expect(ea.points, "no no points")    
        });
      })
    }
  })

  
  after("cleanup", function() {
    testWorld().innerHTML = "";
  });

});
