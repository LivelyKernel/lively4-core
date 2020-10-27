import {expect} from 'src/external/chai.js';

import Markdown from "src/client/markdown.js"

describe('Markdown', () => {

  describe('parseAndReplace', () => {
    
     it('should replace  simple patterns', () => {
      var element = <div></div>
      element.textContent = `abcde`
      
      Markdown.parseAndReplace(element, /b/g, () => "x")
      
      expect(element.textContent).to.equal("axcde");
    });
  });
  
  describe('parseAndReplaceMiscLatex', () => {
    
     it('should replace siimple latex code ', () => {
      var element = <div></div>
      element.textContent =`hello \\foo world`
      debugger
      Markdown.parseAndReplaceMiscLatex(element)
      
      expect(element.textContent).to.equal("hello  world");
    });
    
    
     it('should replace latex code ', () => {
      var element = <div></div>
      element.textContent =`hello \\foo{bar} world`
      Markdown.parseAndReplaceMiscLatex(element)
      
      expect(element.textContent).to.equal("hello  world");
    });
    

    it('should replace brackets ', () => {
      var element = <div></div>
      element.textContent =`hello \\begin{figure}[h!] world`
      Markdown.parseAndReplaceMiscLatex(element)
      
      expect(element.textContent).to.equal("hello  world");
    });
    
  });
});