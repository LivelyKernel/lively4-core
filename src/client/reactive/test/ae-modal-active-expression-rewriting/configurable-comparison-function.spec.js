'ae';
'use strict';

import chai, {expect} from 'src/external/chai.js';
import sinon from 'src/external/sinon-3.2.1.js';
import sinonChai from 'src/external/sinon-chai.js';
chai.use(sinonChai);

import { BaseActiveExpression } from '../../active-expression/active-expression.js';

describe('Configurable Comparison Function', () => {

  describe('Identity as default for objects', () => {
  });

  // #TODO: other implementation strategies have to detect those changes
  describe('Arrays as Data Structures', () => {

    it('detects a newly pushed element', () => {
      const spy = sinon.spy();
      const arr = [1,2];
      const expr = aexpr(() => arr).onChange(spy);

      arr.push(42);

      expect(spy).to.be.calledOnce;
      expect(spy.getCall(0).args[0]).to.equal(arr);
    });

    it('identity does not matter/arrays as value classes', () => {
      const spy = sinon.spy();
      let arr = [1,2];
      const expr = aexpr(() => arr).onChange(spy);

      arr = [1,2];

      expect(spy).not.to.be.called;
    });

    describe('explicit option configured to identity', () => {
      it('array modification do not trigger callbacks', () => {
        const spy = sinon.spy();
        const arr = [1,2];
        const expr = aexpr(() => arr, { match: 'identity' }).onChange(spy);

        arr.push(42);

        expect(spy).not.to.be.called;
      });
      it('identity changes matter', () => {
        const spy = sinon.spy();
        let arr = [1,2];
        const expr = aexpr(() => arr, { match: 'identity' }).onChange(spy);

        arr = [1,2];

        expect(spy).to.be.calledOnce;
        expect(spy.getCall(0).args[0]).to.equal(arr);
      });
    });

    describe('explicit option set to shallow', () => {
      it('array modification triggers callbacks2', () => {
        const spy = sinon.spy();
        const arr = [1,2];
        const expr = aexpr(() => arr, { match: 'shallow' }).onChange(spy);

        arr.push(42);

        expect(spy).to.be.calledOnce;
        expect(spy.getCall(0).args[0]).to.equal(arr);
      });
      it('identity changes do not matter', () => {
        const spy = sinon.spy();
        let arr = [1,2];
        const expr = aexpr(() => arr, { match: 'shallow' }).onChange(spy);

        arr = [1,2];

        expect(spy).not.to.be.called;
      });
    });

    describe('explicit option set to deep', () => {
      it('array modification triggers callbacks', () => {
        const spy = sinon.spy();
        const arr = [1, { x: 4 }];
        const expr = aexpr(() => arr, { match: 'deep' }).onChange(spy);

        arr.push(42);
        expr.checkAndNotify();

        expect(spy).to.be.calledOnce;
        expect(spy.getCall(0).args[0]).to.equal(arr);
      });
      it('identity changes do not matter1', () => {
        const spy = sinon.spy();
        let arr = [1, { x: 4 }];
        const expr = aexpr(() => arr, { match: 'deep' }).onChange(spy);

        arr = [1, { x: 4 }];

        expect(spy).not.to.be.called;
      });
      it('nested property identity changes do not trigger1', () => {
        const spy = sinon.spy();
        let arr = [1, { x: 4 }];
        const expr = aexpr(() => arr, { match: 'deep' }).onChange(spy);

        arr[1] = { x: 4 };

        expect(spy).not.to.be.called;
      });
      it('nested property changes trigger', () => {
        const spy = sinon.spy();
        let arr = [1, { x: 4 }];
        const expr = aexpr(() => arr, { match: 'deep' }).onChange(spy);

        arr[1] = { x: 5};
        expr.checkAndNotify();

        expect(spy).to.be.calledOnce;
        expect(spy.getCall(0).args[0]).to.equal(arr);
      });
      it('nested property changes trigger (modify only a deep property)', () => {
        const spy = sinon.spy();
        let arr = [1, { x: 4 }];
        const expr = aexpr(() => arr, { match: 'deep' }).onChange(spy);

        arr[1].x = 5;
        expr.checkAndNotify();

        expect(spy).to.be.calledOnce;
        expect(spy.getCall(0).args[0]).to.equal(arr);
      });
    });

    describe('custom comparator (explicit option)', () => {
      const matchSecondProperty = {
        compare(lastResult, newResult) {
          return lastResult[1] === newResult[1];
        },
        store(newResult) { return [...newResult]; }
      }

      it('array modification triggers callbacks', () => {
        const spy = sinon.spy();
        const arr = [1, 2];
        const expr = aexpr(() => arr, { match: matchSecondProperty }).onChange(spy);

        arr.push(42);

        expect(spy).not.to.be.called;
      });

      // #TODO: this test failing when removing the explicit checkAndNotify means we do not detect dependencies in matcher or store functions!
      it('changing second property triggers callbacks', () => {
        const spy = sinon.spy();
        const arr = [1, 2];
        const expr = aexpr(() => arr, { match: matchSecondProperty }).onChange(spy);

        arr[1] = 3;
        expr.checkAndNotify();

        expect(spy).to.be.calledOnce;
        expect(spy.getCall(0).args[0]).to.equal(arr);
        spy.reset()

        arr.length = 1;
        expr.checkAndNotify();

        expect(spy).to.be.calledOnce;
        expect(spy.getCall(0).args[0]).to.equal(arr);
      });
    });

  });

  describe('Sets as Data Structures', () => {
    it('detects a newly added element', () => {
      const spy = sinon.spy();
      const set = new Set([1,2]);
      const expr = aexpr(() => set).onChange(spy);

      set.add(42);

      expect(spy).to.be.calledOnce;
      expect(spy.getCall(0).args[0]).to.equal(set);
    });
    it('set modification triggers callbacks with shallow matcher', () => {
      const spy = sinon.spy();
      const set = new Set([1,2]);
      const expr = aexpr(() => set, { match: 'shallow' }).onChange(spy);

      set.add(42);

      expect(spy).to.be.calledOnce;
      expect(spy.getCall(0).args[0]).to.equal(set);
    });
    it('identity does not matter/sets as value classes', () => {
      const spy = sinon.spy();
      let set = new Set([1,2]);
      const expr = aexpr(() => set).onChange(spy);

      set = new Set([1,2]);

      expect(spy).not.to.be.called;
    });
    it('order of insertion does not matter/set semantic', () => {
      const spy = sinon.spy();
      let set = new Set([1,2]);
      const expr = aexpr(() => set).onChange(spy);

      set = new Set([2,1]);

      expect(spy).not.to.be.called;
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
