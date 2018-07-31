'use strict';

import chai, {expect} from 'src/external/chai.js';
import sinon from 'src/external/sinon-3.2.1.js';
import sinonChai from 'src/external/sinon-chai.js';
chai.use(sinonChai);

import { BaseActiveExpression } from './../../src/base/base-active-expressions.js';

describe('Base Active Expressions', () => {
    it("basic callback", () => {
        let spy = sinon.spy(),
            obj = {a:1},
            aexpr = new BaseActiveExpression(() => obj.a)
                .onChange(spy);
      
        expect(spy).not.to.be.called;

        obj.a = 2;
        aexpr.checkAndNotify();

        expect(spy).to.be.calledOnce;
    });
  
    it("works with promises", (done) => {
          let spy = sinon.spy(),
              obj = {a:1},
              aexpr = new BaseActiveExpression(() => {
                return new Promise((resolve, reject) => {
                  setTimeout(resolve, 1, obj.a);
                });
              }).onChange(spy);

          setTimeout(() => {
            expect(spy).not.to.be.called;

            obj.a = 2;
            aexpr.checkAndNotify();

            setTimeout(() => {
              expect(spy).to.be.calledOnce;
              done();
            }, 2);
          }, 2);
      });

    describe('Parameters', () => {
        it("single parameter", () => {
            let spy = sinon.spy(),
                obj = {a:1},
                aexpr = new BaseActiveExpression(o => o.a, obj)
                    .onChange(spy);

            expect(spy).not.to.be.called;

            obj.a = 2;
            aexpr.checkAndNotify();

            expect(spy).to.be.calledOnce;
        });

        it("multiple parameters", () => {
            let spy = sinon.spy(),
                obj1 = {val:1},
                obj2 = {val:2},
                obj3 = {val:3},
                aexpr = new BaseActiveExpression((o1, o2, o3) => o1.val + o2.val + o3.val, obj1, obj2, obj3)
                    .onChange(spy);

            expect(spy).not.to.be.called;

            obj1.val = 10;
            aexpr.checkAndNotify();

            expect(spy).to.be.calledWith(15);

            obj2.val = 20;
            aexpr.checkAndNotify();

            expect(spy).to.be.calledWith(33);
        });

    });
  describe('meta', () => {
    it('responds to meta', () => {
      expect(BaseActiveExpression).to.respondTo('meta');
    });
    it('meta is chainable', () => {
      let aexpr = new BaseActiveExpression(() => {});

      let actual = aexpr.meta({ value: 'expect' });
      expect(actual).to.equal(aexpr);
    });
    it('stores values conveniently', () => {
      let aexpr = new BaseActiveExpression(() => {});

      aexpr.meta({ value: 'expected' });
      expect(aexpr.meta().get('value')).to.equal('expected');
    });
  });
});
