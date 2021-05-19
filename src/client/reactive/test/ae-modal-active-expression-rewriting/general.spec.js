"ae";

import chai, {expect} from 'src/external/chai.js';
import sinon from 'src/external/sinon-3.2.1.js';
import sinonChai from 'src/external/sinon-chai.js';
chai.use(sinonChai);

describe('simple listeners', () => {

  it("listen on a local variable", () => {
      let val = 17,
          spy = sinon.spy();

      aexpr(() => val)
          .onChange(spy);

      val = 33;

      expect(spy.called).to.be.true;
  });

});

describe('asAExpr', () => {

  it('rewriting aexprs support asAExprs', () => {
    const expr = aexpr(() => 1);

    expect(expr.asAExpr).to.be.ok;
    expect(expr.asAExpr).to.be.a('function');
  });

  it('aexpr.asAExpr returns itself', () => {
    const expr = aexpr(() => 1);

    expect(expr.asAExpr()).to.equal(expr);
  });

  // #TODO: `fn.asAExpr()` would return a rewriting-aexpr, but this file is rewritten in modal style, so changes are not recognized in the correct change detection system
  xit('rewriting aexprs support asAExprs', () => {
    var val = 1;
    const fn = () => val;
    const ae = aexpr(fn);

    const fnSpy = sinon.spy();
    const aeSpy = sinon.spy();

    fn.asAExpr().onChange(fnSpy);
    ae.asAExpr().onChange(aeSpy);

    val++;

    expect(fnSpy).to.be.calledOnce;
    expect(aeSpy).to.be.calledOnce;
    expect(fnSpy).to.be.calledWith(2);
    expect(aeSpy).to.be.calledWith(2);
    expect(aeSpy).to.be.calledBefore(fnSpy);
  });

});
