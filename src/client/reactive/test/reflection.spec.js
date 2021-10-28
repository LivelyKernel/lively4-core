"enable aexpr";
import chai, {expect} from 'src/external/chai.js';
import sinon from 'src/external/sinon-3.2.1.js';
import sinonChai from 'src/external/sinon-chai.js';
chai.use(sinonChai);

import { aexpr as baseAExpr } from 'src/client/reactive/active-expression/active-expression.js'
import { AExprRegistry } from 'src/client/reactive/active-expression/ae-registry.js';
import * as frameBasedAExpr from "active-expression-frame-based";
import * as tickingAExpr from "src/client/reactive/active-expression-convention/active-expression-ticking.js";

/**
 * **************************************************************
 * ******************** dependencies ****************************
 * **************************************************************
 */
describe('source code attached', () => {

  it('rewriting `aexpr` tracks its original source code', () => {
    const e = aexpr(() => foo);
    expect(e.meta().get('sourceCode')).to.equal('() => foo');
  });

  it('rewriting `ae` tracks its original source code', () => {
    const e = ae({});
    expect(e.meta().get('sourceCode')).to.equal('{}');
  });

  it('merges source code with other parameters', () => {
    const e = aexpr(() => foo, { testing: 'other parameters'});
    expect(e.meta().get('sourceCode')).to.equal('() => foo');
  });

});

