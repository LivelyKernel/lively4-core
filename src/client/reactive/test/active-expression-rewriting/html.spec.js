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

    xit('value', () => {
    });

  });

  describe('input element', () => {

    xit('detects a change in text input', () => {
      const spy = sinon.spy();
      const input = gen(<input value="hello"></input>)
      
      const expr = aexpr(() => input.value).onChange(spy);

      eval('input.value = "world";')

      expect(spy).to.be.calledOnce;
      expect(spy.getCall(0).args[0]).to.equal("world");
    });

    xit('detects a change in checkbox', () => {
    });

  });

});