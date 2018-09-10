"enable aexpr";
import chai, {expect} from 'src/external/chai.js';
import sinon from 'src/external/sinon-3.2.1.js';
import sinonChai from 'src/external/sinon-chai.js';
chai.use(sinonChai);

import { aexpr as baseAExpr, AExprRegistry } from 'src/client/reactive/active-expressions/active-expressions/src/active-expressions.js'
import * as frameBasedAExpr from "frame-based-aexpr";
import * as tickingAExpr from "src/client/reactive/active-expressions/active-expression-convention/active-expression-ticking.js";

import { countBy } from 'utils';

describe('Reflection API', () => {

  describe('meta information', () => {

    it('set and read a property', () => {
      const expr = aexpr(() => {});
      
      expect(expr.meta().get('info')).to.be.undefined;
      
      const expectedName = 'my test AExpr';
      expr.meta({ info: expectedName });
      
      expect(expr.meta().get('info')).to.equal(expectedName);
    });

    it('set and read an aexpr`s name', () => {
      const expr = baseAExpr(() => {});

      expect(expr.name()).to.be.undefined;

      const expectedName = 'my test AExpr';
      const returnValue = expr.name(expectedName);

      expect(expr.name()).to.equal(expectedName);
      expect(returnValue).to.equal(expr); // chainability
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

      it('getDependencies is defined for Rewriting AExprs', () => {
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
        
        const deps = expr.getDependencies();
        expect(deps.locals()).to.have.lengthOf(2);
        expect(deps.locals()[0]).to.have.property('name', 'x');
        expect(deps.locals()[0]).to.have.property('value', 17);
        expect(deps.locals()[1]).to.have.property('name', 'y');
        expect(deps.locals()[1]).to.have.property('value', 31);
        expect(deps.locals()[0].scope).to.equal(deps.locals()[1].scope);

        x = 42;
        y = 42;

        const deps2 = expr.getDependencies();
        expect(deps2.locals()).to.have.lengthOf(2);
        expect(deps2.locals()[0]).to.have.property('name', 'x');
        expect(deps2.locals()[0]).to.have.property('value', 42);
        expect(deps2.locals()[1]).to.have.property('name', 'y');
        expect(deps2.locals()[1]).to.have.property('value', 42);
        expect(deps2.locals()[0].scope).to.equal(deps2.locals()[1].scope);
        expect(deps2.locals()[0].value).to.equal(deps2.locals()[1].value);
      });

      it('value of local updated on set', () => {
        let x = false;
        let y = 31;
        
        const expr = aexpr(() => x ? 42 : y);
        
        const deps = expr.getDependencies();
        expect(deps.locals()).to.have.lengthOf(2);
        expect(deps.locals()[0]).to.have.property('name', 'x');
        expect(deps.locals()[0]).to.have.property('value', false);
        expect(deps.locals()[1]).to.have.property('name', 'y');
        expect(deps.locals()[1]).to.have.property('value', 31);
        expect(deps.locals()[0].scope).to.equal(deps.locals()[1].scope);

        x = true;

        const deps2 = expr.getDependencies();
        expect(deps2.locals()).to.have.lengthOf(1);
        expect(deps2.locals()[0]).to.have.property('name', 'x');
        expect(deps2.locals()[0]).to.have.property('value', true);

        y = 42;
      });

      // #TODO: optimization: do not listen to locals that are not set (not on left-hand side or in an update expression)

      it('get a member dependency', () => {
        const obj = { x: 17 };
        
        const expr = aexpr(() => obj.x);

        const memberDeps = expr.getDependencies().members();
        expect(memberDeps).to.have.lengthOf(1);
        expect(memberDeps[0]).to.have.property('object', obj);
        expect(memberDeps[0]).to.have.property('property', 'x');
        expect(memberDeps[0]).to.have.property('value', 17);
      });

      it('get a nested member dependency', () => {
        const obj = { x: { y: 17 } };
        
        const expr = aexpr(() => obj.x.y);

        const memberDeps = expr.getDependencies().members();
        expect(memberDeps).to.have.lengthOf(2);
        expect(memberDeps[0]).to.have.property('object', obj);
        expect(memberDeps[0]).to.have.property('property', 'x');
        expect(memberDeps[0]).to.have.property('value', obj.x);
        expect(memberDeps[1]).to.have.property('object', obj.x);
        expect(memberDeps[1]).to.have.property('property', 'y');
        expect(memberDeps[1]).to.have.property('value', 17);
      });

      it('get a member dependency from a method call', () => {
        const obj = {
          get() {
            return this.val;
          },
          val: 17
        };
        
        const expr = aexpr(() => obj.get());

        const memberDeps = expr.getDependencies().members();
        expect(memberDeps).to.have.lengthOf(2);
        expect(memberDeps[0]).to.have.property('object', obj);
        expect(memberDeps[0]).to.have.property('property', 'get');
        expect(memberDeps[0]).to.have.property('value', obj.get);
        expect(memberDeps[1]).to.have.property('object', obj);
        expect(memberDeps[1]).to.have.property('property', 'val');
        expect(memberDeps[1]).to.have.property('value', 17);
      });

      it('member dependencies change with re-evaluation', () => {
        const rect = {
          width: 100,
          height: 200
        };
        let useWidth = true;
        
        const expr = aexpr(() => useWidth ? rect.width : rect.height);

        const depsForWidth = expr.getDependencies().members();
        expect(depsForWidth).to.have.lengthOf(1);
        expect(depsForWidth[0]).to.have.property('object', rect);
        expect(depsForWidth[0]).to.have.property('property', 'width');
        expect(depsForWidth[0]).to.have.property('value', 100);
        
        useWidth = false;

        const memberDeps = expr.getDependencies().members();
        expect(memberDeps).to.have.lengthOf(1);
        expect(memberDeps[0]).to.have.property('object', rect);
        expect(memberDeps[0]).to.have.property('property', 'height');
        expect(memberDeps[0]).to.have.property('value', 200);
      });
      
      describe('global dependency modelled as member dependencies', () => {
        let temp;
        
        beforeEach(() => {
          temp = window.foo;
        });
        
        afterEach(() => {
          window.foo = temp;
          temp = undefined;
        });
        
        it('get global dependencies', () => {
          window.foo = 200;

          const expr = aexpr(() => foo);

          const memberDeps = expr.getDependencies().members();
          expect(memberDeps).to.have.lengthOf(1);
          expect(memberDeps[0]).to.have.property('object', window);
          expect(memberDeps[0]).to.have.property('property', 'foo');
          expect(memberDeps[0]).to.have.property('value', 200);
        });

      });
      
    });

    // All.AExpr
    describe('track all undisposed AExprs', () => {

      describe('`allAsArray`', () => {
        
        function numberOfOccurences(aexpr) {
          let count = 0;
          AExprRegistry.allAsArray().forEach(item => {
            if(item === aexpr) {
              count++;
            }
          })
          return count;
        }
        
        it('get all aexprs `allAsArray`', () => {
          expect(AExprRegistry).to.have.property('allAsArray');
        });

        it('should contain a **base** aexpr once', () => {
          const expr = baseAExpr(() => {});
          expect(numberOfOccurences(expr)).to.equal(1);
          
          expr.dispose();
          expect(numberOfOccurences(expr)).to.equal(0);
        });

        
        it('should add a **ticking** aexpr when ready (completely initialized)', () => {
          const expr = tickingAExpr.aexpr(() => 1);
          expect(numberOfOccurences(expr)).to.equal(1);
          
          expr.dispose();
          expect(numberOfOccurences(expr)).to.equal(0);
        });

        it('should add a **frame-based** aexpr when ready (completely initialized)', () => {
          const expr = frameBasedAExpr.aexpr(() => 1);
          expect(numberOfOccurences(expr)).to.equal(1);
          
          expr.dispose();
          expect(numberOfOccurences(expr)).to.equal(0);
        });

        it('should add a **rewriting** aexpr when ready (completely initialized)', () => {
          const expr = aexpr(() => {});
          expect(numberOfOccurences(expr)).to.equal(1);
          
          expr.dispose();
          expect(numberOfOccurences(expr)).to.equal(0);
        });

      });

      // #TODO: stream-based access
      // #TODO: how to do a ROQ of allAexpr? (circular dependencies)
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
      
      Higher-level.Abstractions >> Higher-level.events & relation.to.aexprs
    });

  });

});
