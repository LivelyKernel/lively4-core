'enable aexpr';
'use strict';

import chai, {expect} from 'src/external/chai.js';
import sinon from 'src/external/sinon-3.2.1.js';
import sinonChai from 'src/external/sinon-chai.js';
chai.use(sinonChai);


function gen(ele) {
  return ele;
}

describe('HTML Elements and Web Components', () => {

  describe('html elements', () => {

    it('setAttribute', async () => {
      const spy = sinon.spy();
      const p = gen(<p testAttr="5"></p>)
      self.xTest = 0;

      // aexpr(() => p.getAttribute('testAttr')).onChange(spy);
      aexpr(() => p.getAttribute('testAttr')).onChange(val => {
        self.xTest++;
        debugger
        lively.notify('WORK',val+' <-');
        spy(val);
      });

      // spy(43)
      expect(p.getAttribute('testAttr')).to.equal("5");

      p.setAttribute('testAttr', 42)
      expect(p.getAttribute('testAttr')).to.equal('42');
      await lively.sleep(10)

      expect(self.xTest).to.equal(1);
      expect(spy).to.be.calledOnce;
      expect(spy.getCall(0).args[0]).to.equal('42');
    });

    xit('id', () => {
    });
    xit('classList', () => {
    });
    xit('style', () => {
    });
    xit('querySelector', () => {
    });
    xit('querySelectorAll', () => {
    });

  });

  describe('Morphs', () => {

    xit('get', () => {
    });

    xit('getAllSubMorphs', () => {
    });

  });

  describe('lively modifications', () => {

    xit('lively.setGlobalPosition', () => {
    });

    xit('lively.setExtent', () => {
    });

    xit('lively.setPosition', () => {
    });

  });

  describe('CodeMirror', () => {

    it('value', async function() {
      // code mirror takes longer to load
      this.timeout(30000);
      
      const editor = await lively.create('lively-code-mirror');
      await editor.editorLoaded();

      editor.value = `some string`;

      const spy = sinon.spy();
      aexpr(() => editor.value).onChange(spy);

      editor.editor.replaceRange("added ", {line:0, ch:0}, {line:0, ch:0})

      expect(spy).to.be.calledOnce;
      expect(spy.getCall(0).args[0]).to.equal("added some string");
    });

  });

  describe('input element', () => {

    // this is a meta test to check whether we can invoke an InputEvent programmatically (needed to test further functionality)
    it('programmatically invoke a user event', () => {
      const input = gen(<input value="hello"></input>);
      const spy = sinon.spy();
      input.addEventListener('input', spy);
      
      eval('input.value = "world";');
      input.dispatchEvent(new Event('input'));
      
      expect(spy).to.be.calledOnce;
    });

    it('detects a change in text input', () => {
      const input = gen(<input value="hello"></input>);
      const spy = sinon.spy();
      aexpr(() => input.value).onChange(spy);
      
      eval('input.value = "world";');
      input.dispatchEvent(new Event('input'));
      
      expect(spy).to.be.calledOnce;
      expect(spy.getCall(0).args[0]).to.equal("world");
    });

    it('detects a change in checkbox', () => {
      const input = gen(<input type="checkbox" checked></input>);
      const spy = sinon.spy();
      aexpr(() => input.checked).onChange(spy);

      eval('input.checked = false;');
      input.dispatchEvent(new Event('input'));

      expect(spy).to.be.calledOnce;
      expect(spy.getCall(0).args[0]).to.equal(false);
    });

  });

});