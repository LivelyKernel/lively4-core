import chai, {expect} from 'src/external/chai.js';
import sinon from 'src/external/sinon-3.2.1.js';
import sinonChai from 'src/external/sinon-chai.js';
chai.use(sinonChai);
const assert = chai.assert;

import 'src/client/lang/lang.js';
import 'src/client/lang/lang-ext.js';
import 'src/client/lang/lang-zone.js';

describe('Zones', function() {

  it('`Zone` is globally defined', () => {
    expect(Zone).to.be.defined;
  });

  describe('Zone.root', function() {

    it('`Zone.root` is defined', () => {
      expect(Zone).to.have.property('root');
    });

    it('`Zone.root` is a global zone', () => {
      expect(Zone.root).to.have.property('global', true);
    });

  });

  describe('Zone.current', function() {

    it('`Zone.current` is defined', () => {
      expect(Zone).to.have.property('current')
    });

    it('applies prototypical inheritance', async () => {
      const outerZone = Zone.current;
      const expectedValue = 17;

      let middleZone, innerZone;
      let executed = false;
      await runZoned(async () => {
        middleZone = Zone.current;
        middleZone.middleProp = expectedValue;
        await runZoned(async () => {
          innerZone = Zone.current;
          executed = true;
        });
      });
      expect(executed).to.be.true;
      
      expect(middleZone.middleProp).to.equal(expectedValue);
      expect(innerZone.middleProp).to.equal(expectedValue);
      assert.notStrictEqual(innerZone, outerZone);
    });

    it('keeps a reference to its parent', async () => {
      const outerZone = Zone.current;
      
      let middleZone, innerZone;
      let executed = false;
      await runZoned(async () => {
        middleZone = Zone.current;

        await runZoned(async () => {
          innerZone = Zone.current;
          executed = true;
        });
      });
      expect(executed).to.be.true;

      // parent reference
      assert.strictEqual(middleZone.parent, outerZone);
      assert.strictEqual(innerZone.parent, middleZone);
    });

    it('child zone can access properties given as zone values', async () => {
      let innerZone;
      await runZoned(async () => {
        await runZoned(async () => {
          innerZone = Zone.current;
        });
      }, { zoneValues: { p: 42 }});

      expect(innerZone).to.have.property('p', 42);
    });

  });

  describe('runZoned', function() {

    it('`runZoned` is globally defined', () => {
      expect(runZoned).to.be.defined;
    });

    it('`runZoned` runs the function', async (done) => {
      let executed = false;

      await runZoned(() => {
        executed = true;
      })

      expect(executed).to.be.true;
      done()
    });

    it('returns the function\'s return value', async (done) => {
      console.log("BEFORE T1 runZoned")
      const result = await runZoned(() => 42);
      console.log("AFTER T1 runZoned", result)
      expect(result).to.equal(42);
      done()
    });

    it('runs code in its own zone', async (done) => {
      const outerZone = Zone.current;
      // #TODO fix / test zones so that "done" is not needed
      let innerZone;
      console.log("BEFORE T2 runZoned")
      await runZoned(() => {
        console.log("IN1 runZoned")
        innerZone = Zone.current;
        console.log("IN2 runZoned")
      });
      console.log("AFTER runZoned", innerZone !== outerZone)
      assert.notStrictEqual(innerZone, outerZone);
      console.log("AFTER assert")
      
      done()
    });

    it('keeps the zone consistent across native await', async (done) => {
      let innerZone1, innerZone2;
      await runZoned(async () => {
        innerZone1 = Zone.current;
        await lively.sleep(20);
        innerZone2 = Zone.current;
      });
      
      assert.strictEqual(innerZone1, innerZone2);
      done()
    });

    it('attaches zone properties', async (done) => {
      const outerZone = Zone.current;
      
      let innerZone;
      await runZoned(async () => {
        innerZone = Zone.current;
      }, { zoneValues: { p: 42 } });

      expect(innerZone).to.have.property('p', 42);
      done()
    });

    it('tracks zones over native await on primitive values', async (done) => {
      let callback;
      const prom = new Promise(resolve => callback = resolve);

      let innerZone;
      async function f3() {
        await 42;
        assert.strictEqual(Zone.current, innerZone);
        callback()
      }
      async function f2() {
        await f3();
      }
      
      await runZoned(async () => {
        innerZone = Zone.current;
        await f2();
      });
      
      await prom;
      done()
    });

    it('handles errors correctly', async (done) => {
      let catchCalled = false;
      let finallyCalled = false;
      
      const expectedError = new Error('expected')
      
      try {
        await runZoned(async () => {
          throw expectedError;
        });
      } catch (e) {
        catchCalled = true;
      } finally {
        finallyCalled = true
      }
      
      expect(catchCalled).to.be.true;
      expect(finallyCalled).to.be.true;
      
      done()
    });

    it('handles errors correctly after native await on a primitive', async (done) => {
      let catchCalled = false;
      let finallyCalled = false;
      
      const expectedError = new Error('expected')
      
      try {
        await runZoned(async () => {
          await 42;
          throw expectedError;
        });
      } catch (e) {
        catchCalled = true;
      } finally {
        finallyCalled = true
      }
      
      expect(catchCalled).to.be.true;
      expect(finallyCalled).to.be.true;
      
      done()
    });

  });

});

