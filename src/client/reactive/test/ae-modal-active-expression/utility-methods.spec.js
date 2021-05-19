"ae";

import chai, {expect} from 'src/external/chai.js';
import sinon from 'src/external/sinon-3.2.1.js';
import sinonChai from 'src/external/sinon-chai.js';
chai.use(sinonChai);

describe('Iterators and Utility Methods for Active Expressions', () => {

  describe('.gotDisposed', () => {

    it("aexprs define .gotDisposed", () => {
      expect(aexpr(() => {})).to.respondTo('gotDisposed');
    });

    it("caches its Promise", () => {
      const ae = aexpr(() => {});
      expect(ae.gotDisposed()).to.equal(ae.gotDisposed());
    });

    it("Promise resolved if already disposed", async () => {
      const ae = aexpr(() => {});
      ae.dispose();
      const prom = ae.gotDisposed();

      // promise resolved
      await prom;
    });

    it("Promise resolves later when ae gets disposed", async () => {
      const ae = aexpr(() => {});
      const prom = ae.gotDisposed();

      lively.sleep(30).then(() => ae.dispose());

      await lively.sleep(15);
      expect(ae.isDisposed()).to.be.false;

      // promise resolved
      await prom;
    });

  });

  describe('.values', () => {

    it("aexprs define .values", () => {
      expect(aexpr(() => {})).to.respondTo('values');
    });

    it(".values", async () => {
      let val = 0;

      const ae = aexpr(() => val);

      (async () => {
        // #TODO: do instantaneous change get applied for '.values()'?
        await lively.sleep(10);
        val++;
        await lively.sleep(10);
        val++;
        await lively.sleep(10);
        val++;

        await lively.sleep(10);
        ae.dispose();

        await lively.sleep(10);
        val++;
      })();

      let j = 0;
      for await (let v of ae.values()) {
        j++;
        expect(v).to.equal(j);
      }
      expect(j).to.equal(3);
    });

    it(".values can deal with multiple changes in a synchronous execution", async () => {
      let val = 0;

      const ae = aexpr(() => val);

      (async () => {
        await lively.sleep(10);
        val++;
        val++;
        val++;
        ae.dispose();
        val++;
      })();

      let j = 0;
      for await (let v of ae.values()) {
        j++;
        expect(v).to.equal(j);
      }
      expect(j).to.equal(3);
    });

    it("multiple .values can co-exist", async () => {
      let val = 0;

      const ae = aexpr(() => val);

      (async () => {
        await lively.sleep(10);
        val++;
        val++;
        val++;
        ae.dispose();
        val++;
      })();

      async function loop() {
        let j = 0;
        for await (let v of ae.values()) {
          j++;
          expect(v).to.equal(j);
        }
        return j;
      }

      const iterationCounts = await Promise.all((2).times(loop));
      iterationCounts.forEach(j => {
        expect(j).to.equal(3);
      });
    });

    describe('understanding generators', () => {

      it("plain generators", () => {
        function* gen() {
          yield 1;
          yield 2;
          yield 3;
        }

        const iter = gen()

        expect(iter.next().value).to.equal(1);
        expect(iter.next().value).to.equal(2);
        expect(iter.next().value).to.equal(3);
        expect(iter.next().done).to.equal(true);
      });

      it("generators and for loops", () => {
        function* gen() {
          yield 1;
          yield 2;
          yield 3;
        }

        let j = 0;
        for (let i of gen()) {
          j++;
          expect(i).to.equal(j);
        }
        expect(j).to.equal(3);
      });

      it("async generators and for await loops", async () => {
        async function* gen() {
          lively.sleep(1);
          yield 1;
          lively.sleep(1);
          yield Promise.resolve(2);
          lively.sleep(1);
          yield 3;
        }

        let j = 0;
        for await  (let i of gen()) {
          j++;
          expect(i).to.equal(j);
        }
        expect(j).to.equal(3);
      });

    });

  });

  describe('nextValue', () => {

    it("aexprs define nextValue", () => {
      expect(aexpr(() => {})).to.respondTo('nextValue');
    });

    it("nextValue returns a Promise", () => {
      expect(aexpr(() => {}).nextValue()).to.be.an.instanceof(Promise);
    });

    it("nextValue resolves on first change of monitored expression", async () => {
      let obj = {a: 1},
          spy = sinon.spy();

      let axp = aexpr(() => obj.a);

      async function waitingForChange() {
        const v = await axp.nextValue();
        spy(v);
      }

      waitingForChange();

      expect(spy).not.to.be.called;

      obj.a = 42;
      // await is resolved as a separate micro task
      expect(spy).not.to.be.called;

      await lively.sleep(10);

      expect(spy).to.be.calledOnce;
      expect(spy).to.be.calledWith(42);
      spy.reset();

      obj.a = 43;

      await lively.sleep(10);
      expect(spy).not.to.be.called;
    });

  });

});
