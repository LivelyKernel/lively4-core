"use strict";
import chai, {expect} from 'node_modules/chai/chai.js';
import sinon from 'src/external/sinon-3.2.1.js';
import sinonChai from 'node_modules/sinon-chai/lib/sinon-chai.js';
chai.use(sinonChai);

describe('AExpr Test Setup', function() {

    it('empty test', () => {});

  it('chai expect-styled assertions', () => {
      expect(true).to.be.true;
    });

    it('sinon-style assertions on spys', () => {
      let spy = sinon.spy();
      spy(42);
      spy.calledWith(42);
			expect(spy.withArgs(42).calledOnce).to.be.ok;
    });

    it('sinon-chai integration', () => {
      let spy = sinon.spy();
      spy(42);
      expect(spy).to.have.been.calledOnce;
      expect(spy).to.have.been.calledWith(42);
    });
});
