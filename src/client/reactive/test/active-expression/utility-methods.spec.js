"enable aexpr";

import chai, {expect} from 'src/external/chai.js';
import sinon from 'src/external/sinon-3.2.1.js';
import sinonChai from 'src/external/sinon-chai.js';
chai.use(sinonChai);

describe('Iterators and Utility Methods for Active Expressions', () => {
  it("chainable", () => {
    let obj = {a: 2},
        spy = sinon.spy();

    aexpr(() => obj.a > 5)
      .onBecomeFalse(spy)
      .onBecomeTrue(spy)
      .onBecomeFalse(spy)
      .onBecomeTrue(spy);

    expect(spy).to.be.calledTwice;
  });

  it("flank up", () => {
    let obj = {a: 2},
        spy = sinon.spy();

    let axp = aexpr(() => obj.a > 5);
    axp.onBecomeTrue(spy);
    expect(spy).not.to.be.called;

    obj.a = 10;
    expect(spy).to.be.calledOnce;

    obj.a = 0;
    expect(spy).to.be.calledOnce;

    obj.a = 10;
    expect(spy).to.be.calledTwice;
  });

  it("immediately triggers onBecomeTrue", () => {
    let obj = {a: 7},
        spy = sinon.spy();

    let axp = aexpr(() => obj.a > 5);
    axp.onBecomeTrue(spy);
    expect(spy).to.be.calledOnce;

    obj.a = 0;
    expect(spy).to.be.calledOnce;

    obj.a = 10;
    expect(spy).to.be.calledTwice;
  });

  it("flank down", () => {
    let obj = {a: 2},
        spy = sinon.spy();

    let axp = aexpr(() => obj.a > 0);
    axp.onBecomeFalse(spy);
    expect(spy).not.to.be.called;

    obj.a = -2;
    expect(spy).to.be.calledOnce;

    obj.a = 2;
    expect(spy).to.be.calledOnce;

    obj.a = -2;
    expect(spy).to.be.calledTwice;
  });

  it("immediately triggers onBecomeFalse", () => {
    let obj = {a: -2},
        spy = sinon.spy();

    let axp = aexpr(() => obj.a > 0);
    axp.onBecomeFalse(spy);
    expect(spy).to.be.calledOnce;

    obj.a = 2;
    expect(spy).to.be.calledOnce;

    obj.a = -2;
    expect(spy).to.be.calledTwice;
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

    describe('thenable AExprs', () => {
      
      it("Active Expressions are thenables", async () => {
        let obj = {a: 1},
            spy = sinon.spy();

        let axp = aexpr(() => obj.a);
        
        async function waitingForChange() {
          const v = await axp;
          spy(v);
        }

        waitingForChange();

        expect(spy).not.to.be.called;

        // the following await is crutial, as the `.then` on axp is executed
        // in waitingForChange in its own micro task only AFTER this 
        // synchronous part is over!!!
        await lively.sleep(10);

        obj.a = 17;
        // await is resolved as a separate micro task
        expect(spy).not.to.be.called;

        await lively.sleep(10);

        expect(spy).to.be.calledOnce;
        expect(spy).to.be.calledWith(17);
        spy.reset();

        obj.a = 43;
        expect(spy).not.to.be.called;
      });

    });

  });
});