describe('lang', function() {

  describe('Number.remap', function() {

    it('degenerated domain and range', () => {
      expect(() => {
        (1).remap([2,2], [3,4])
      }).to.throw(Error, /domain start and end are equal/)
      expect((1).remap([3, 4], [2, 2])).to.equal(2);
    });

    it('simple', () => {
      expect((1.0).remap([1, 2], [5, 6])).to.equal(5.0);
      expect((1.2).remap([1, 2], [5, 6])).to.equal(5.2);
      expect((1.4).remap([1, 2], [5, 6])).to.equal(5.4);
      expect((1.6).remap([1, 2], [5, 6])).to.equal(5.6);
      expect((1.8).remap([1, 2], [5, 6])).to.equal(5.8);
      expect((2.0).remap([1, 2], [5, 6])).to.equal(6.0);
    });

    it('inverse start and end', () => {
      expect((11).remap([13, 10], [3, 6])).to.equal(5); // inverse start
      expect((11).remap([10, 13], [6, 3])).to.equal(5); // inverse end
      expect((11).remap([13, 10], [6, 3])).to.equal(4); // both
    });

    it('clip', () => {
      expect((7.5).remap([0, 10], [1, 2], true)).to.equal(1.75);
      expect((11).remap([0, 10], [1, 2], true)).to.equal(2);
      expect((11).remap([10, 0], [1, 2], true)).to.equal(1);
    });

  });

  describe('computeDiff', function() {

    describe('Object diff', function() {

      it('compare Objects',  () => {
        const o1 = { foo: 1, bar: 2,         baz: 4 };
        const o2 = {                 bar: 3, baz: 4 };
        
        const [only1, both, only2] = o1.computeDiff(o2);
        
        expect(only1).to.be.an('object');
        expect(only1).to.have.property('foo', 1);
        expect(only1).to.have.property('bar', 2);
        expect(only1).to.not.have.property('baz');

        expect(both).to.be.an('object');
        expect(both).to.not.have.property('foo');
        expect(both).to.not.have.property('bar');
        expect(both).to.have.property('baz', 4);

        expect(only2).to.be.an('object');
        expect(only2).to.not.have.property('foo');
        expect(only2).to.have.property('bar', 3);
        expect(only2).to.not.have.property('baz');

      });

    });

    describe('Array diff', function() {

      it('compare Arrays',  () => {
        const arr1 = [1,2,3];
        const arr2 = [2,3,4,5];
        
        const [only1, both, only2] = arr1.computeDiff(arr2);
        
        expect(only1).to.be.an('array')
        expect(only1).to.have.property('length', 1);
        expect(only1).to.include(1);

        expect(both).to.be.an('array')
        expect(both).to.have.property('length', 2);
        expect(both).to.include(2);
        expect(both).to.include(3);

        expect(only2).to.be.an('array')
        expect(only2).to.have.property('length', 2);
        expect(only2).to.include(4);
        expect(only2).to.include(5);
      });

      it('compare with empty Array',  () => {
        const arr1 = [1,2,3];
        const arr2 = [];
        
        const [only1, both, only2] = arr1.computeDiff(arr2);
        
        expect(only1).to.be.an('array')
        expect(only1).to.have.property('length', 3);
        expect(only1).to.include(1);
        expect(only1).to.include(2);
        expect(only1).to.include(3);

        expect(both).to.be.an('array')
        expect(both).to.be.empty;

        expect(only2).to.be.an('array')
        expect(only2).to.be.empty;
      });

      it('compare with empty Array',  () => {
        const arr1 = [];
        const arr2 = [3,4];
        
        const [only1, both, only2] = arr1.computeDiff(arr2);
        
        expect(only1).to.be.an('array')
        expect(only1).to.be.empty;

        expect(both).to.be.an('array')
        expect(both).to.be.empty;

        expect(only2).to.be.an('array')
        expect(only2).to.include(3);
        expect(only2).to.include(4);
      });

    });

    describe('Set diff', function() {

      it('compare Sets',  () => {
        const s1 = new Set([1,2,3])
        const s2 = new Set([2,3,4,5])
        
        const [only1, both, only2] = s1.computeDiff(s2);
        
        expect(only1).to.be.an.instanceof(Set);
        expect(only1).to.have.property('size', 1);
        expect(only1.has(1)).to.be.true;

        expect(both).to.be.an.instanceof(Set);
        expect(both).to.have.property('size', 2);
        expect(both.has(2)).to.be.true;
        expect(both.has(3)).to.be.true;

        expect(only2).to.be.an.instanceof(Set);
        expect(only2).to.have.property('size', 2);
        expect(only2.has(4)).to.be.true;
        expect(only2.has(5)).to.be.true;

      });

    });

    describe('Map diff', function() {

      it('compare Maps',  () => {
        const m1 = new Map([[1,2],[3,4],[5,6]])
        const m2 = new Map([      [3,4],      [5,7]])
        
        const [only1, both, only2] = m1.computeDiff(m2);
        
        expect(only1).to.be.an.instanceof(Map);
        expect(only1).to.have.property('size', 2);
        expect(only1.get(1)).to.equal(2);
        expect(only1.get(5)).to.equal(6);

        expect(both).to.be.an.instanceof(Map);
        expect(both).to.have.property('size', 1);
        expect(both.get(3)).to.equal(4);

        expect(only2).to.be.an.instanceof(Map);
        expect(only2).to.have.property('size', 1);
        expect(only2.get(5)).to.equal(7);

      });

    });


  });

});

describe('Array', function() {

  it('pluck',  () => {
    const arr = [{ a: 1 }, { a: 2 }, { a: 3 }];
    expect(arr.pluck('a')).to.eql([1, 2, 3]);
  });

  describe('minProp, maxProp', function() {

    it('identity',  () => {
      const arr = [1, 2, 3];
      expect(arr.minProp()).to.eql(1);
      expect(arr.maxProp()).to.eql(3);
    });
    it('property',  () => {
      const arr = [{ a: 1 }, { a: 2 }, { a: 3 }];
      expect(arr.minProp('a')).to.eql(1);
      expect(arr.maxProp('a')).to.eql(3);
    });
    it('deep property',  () => {
      const arr = [{ a: { b: 1 } }, { a: { b: 2 } }, { a: { b: 3 } }];
      expect(arr.minProp('a.b')).to.eql(1);
      expect(arr.maxProp('a.b')).to.eql(3);
    });
    it('callback',  () => {
      const arr = [{ a: 1 }, { a: 2 }, { a: 3 }];
      expect(arr.minProp(ea => ea.a)).to.eql(1);
      expect(arr.maxProp(ea => ea.a)).to.eql(3);
    });

  });

});


