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


