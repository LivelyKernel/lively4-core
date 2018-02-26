// #Clipboard #Test

import {expect} from 'src/external/chai.js';
import Clipboard from 'src/client/clipboard.js'
import {pt} from 'src/client/graphics.js';


describe('Clipboard', () => {

  describe('paste', () => {
    it('pasted top level html elements should become lively-content ', () => {
      var container = document.createElement("div")
      
      var data = "<div>Hello</div>"
      Clipboard.lastClickPos = pt(100,100)
      Clipboard.pasteHTMLDataInto(data, container)
      expect(container.childNodes[0].classList.contains("lively-content")).to.be.true()
    });
  
    it('pasted non-lively content to be be grouped into a div ', () => {
      var container = document.createElement("div")
      
      var data = "<div>Hello </div><div>World</div>"
      Clipboard.lastClickPos = pt(100,100)
      Clipboard.pasteHTMLDataInto(data, container)
      
      expect(container.childNodes[0].textContent).to.equal("Hello World")
    });
  
    it('pasted lively content-to be global elements... ', () => {
      var container = document.createElement("div")
      
      var data = "<div class='lively-content'>Hello </div><div class='lively-content'>World</div>"
      Clipboard.lastClickPos = pt(100,100)
      Clipboard.pasteHTMLDataInto(data, container)
      
      expect(container.childNodes[0].textContent).to.equal("Hello ")
    });
  
    
    it('pasted text should become lively-content ', () => {
      var container = document.createElement("div")
      var data = "Hello"
      Clipboard.lastClickPos = pt(100,100)
      Clipboard.pasteTextDataInto(data, container)
      expect(container.childNodes[0].classList.contains("lively-content")).to.be.true()
    });
  })
  
});