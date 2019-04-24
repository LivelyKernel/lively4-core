'enable aexpr';
'use strict';

import chai, {expect} from 'src/external/chai.js';
import sinon from 'src/external/sinon-3.2.1.js';
import sinonChai from 'src/external/sinon-chai.js';
chai.use(sinonChai);

describe('Data Structure Hooks', () => {

  describe('Arrays as Data Structures', () => {
    xit('detects a newly pushed element', () => {
      const spy = sinon.spy();
      const arr = [1,2];
      const expr = aexpr(() => arr).onChange(spy);

      arr.push(42);
      expr.checkAndNotify();

      expect(spy).to.be.calledOnce;
      expect(spy.getCall(0).args[0]).to.equal(arr);
    });
    xit('identity does not matter/arrays as value classes', () => {
      const spy = sinon.spy();
      let arr = [1,2];
      const expr = aexpr(() => arr).onChange(spy);

      arr = [1,2];

      expect(spy).not.to.be.called;
    });
    
  });
  
  describe('Sets as Data Structures', () => {
    it('detects a newly added element', () => {
      const spy = sinon.spy();
      const set = new Set([1,2]);
      const expr = aexpr(() => set).onChange(spy);

      set.add(42);
      // expr.checkAndNotify();

      expect(spy).to.be.calledOnce;
      expect(spy.getCall(0).args[0]).to.equal(set);
    });
    xit('identity does not matter/sets as value classes', () => {
      const spy = sinon.spy();
      let set = new Set([1,2]);
      const expr = aexpr(() => set).onChange(spy);

      set = new Set([1,2]);

      expect(spy).not.to.be.called;
    });
    xit('order of insertion does not matter/set semantic', () => {
      const spy = sinon.spy();
      let set = new Set([1,2]);
      const expr = aexpr(() => set).onChange(spy);

      set = new Set([2,1]);

      expect(spy).not.to.be.called;
    });
  });
  describe('Maps as Data Structures', () => {
    xit('detects a newly added element (maps)', () => {
      const spy = sinon.spy();
      const map = new Map([[1,2]]);
      const expr = aexpr(() => map).onChange(spy);

      map.set(42, {});
      expr.checkAndNotify();

      expect(spy).to.be.calledOnce;
      expect(spy.getCall(0).args[0]).to.equal(map);
    });
    xit('identity does not matter/maps as value classes', () => {
      const spy = sinon.spy();
      let map = new Map([[1,2]]);
      const expr = aexpr(() => map).onChange(spy);

      map = new Map([[1,2]]);

      expect(spy).not.to.be.called;
    });
    xit('order of insertion does not matter/map semantic', () => {
      const spy = sinon.spy();
      let map = new Map([[1,2],[3,4]]);
      const expr = aexpr(() => map).onChange(spy);

      map = new Map([[3,4],[1,2]]);

      expect(spy).not.to.be.called;
    });
  });
});