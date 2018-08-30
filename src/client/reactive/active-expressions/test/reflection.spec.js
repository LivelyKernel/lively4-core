"enable aexpr";
import chai, {expect} from 'src/external/chai.js';
import sinon from 'src/external/sinon-3.2.1.js';
import sinonChai from 'src/external/sinon-chai.js';
chai.use(sinonChai);

import { aexpr as baseAExpr } from 'https://lively-kernel.org/lively4/aexpr/src/client/reactive/active-expressions/active-expressions/src/active-expressions.js'
import * as frameBasedAExpr from "frame-based-aexpr";

describe('Reflection', () => {

  describe('dependencies', () => {

    it('set and read a property', () => {
      const expr = aexpr(() => {});
      
      expect(expr.meta().get('name')).to.be.undefined;
      
      const expectedName = 'my test AExpr';
      expr.meta({ name: expectedName });
      
      expect(expr.meta().get('name')).to.equal(expectedName);
    });

    describe('provide info about strategy', () => {

      it('sets strategy meta to "Rewriting"', () => {
        const expr = aexpr(() => {});
        expect(expr.meta().get('strategy')).to.equal('Rewriting');
      });

      it('sets strategy meta to "Frame-based"', () => {
        const expr = frameBasedAExpr.aexpr(() => {});
        expect(expr.meta().get('strategy')).to.equal('Frame-based');
      });

    });

  });

  describe('dependencies', () => {

    describe('supportsDependencies', () => {

      it('base aexprs do not supportsDependencies', () => {
        const baseExpr = baseAExpr(() => {});
        expect(baseExpr).to.respondTo('supportsDependencies');
        expect(baseExpr.supportsDependencies()).to.be.false;
      });

      it('frame-based aexprs do not supportsDependencies', () => {
        const frameExpr = frameBasedAExpr.aexpr(() => {});
        expect(frameExpr).to.respondTo('supportsDependencies');
        expect(frameExpr.supportsDependencies()).to.be.false;
      });

      it('rewriting aexprs supportsDependencies', () => {
        const rewritingExpr = aexpr(() => {});
        expect(rewritingExpr).to.respondTo('supportsDependencies');
        expect(rewritingExpr.supportsDependencies()).to.be.true;
      });

    });

    describe('getDependencies', () => {

      it('getDependencies is defined', () => {
        const expr = aexpr(() => {});
        expect(expr).to.respondTo('getDependencies');
      });

      it('get a local dependency', () => {
        let x = 17;
        
        const expr = aexpr(() => x);
        
        x = 42;

        const deps = expr.getDependencies();
        expect(deps.locals()).to.have.lengthOf(1);
        expect(deps.locals()[0]).to.have.property('name', 'x');
        expect(deps.locals()[0]).to.have.property('value', 42);
      });

      it('get two local dependencies', () => {
        let x = 17;
        let y = 31;
        
        const expr = aexpr(() => x + y);
        
        x = 42;
        y = 42;

        const deps = expr.getDependencies();
        expect(deps.locals()).to.have.lengthOf(2);
        expect(deps.locals()[0]).to.have.property('name', 'x');
        expect(deps.locals()[1]).to.have.property('name', 'y');
        expect(deps.locals()[0].scope).to.equal(deps.locals()[1].scope);
        // expect(deps.locals()[0].scope).to.equal(deps.locals()[1].scope);
      });

      // #TODO: optimization: do not listen to locals that are not set (not on left-hand side or in an update expression)
      
    });

    // #TODO
    xit('further reflection stuff', () => {
      const expr = aexpr(() => {});
      
      expr.getCallbacks()
      expr.getCallbacks().getImpact() // analyse calls to callbacks and what variables they access
      expr.getHistoricEvents() // with stack at which they were called
      expr.on('new-dependency', /* callback */) // further events
      
      /* other things*/
      AExpr.EventHistory
      All.AExpr
      
      Higher-level.Abstractions >> Higher-level.events & relation.to.aexprs
    });

  });

});
