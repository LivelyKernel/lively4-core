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

    xit('setAttribute', () => {
      const spy = sinon.spy();
      const p = gen(<p testAttr="5"></p>)

      const expr = aexpr(() => p.getAttribute('testAttr')).onChange(spy);

      expect(p.getAttribute('testAttr')).to.equal("5");

      p.setAttribute('testAttr', 42)

      expect(spy).to.be.calledOnce;
      expect(spy.getCall(0).args[0]).to.equal(43);
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
      // this.timeout(55000);
      
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