describe('Reflection API', () => {

  /**
   * **************************************************************
   * ****************** meta information **************************
   * **************************************************************
   */
  describe('meta information', () => {

    it('set and read a property', () => {
      const expr = aexpr(() => {});
      
      expect(expr.meta().get('info')).to.be.undefined;
      
      const expectedName = 'my test AExpr';
      expr.meta({ info: expectedName });
      
      expect(expr.meta().get('info')).to.equal(expectedName);
    });

    it('aexpr`s name is not supported anymore', () => {
      const expr = baseAExpr(() => {});

      expect(expr).not.to.respondTo('name');
    });

    it('setting a property is chainable', () => {
      const expr = baseAExpr(() => {});

      const expectedName = 'my test AExpr';
      const returnValue = expr.meta({ name: expectedName });

      expect(expr.meta().get('name')).to.equal(expectedName);
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

  /**
   * **************************************************************
   * ******************** dependencies ****************************
   * **************************************************************
   */
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

    describe('dependencies', () => {

      it('dependencies is defined for Rewriting AExprs', () => {
        const expr = aexpr(() => {});
        expect(expr).to.respondTo('dependencies');
      });

      it('get a local dependency', () => {
        let x = 17;
        
        const expr = aexpr(() => x);
        
        x = 42;

        const deps = expr.dependencies();
        expect(deps.locals()).to.have.lengthOf(1);
        expect(deps.locals()[0]).to.have.property('name', 'x');
        expect(deps.locals()[0]).to.have.property('value', 42);
      });

      it('get two local dependencies', () => {
        let x = 17;
        let y = 31;
        
        const expr = aexpr(() => x + y);
        
        const deps = expr.dependencies();
        expect(deps.locals()).to.have.lengthOf(2);
        expect(deps.locals()[0]).to.have.property('name', 'x');
        expect(deps.locals()[0]).to.have.property('value', 17);
        expect(deps.locals()[1]).to.have.property('name', 'y');
        expect(deps.locals()[1]).to.have.property('value', 31);
        expect(deps.locals()[0].scope).to.equal(deps.locals()[1].scope);

        x = 42;
        y = 42;

        const deps2 = expr.dependencies();
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
        
        const deps = expr.dependencies();
        expect(deps.locals()).to.have.lengthOf(2);
        expect(deps.locals()[0]).to.have.property('name', 'x');
        expect(deps.locals()[0]).to.have.property('value', false);
        expect(deps.locals()[1]).to.have.property('name', 'y');
        expect(deps.locals()[1]).to.have.property('value', 31);
        expect(deps.locals()[0].scope).to.equal(deps.locals()[1].scope);

        x = true;

        const deps2 = expr.dependencies();
        expect(deps2.locals()).to.have.lengthOf(1);
        expect(deps2.locals()[0]).to.have.property('name', 'x');
        expect(deps2.locals()[0]).to.have.property('value', true);

        y = 42;
      });

      // #TODO: optimization: do not listen to locals that are not set (not on left-hand side or in an update expression)

      it('get a member dependency', () => {
        const obj = { x: 17 };
        
        const expr = aexpr(() => obj.x);

        const memberDeps = expr.dependencies().members();
        expect(memberDeps).to.have.lengthOf(1);
        expect(memberDeps[0]).to.have.property('object', obj);
        expect(memberDeps[0]).to.have.property('property', 'x');
        expect(memberDeps[0]).to.have.property('value', 17);
      });

      it('get a nested member dependency', () => {
        const obj = { x: { y: 17 } };
        
        const expr = aexpr(() => obj.x.y);

        const memberDeps = expr.dependencies().members();
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

        const memberDeps = expr.dependencies().members();
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

        const depsForWidth = expr.dependencies().members();
        expect(depsForWidth).to.have.lengthOf(1);
        expect(depsForWidth[0]).to.have.property('object', rect);
        expect(depsForWidth[0]).to.have.property('property', 'width');
        expect(depsForWidth[0]).to.have.property('value', 100);
        
        useWidth = false;

        const memberDeps = expr.dependencies().members();
        expect(memberDeps).to.have.lengthOf(1);
        expect(memberDeps[0]).to.have.property('object', rect);
        expect(memberDeps[0]).to.have.property('property', 'height');
        expect(memberDeps[0]).to.have.property('value', 200);
      });
      
      describe('all dependencies', () => {
        it('no dependencies', () => {
          const deps = aexpr(() => {}).dependencies().all();
          expect(deps).to.be.an('array');
          expect(deps).to.have.a.lengthOf(0);
        });

        it('returns all dependencies', () => {
          var x = 41;
          const deps = aexpr(() => x).dependencies().all();
          x++;
          expect(deps).to.be.an('array');
          expect(deps).to.have.a.lengthOf(1);
          const dep = deps.first.getAsDependencyDescription();
          expect(dep).to.have.property('scope');
          expect(dep).to.have.property('name', 'x');
          expect(dep).to.have.property('value', 42);
        });

        it('returns all dependencies', () => {
          var x = { value: 42};
          const deps = aexpr(() => x.value).dependencies().all();
          expect(deps).to.be.an('array');
          expect(deps).to.have.a.lengthOf(2);

          const localDep = deps.find(dep => dep.isLocalDependency());
          expect(localDep).to.be.defined;
          const localDepDescription = localDep.getAsDependencyDescription();
          expect(localDepDescription).to.have.property('scope');
          expect(localDepDescription).to.have.property('name', 'x');
          expect(localDepDescription).to.have.property('value', x);

          const memberDep = deps.find(dep => dep.isMemberDependency());
          expect(memberDep).to.be.defined;
          const memberDepDescription = memberDep.getAsDependencyDescription();
          expect(memberDepDescription).to.have.property('object', x);
          expect(memberDepDescription).to.have.property('property', 'value');
          expect(memberDepDescription).to.have.property('value', 42);
        });

      });

      describe('sharesDependenciesWith', () => {

        it('available on aexprs', () => {
          expect(aexpr(() => {})).to.respondTo('sharedDependenciesWith');
        });
        
        it('compute shared dependencies between two aexprs', () => {
          var x = 1, y = 2, z = 3;
          
          expect(aexpr(() => {})).to.respondTo('sharedDependenciesWith');
          const sharedDeps = aexpr(() => x + y).sharedDependenciesWith(aexpr(() => y + z));
          x++;
          y++;
          z++;
          
          expect(sharedDeps).to.be.an('array');
          expect(sharedDeps).to.have.a.lengthOf(1);
          
          const sharedDep = sharedDeps.first;
          expect(sharedDep).to.be.defined;
          const sharedDepDescription = sharedDep.getAsDependencyDescription();
          expect(sharedDepDescription).to.have.property('scope');
          expect(sharedDepDescription).to.have.property('name', 'y');
          expect(sharedDepDescription).to.have.property('value', y);
        });
      });

      describe('global dependencies not modelled member dependencies, but its own access', () => {
        let temp;
        
        beforeEach(() => {
          temp = window.foo;
        });
        
        afterEach(() => {
          window.foo = temp;
          temp = undefined;
        });
        
        it('dependencies is defined for Rewriting AExprs', () => {
          const deps = aexpr(() => {}).dependencies();
          expect(deps).to.respondTo('globals');
          expect(deps.globals()).to.be.an('array');
        });

        it('get global dependencies', () => {
          window.foo = 200;

          const expr = aexpr(() => foo);

          const memberDeps = expr.dependencies().members();
          expect(memberDeps).to.have.lengthOf(0);
          
          const globalDeps = expr.dependencies().globals();
          expect(globalDeps).to.have.lengthOf(1);
          expect(globalDeps[0]).to.have.property('name', 'foo');
          expect(globalDeps[0]).to.have.property('value', 200);
        });

      });
      
    });

    describe('Object.prototype.dependentAExprs', () => {

      it('is a method on Object', () => {
        expect({}).to.respondTo('dependentAExprs');
      });

      it('returns a list', () => {
        expect(({}).dependentAExprs()).to.be.an('array');
      });

      it('returns an empty list if not tracked', () => {
        expect(({}).dependentAExprs()).to.be.empty;
      });

      it('returns a list of AExprs', () => {
        let obj = {};
        expect(obj.dependentAExprs()).to.be.empty;
        const expr1 = aexpr(() => obj);
        obj = {};
        
        const list = obj.dependentAExprs();
        expect(list).to.have.lengthOf(1);
        expect(list).to.include(expr1);
      });

      it('returns a list of two AExprs', () => {
        let obj1 = {};
        let obj2 = {};
        let obj3 = {};
        
        const expr12 = aexpr(() => (obj1, obj2));
        const expr23 = aexpr(() => (obj2, obj3));
        
        obj1 = {};
        obj2 = {};
        obj3 = {};

        const list = obj2.dependentAExprs();
        expect(list).to.have.lengthOf(2);
        expect(list).to.include(expr12);
        expect(list).to.include(expr23);
      });

    });
    /**
     * **************************************************************
     * **************** all Active Expression ***********************
     * **************************************************************
     */
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
        
        describe('change events', () => {

          it('respondTo on and off', () => {
            expect(AExprRegistry).to.respondTo('on');
            expect(AExprRegistry).to.respondTo('off');
          });

          it('emits events on add/remove', () => {
            const addSpy = sinon.spy();
            const removeSpy = sinon.spy();
            
            AExprRegistry.on('add', addSpy);
            AExprRegistry.on('remove', removeSpy);

            try {
              expect(addSpy).not.to.be.called;
              expect(removeSpy).not.to.be.called;

              const ae = aexpr(() => {});

              expect(addSpy).to.be.calledOnce;
              expect(addSpy).to.be.calledWith(ae);
              addSpy.reset();
              expect(removeSpy).not.to.be.called;

              const ae2 = aexpr(() => {});

              expect(addSpy).to.be.calledOnce;
              expect(addSpy).to.be.calledWith(ae2);
              addSpy.reset();
              expect(removeSpy).not.to.be.called;

              ae2.dispose();

              expect(addSpy).not.to.be.called;
              expect(removeSpy).to.be.calledOnce;
              expect(removeSpy).to.be.calledWith(ae2);
              removeSpy.reset();

              ae2.dispose();

              expect(addSpy).not.to.be.called;
              expect(removeSpy).not.to.be.called;
            } finally {
              AExprRegistry.off('add', addSpy);
              AExprRegistry.off('remove', removeSpy);
            }
          });

        });

        it('get all aexprs `allAsArray`', () => {
          expect(AExprRegistry).to.respondTo('allAsArray');
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
