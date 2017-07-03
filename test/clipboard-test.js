// #Clipboard #Test

import {expect} from '../node_modules/chai/chai.js';
import Clipboard from 'src/client/clipboard.js'
import {pt} from 'src/client/graphics.js';


describe('Clipboard', () => {

  describe('paste', () => {
    it('pasted top level html elements should become lively-content ', () => {
      var container = document.createElement("div")
      
      var data = "<div>Hello</div>"
      Clipboard.lastClickPos = pt(100,100)
      debugger
      Clipboard.pasteHTMLDataInto(data, container)
      
      expect(container.childNodes[0].classList.contains("lively-content")).to.be.true()
    });
  
    it('pasted text should become lively-content ', () => {
      var container = document.createElement("div")
      
      var data = "Hello"
      Clipboard.lastClickPos = pt(100,100)
      debugger
      Clipboard.pasteTextDataInto(data, container)
      
      expect(container.childNodes[0].classList.contains("lively-content")).to.be.true()
    });
  })
  
});