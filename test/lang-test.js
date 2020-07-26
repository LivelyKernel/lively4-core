import chai, {expect} from 'src/external/chai.js';
import sinon from 'src/external/sinon-3.2.1.js';
import sinonChai from 'src/external/sinon-chai.js';
chai.use(sinonChai);

import 'src/client/lang/lang.js';
import 'src/client/lang/lang-ext.js';

describe('lang', function() {

  describe('Number.remap', function() {

    it('degenerated domain and range', () => {
      expect(() => {
        (1).remap([2,2], [3,4])
      }).to.throw(Error, /domain start and end are equal/)
      expect((1).remap([3, 4], [2, 2])).to.equal(2);
    });

    it('simple', () => {
      expect((1.0).remap([1, 2], [5, 6])).to.equal(5.0);
      expect((1.2).remap([1, 2], [5, 6])).to.equal(5.2);
      expect((1.4).remap([1, 2], [5, 6])).to.equal(5.4);
      expect((1.6).remap([1, 2], [5, 6])).to.equal(5.6);
      expect((1.8).remap([1, 2], [5, 6])).to.equal(5.8);
      expect((2.0).remap([1, 2], [5, 6])).to.equal(6.0);
    });

    it('inverse start and end', () => {
      expect((11).remap([13, 10], [3, 6])).to.equal(5); // inverse start
      expect((11).remap([10, 13], [6, 3])).to.equal(5); // inverse end
      expect((11).remap([13, 10], [6, 3])).to.equal(4); // both
    });

    it('clip', () => {
      expect((7.5).remap([0, 10], [1, 2], true)).to.equal(1.75);
      expect((11).remap([0, 10], [1, 2], true)).to.equal(2);
      expect((11).remap([10, 0], [1, 2], true)).to.equal(1);
    });

  });

  describe('computeDiff', function() {

    describe('Object diff', function() {

      it('compare Objects',  () => {
        const o1 = { foo: 1, bar: 2,         baz: 4 };
        const o2 = {                 bar: 3, baz: 4 };
        
        const [only1, both, only2] = o1.computeDiff(o2);
        
        expect(only1).to.be.an('object');
        expect(only1).to.have.property('foo', 1);
        expect(only1).to.have.property('bar', 2);
        expect(only1).to.not.have.property('baz');

        expect(both).to.be.an('object');
        expect(both).to.not.have.property('foo');
        expect(both).to.not.have.property('bar');
        expect(both).to.have.property('baz', 4);

        expect(only2).to.be.an('object');
        expect(only2).to.not.have.property('foo');
        expect(only2).to.have.property('bar', 3);
        expect(only2).to.not.have.property('baz');

      });

    });

    describe('Array diff', function() {

      it('compare Arrays',  () => {
        const arr1 = [1,2,3];
        const arr2 = [2,3,4,5];
        
        const [only1, both, only2] = arr1.computeDiff(arr2);
        
        expect(only1).to.be.an('array')
        expect(only1).to.have.property('length', 1);
        expect(only1).to.include(1);

        expect(both).to.be.an('array')
        expect(both).to.have.property('length', 2);
        expect(both).to.include(2);
        expect(both).to.include(3);

        expect(only2).to.be.an('array')
        expect(only2).to.have.property('length', 2);
        expect(only2).to.include(4);
        expect(only2).to.include(5);
      });

      it('compare with empty Array',  () => {
        const arr1 = [1,2,3];
        const arr2 = [];
        
        const [only1, both, only2] = arr1.computeDiff(arr2);
        
        expect(only1).to.be.an('array')
        expect(only1).to.have.property('length', 3);
        expect(only1).to.include(1);
        expect(only1).to.include(2);
        expect(only1).to.include(3);

        expect(both).to.be.an('array')
        expect(both).to.be.empty;

        expect(only2).to.be.an('array')
        expect(only2).to.be.empty;
      });

      it('compare with empty Array',  () => {
        const arr1 = [];
        const arr2 = [3,4];
        
        const [only1, both, only2] = arr1.computeDiff(arr2);
        
        expect(only1).to.be.an('array')
        expect(only1).to.be.empty;

        expect(both).to.be.an('array')
        expect(both).to.be.empty;

        expect(only2).to.be.an('array')
        expect(only2).to.include(3);
        expect(only2).to.include(4);
      });

    });

    describe('Set diff', function() {

      it('compare Sets',  () => {
        const s1 = new Set([1,2,3])
        const s2 = new Set([2,3,4,5])
        
        const [only1, both, only2] = s1.computeDiff(s2);
        
        expect(only1).to.be.an.instanceof(Set);
        expect(only1).to.have.property('size', 1);
        expect(only1.has(1)).to.be.true;

        expect(both).to.be.an.instanceof(Set);
        expect(both).to.have.property('size', 2);
        expect(both.has(2)).to.be.true;
        expect(both.has(3)).to.be.true;

        expect(only2).to.be.an.instanceof(Set);
        expect(only2).to.have.property('size', 2);
        expect(only2.has(4)).to.be.true;
        expect(only2.has(5)).to.be.true;

      });

    });

    describe('Map diff', function() {

      it('compare Maps',  () => {
        const m1 = new Map([[1,2],[3,4],[5,6]])
        const m2 = new Map([      [3,4],      [5,7]])
        
        const [only1, both, only2] = m1.computeDiff(m2);
        
        expect(only1).to.be.an.instanceof(Map);
        expect(only1).to.have.property('size', 2);
        expect(only1.get(1)).to.equal(2);
        expect(only1.get(5)).to.equal(6);

        expect(both).to.be.an.instanceof(Map);
        expect(both).to.have.property('size', 1);
        expect(both.get(3)).to.equal(4);

        expect(only2).to.be.an.instanceof(Map);
        expect(only2).to.have.property('size', 1);
        expect(only2.get(5)).to.equal(7);

      });

    });


  });

});
