
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
  
  describe('Primitives', () => {

    describe('String', () => {

      const expected = 'hello world';
      const urlString = `string:${expected}`;

      it('returns a string as value', async function() {
        const value = await fetch(urlString).then(r => r.value());
        expect(value).to.equal(expected);
      });

      it('returns a string as object', async function() {
        const object = await fetch(urlString).then(r => r.object());
        expect(object).to.equal(expected);
      });

      it('returns a string as text', async function() {
        const text = await fetch(urlString).then(r => r.text());
        expect(text).to.equal(expected);
      });

      it('returns a string as json', async function() {
        const json = await fetch(urlString).then(r => r.json());
        expect(json).to.equal(expected);
      });
    });

    describe('Number', () => {

      const expected = -2.34;
      const urlString = `number:${expected}`;

      it('returns a string as value', async function() {
        const value = await fetch(urlString).then(r => r.value());
        expect(value).to.equal(expected);
      });

      it('returns a string as object', async function() {
        const object = await fetch(urlString).then(r => r.object());
        expect(object).to.equal(expected);
      });

      it('returns a string as text', async function() {
        const text = await fetch(urlString).then(r => r.text());
        expect(text).to.equal(''+expected);
      });

      it('returns a string as json', async function() {
        const json = await fetch(urlString).then(r => r.json());
        expect(json).to.equal(expected);
      });
    });

  });

});
