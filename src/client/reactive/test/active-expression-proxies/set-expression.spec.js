"use proxies for aexprs";
import { reset } from 'active-expression-proxies';

import chai, { expect } from "src/external/chai.js";
import sinon from "src/external/sinon-3.2.1.js";
import sinonChai from "src/external/sinon-chai.js";
chai.use(sinonChai);

describe('.setExpression (Rewriting Active Expressions)', () => {
  it("calls callback immediately", () => {
    let spy = sinon.spy(),
        obj = { a: 1, b: 2 };
    let ae = aexpr(() => obj.a).onChange(spy);

    ae.setExpression(() => obj.b);
    expect(spy).to.be.calledOnce;
  });

  it("monitores the new dependencies", () => {
    let spy = sinon.spy(),
        obj = { a: 1, b: 1 };
    let ae = aexpr(() => obj.a).onChange(spy);

    ae.setExpression(() => obj.b);
    expect(spy).not.to.be.called;

    obj.b = 2
    expect(spy).to.be.calledOnce;
  });

  it("monitores a new object", () => {
    let spy = sinon.spy(),
        obj1 = { a: 1 },
        obj2 = { a: 1 };

    let ae = aexpr(() => obj1.a).onChange(spy);

    ae.setExpression(() => obj2.a);
    expect(spy).not.to.be.called;

    obj2.a = 2
    expect(spy).to.be.calledOnce;
  });

  // #TODO: checkImmediately: false feels weird
  // #TODO: either get rid of it entirely or find out, whether we want lastValue to be the last value of the old expression or the current value of the new expression
  it("checkImmediately: false", () => {
    let spy = sinon.spy(),
        obj = { a: 1, b: 2 };
    let ae = aexpr(() => obj.a).onChange(spy);

    ae.setExpression(() => obj.b, { checkImmediately: false });
    expect(spy).not.to.be.called;

    obj.b = 3
    // #UNCERTAIN: what is lastValue here?
    expect(spy).to.be.calledOnce;
  });

});
