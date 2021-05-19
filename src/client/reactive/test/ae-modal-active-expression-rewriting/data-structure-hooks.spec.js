'ae';
'use strict';

import chai, {expect} from 'src/external/chai.js';
import sinon from 'src/external/sinon-3.2.1.js';
import sinonChai from 'src/external/sinon-chai.js';
chai.use(sinonChai);

describe('Data Structure Hooks', () => {

  describe('Arrays as Data Structures', () => {

    it('detects a newly pushed element', () => {
      const spy = sinon.spy();
      const arr = [1,2];
      const expr = aexpr(() => arr).onChange(spy);

      arr.push(42);

      expect(spy).to.be.calledOnce;
      expect(spy.getCall(0).args[0]).to.equal(arr);
    });

    it('detects indexed access in expression', () => {
      const spy = sinon.spy();
      const arr = [1,2,3];
      const expr = aexpr(() => arr[0]).onChange(spy);

      arr.unshift(0);

      expect(spy).to.be.calledOnce;
      expect(spy.getCall(0).args[0]).to.equal(0);
    });

    it('detects access in expression for first element', () => {
      const spy = sinon.spy();
      const arr = [1,2,3];
      const expr = aexpr(() => arr.first).onChange(spy);

      arr.unshift(0);

      expect(spy).to.be.calledOnce;
      expect(spy.getCall(0).args[0]).to.equal(0);
    });

    it('detects write access to first element', () => {
      const spy = sinon.spy();
      const arr = [1,2,3];
      const expr = aexpr(() => arr.first).onChange(spy);

      arr.first = 0;

      expect(spy).to.be.calledOnce;
      expect(spy.getCall(0).args[0]).to.equal(0);
    });

    it('detects access in expression for last element', () => {
      const spy = sinon.spy();
      const arr = [1,2,3];
      const expr = aexpr(() => arr.last).onChange(spy);

      arr.push(4);

      expect(spy).to.be.calledOnce;
      expect(spy.getCall(0).args[0]).to.equal(4);
    });

    it('detects write access to last element', () => {
      const spy = sinon.spy();
      const arr = [1,2,3];
      const expr = aexpr(() => arr.last).onChange(spy);

      arr.last = 0;

      expect(spy).to.be.calledOnce;
      expect(spy.getCall(0).args[0]).to.equal(0);
    });

    xit('detects an indexed write', () => {
      const spy = sinon.spy();
      const arr = [1,2];
      const expr = aexpr(() => arr).onChange(spy);

      arr[1] = 3;

      expect(spy).to.be.calledOnce;
      expect(spy.getCall(0).args[0]).to.equal(arr);
    });

    xit('detects an indexed write outside existing values', () => {
      const spy = sinon.spy();
      const arr = [1,2];
      const expr = aexpr(() => arr).onChange(spy);

      arr[4] = 5;

      expect(spy).to.be.calledOnce;
      expect(spy.getCall(0).args[0]).to.equal(arr);
    });

    xit('detects changes to the length property', () => {
      const spy = sinon.spy();
      let arr = [1,2];
      const expr = aexpr(() => arr).onChange(spy);

      arr.length = 1;
      expect(spy).to.be.calledOnce;
      expect(spy.getCall(0).args[0]).to.equal(arr);

      arr.length = 0;
      expect(spy).to.be.calledOnce;
      expect(spy.getCall(0).args[0]).to.equal(arr);
    });

    it('monitoring does not influence length property', () => {
      let arr = [1,2];
      const expr = aexpr(() => arr);

      expect(arr.length).to.equal(2);
    });

  });

  describe('Sets as Data Structures', () => {
    it('detects a newly added element', () => {
      const spy = sinon.spy();
      const set = new Set([1,2]);
      aexpr(() => set).onChange(spy);

      set.add(42);

      expect(spy).to.be.calledOnce;
      expect(spy.getCall(0).args[0]).to.equal(set);
    });

    it('do not detect an already existing item', () => {
      const spy = sinon.spy();
      const set = new Set([1,2]);
      aexpr(() => set).onChange(spy);

      set.add(2);

      expect(spy).not.to.be.called;
    });

    it('detects a cleared set', () => {
      const spy = sinon.spy();
      const set = new Set([1,2]);
      aexpr(() => set).onChange(spy);

      set.clear();

      expect(spy).to.be.calledOnce;
      expect(spy.getCall(0).args[0]).to.equal(set);
    });

    it('detects a changed set size', () => {
      const spy = sinon.spy();
      const set = new Set([1,2]);
      aexpr(() => set.size).onChange(spy);

      set.add(3);
      expect(spy).to.be.calledOnce;
      expect(spy.getCall(0).args[0]).to.equal(set.size);
      spy.reset();

      set.clear();
      expect(spy).to.be.calledOnce;
      expect(spy.getCall(0).args[0]).to.equal(set.size);
      spy.reset();
    });

  });

  describe('Maps as Data Structures', () => {
    it('detects a newly added element (maps)', () => {
      const spy = sinon.spy();
      const map = new Map([[1,2]]);
      const expr = aexpr(() => map).onChange(spy);

      map.set(42, {});

      expect(spy).to.be.calledOnce;
      expect(spy.getCall(0).args[0]).to.equal(map);
    });

    it('detects a new value for existing key', () => {
      const spy = sinon.spy();
      const map = new Map([[1,2]]);
      aexpr(() => map).onChange(spy);

      map.set(1,3);

      expect(spy).to.be.calledOnce;
      expect(spy.getCall(0).args[0]).to.equal(map);
    });

    it('do not detect identical value for key', () => {
      const spy = sinon.spy();
      const map = new Map([[1,2]]);
      aexpr(() => map).onChange(spy);

      map.set(1,2);

      expect(spy).not.to.be.called;
    });

    it('detects a cleared map', () => {
      const spy = sinon.spy();
      const map = new Map([[1,2]]);
      aexpr(() => map).onChange(spy);

      map.clear();

      expect(spy).to.be.calledOnce;
      expect(spy.getCall(0).args[0]).to.equal(map);
    });

    it('detects a changed map size', () => {
      const spy = sinon.spy();
      const map = new Map([[1,2]]);
      aexpr(() => map.size).onChange(spy);

      map.set(3, 4);
      expect(spy).to.be.calledOnce;
      expect(spy.getCall(0).args[0]).to.equal(map.size);
      spy.reset();

      map.clear();
      expect(spy).to.be.calledOnce;
      expect(spy.getCall(0).args[0]).to.equal(map.size);
    });

    it('identity does not matter/maps as value classes', () => {
      const spy = sinon.spy();
      let map = new Map([[1,2]]);
      const expr = aexpr(() => map).onChange(spy);

      map = new Map([[1,2]]);

      expect(spy).not.to.be.called;
    });

    it('order of insertion does not matter/map semantic', () => {
      const spy = sinon.spy();
      let map = new Map([[1,2],[3,4]]);
      const expr = aexpr(() => map).onChange(spy);

      map = new Map([[3,4],[1,2]]);

      expect(spy).not.to.be.called;
    });

  });

});
