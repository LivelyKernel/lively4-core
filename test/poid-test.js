
import {expect} from 'src/external/chai.js';
import {pt} from 'src/client/graphics.js';
import {ElementQuery}  from "src/client/poid.js"

describe('Poid', () => {

  describe('ElementQuery', () => {

    
    before("load", async function(done){
      this.elementa = <div id="elementa"><div id="elementb"></div></div>  
      document.body.appendChild(this.elementa)
      done()
    });
    
    describe('pathToElement', () => {
      it('should find global elment ', function() {
        expect(ElementQuery.pathToElement("query://#elementa")).to.equal(this.elementa)
      });
      it('should find subl elment ', function() {
        expect(ElementQuery.pathToElement("query://#elementa/#elementb"))
          .to.equal(this.elementa.querySelector("#elementb"))
      });
    })
    
    
    after("cleanup", function(){
      this.elementa.remove()
    });
    
  })  
})
