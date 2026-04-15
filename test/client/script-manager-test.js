import {expect} from 'src/external/chai.js';
import ScriptManager from 'src/client/script-manager.js';

describe('ScriptManager', () => {
  
  describe('HTML Entity Decoding', () => {
    
    it('should handle arrow functions with HTML-encoded entities from copy/paste', () => {
      const div = document.createElement('div');
      document.body.appendChild(div);
      
      // Create script with arrow functions
      const originalScript = `function test() {
  const items = [1, 2, 3].map(x => x * 2);
  const handler = (evt) => evt.preventDefault();
  return items;
}`;
      
      ScriptManager.addScript(div, originalScript, {name: 'test'});
      
      // Simulate copy/paste by serializing and deserializing HTML
      const copiedHTML = div.outerHTML;
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = copiedHTML;
      const pastedDiv = tempDiv.firstElementChild;
      document.body.appendChild(pastedDiv);
      
      // Load scripts from pasted element
      ScriptManager.findLively4Script(pastedDiv, false);
      
      // Verify the script was loaded and works
      expect(pastedDiv.test).to.be.a('function');
      const result = pastedDiv.test();
      expect(result).to.deep.equal([2, 4, 6]);
      
      // Cleanup
      div.remove();
      pastedDiv.remove();
    });
    
    it('should handle async functions with arrow functions in HTML entities', () => {
      const div = document.createElement('div');
      document.body.appendChild(div);
      
      // Script with async and arrow functions
      const asyncScript = `async function livelyLoad() {
  const observer = new ResizeObserver(() => this.onStep());
  const menuItems = [
    ['Option 1', () => console.log('1')],
    ['Option 2', () => console.log('2')]
  ];
  return menuItems.length;
}`;
      
      ScriptManager.addScript(div, asyncScript, {name: 'livelyLoad'});
      
      // Simulate copy/paste
      const copiedHTML = div.outerHTML;
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = copiedHTML;
      const pastedDiv = tempDiv.firstElementChild;
      document.body.appendChild(pastedDiv);
      
      // Load and verify
      ScriptManager.findLively4Script(pastedDiv, false);
      expect(typeof pastedDiv.livelyLoad).to.equal('function');
      // Bound async functions have AsyncFunction as their constructor
      expect(pastedDiv.livelyLoad.constructor.name).to.match(/AsyncFunction|Function/);
      
      // Cleanup
      div.remove();
      pastedDiv.remove();
    });
    
    it('should handle less-than and greater-than entities', () => {
      const div = document.createElement('div');
      document.body.appendChild(div);
      
      const scriptWithComparison = `function compare() {
  if (5 > 3 && 2 < 4) {
    return true;
  }
  return false;
}`;
      
      ScriptManager.addScript(div, scriptWithComparison, {name: 'compare'});
      
      // Simulate copy/paste
      const copiedHTML = div.outerHTML;
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = copiedHTML;
      const pastedDiv = tempDiv.firstElementChild;
      document.body.appendChild(pastedDiv);
      
      // Load and verify
      ScriptManager.findLively4Script(pastedDiv, false);
      expect(pastedDiv.compare).to.be.a('function');
      expect(pastedDiv.compare()).to.be.true;
      
      // Cleanup
      div.remove();
      pastedDiv.remove();
    });
  });
});
