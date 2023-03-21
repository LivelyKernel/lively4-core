import chai, { expect } from 'src/external/chai.js';
import sinon from 'src/external/sinon-3.2.1.js';
import sinonChai from 'src/external/sinon-chai.js';
chai.use(sinonChai);
const assert = chai.assert;

describe('AST Capabilities', function () {

  let lcm;
  let cm;
  let ac;

  beforeEach('createCM', async () => {
    lcm = await Function.identity(<lively-code-mirror></lively-code-mirror>);
    document.body.append(lcm);
    await lcm.editorLoaded();
    cm = lcm.editor;
    ac = lcm.astCapabilities;
  });

  afterEach('removeCM', async () => {
    lcm.remove();
    lcm = undefined;
    cm = undefined;
    ac = undefined;
  });

  function prepareCM(text, fromLine, fromCh, toLine = fromLine, toCh = fromCh) {
    lcm.value = text;
    if (fromLine !== undefined) {
      cm.setSelections(Array.isArray(fromLine) ? fromLine : [{
        anchor: {
          line: fromLine,
          ch: fromCh
        },
        head: {
          line: toLine,
          ch: toCh
        }
      }], 0);
    }
  }

  it('fixture works', async () => {
    const text = `var a = { foo: 42 };`;
    prepareCM(text, 1, 10);

    expect(lcm).to.be.defined;
    expect(lcm.astCapabilities).to.be.defined;
    expect(cm).to.be.defined;
    expect(lcm.value).to.equal(text);
  });

  describe('basics', function () {

    it('get first characters', async () => {
      prepareCM(`var a = { foo: 42 };`, 0, 0, 0, 3);

      const selection = cm.getSelection();
      expect(selection).to.equal('var');
    });
  });

  describe('list', function () {

    function rangeSmartAround(inclusive = false, charsToBeginList) {
      const firstSelection = cm.listSelections()[0];
      const around = ac.findSmartAroundSelection(cm, firstSelection.anchor, firstSelection.head, inclusive, charsToBeginList);
      return cm.getRange(around.anchor, around.head);
    }
    
    it('find smart around', async () => {
      prepareCM(`var a = { foo: 42 };`, 0, 10);

      const range = rangeSmartAround(true);

      expect(range).to.equal('{ foo: 42 }');
    });

    it('ignore line comment', async () => {
      prepareCM(`var a = {
// [  ]
};`, 1, 4);

      const range = rangeSmartAround();
      
      expect(range).to.equal(`
// [  ]
`);
    });
    
    it('ignore multi-line comment', async () => {
      prepareCM(`var a = {
/* {  }
*/
};`, 1, 5);

      const range = rangeSmartAround();
      
      expect(range).to.equal(`
/* {  }
*/
`);
    });

    it('ignore in string', async () => {
      prepareCM(`var a = { foo: 'a{  }b' };`, 0, 18);

      const range = rangeSmartAround();
      
      expect(range).to.equal('a{  }b');
    });
    
    it('ignore in string + match only brackets', async () => {
      prepareCM(`var a = { foo: 'a{  }b' };`, 0, 18);

      const range = rangeSmartAround(false, '([{');
      
      expect(range).to.equal(" foo: 'a{  }b' ");
    });
    
    it('ignore other string delimiters in string', async () => {
      prepareCM(`var a = { foo: 'a"  "b' };`, 0, 18);

      const range = rangeSmartAround();
      
      expect(range).to.equal('a"  "b');
    });
    
    it('ignore string delimiter in string if escaped', async () => {
      prepareCM(`var a = { foo: 'ab\\'c' };`, 0, 18);
      
      const range = rangeSmartAround();
      
      expect(range).to.equal("ab\\'c");
    });
    
    it('do not ignore string delimiter if escaped twice', async () => {
      prepareCM('var a = { foo: "ab\\\\" };', 0, 18);

      const range = rangeSmartAround();
      
      expect(range).to.equal("ab\\\\");
    });
    
    it('ignore string delimiter in string if escaped thrice', async () => {
      prepareCM(`var a = { foo: 'ab\\\\\\'c' };`, 0, 18);

      const range = rangeSmartAround();
      
      expect(range).to.equal("ab\\\\\\'c");
    });
    
    it('handle template parts in template string', async () => {
      prepareCM('var a = `abc${foo}def`;', 0, 15);

      const range = rangeSmartAround();
      
      expect(range).to.equal('foo');
    });
    
    it('ignore template parts if escaped', async () => {
      prepareCM('var a = `abc\\${foo}def`;', 0, 18);

      const range = rangeSmartAround();
      
      expect(range).to.equal('abc\\${foo}def');
    });
    
  });

  describe('item', function () {

    xit('fixture works', async () => {
      const text = `var a = { foo: 42 };`;
      prepareCM(text, 1, 10);

      expect(lcm).to.be.defined;
      expect(lcm.astCapabilities).to.be.defined;
      expect(cm).to.be.defined;
      cm.triggerOnKeyDown('d');

      expect(lcm.value).to.equal(text);
    });
  });
});