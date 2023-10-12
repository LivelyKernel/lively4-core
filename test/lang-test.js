import chai, {expect} from 'src/external/chai.js';
import sinon from 'src/external/sinon-3.2.1.js';
import sinonChai from 'src/external/sinon-chai.js';
chai.use(sinonChai);
const assert = chai.assert;

import 'src/client/lang/lang.js';
import 'src/client/lang/lang-ext.js';
import 'src/client/lang/lang-zone.js';


describe('lang', function() {
    
  describe('Babel', function() {
    it('String.toAST', function() {
      var ast = `function f() {}`.toAST()
      expect(ast).to.be.defined
    })
    
    it('String.toAST do expressions', function() {
      var ast = `var a = do {3 ; 4}`.toAST()
      expect(ast).to.be.defined
    }) 
    
        
    it('String.toAST decorators', function() {
      var ast = `@annotation
class MyClass {}`.toAST()
      expect(ast).to.be.defined
    }) 

    
    it('String.toAST typescript', function() {
      var ast = `var a: number = 42`.toAST()
      expect(ast).to.be.defined
    }) 
    
    
    
    it('String.traverseAsAST', function() {
      var visited = [];
      `const a = b.c`.traverseAsAST({
        Identifier(path) {
          visited.push(path.node.name)
        }
      })
      expect(visited.length).to.equal(3)
      expect(visited).to.eql(["a","b","c"])
    }) 
    
    it('String.transformAsAST short', function() {
      var result = `const a = b.c`.transformAsAST({Identifier: path => {
            path.node.name += "x"
          }
      })
      expect(result.code).to.eql(`const ax = bx.cx;`)
    }) 
    
    it('String.transformAsAST', function() {
      var result = `const a = b.c`.transformAsAST(({ types: t, template }) => ({
        visitor: {
          Identifier: path => {
            if (path.node.name === "a") {
              path.replaceWith(t.identifier("x"))
            }
          }
        }
      }))  
      expect(result.code).to.eql(`const x = b.c;`)
    }) 
  })

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

  describe('Object.mapKeys/Values/Entries/KeysToEntries/ValuesToEntries', function() {

    const obj = {
      one: 1,
      two: 2,
      three: 3,
    };

    it('mapKeys', () => {
      expect(obj.mapKeys((key, value, o) => {
        expect(o).to.equal(obj)
        return key.upperFirst() + value
      })).to.deep.equal({
        One1: 1,
        Two2: 2,
        Three3: 3,
      });
    });

    it('mapValues', () => {
      expect(obj.mapValues((value, key, o) => {
        expect(o).to.equal(obj)
        return value + key.length
      })).to.deep.equal({
        one: 4,
        two: 5,
        three: 8,
      });
    });

    it('mapEntries', () => {
      expect(obj.mapEntries(([key, value], o) => {
        expect(o).to.equal(obj)
        return [value, key]
      })).to.deep.equal({
        1: 'one',
        2: 'two',
        3: 'three',
      });
    });

    it('mapKeysToEntries', () => {
      expect(obj.mapKeysToEntries((key, value, o) => {
        expect(o).to.equal(obj)
        return [key.upperFirst(), value + 1]
      })).to.deep.equal({
        One: 2,
        Two: 3,
        Three: 4,
      });
    });

    it('mapValuesToEntries', () => {
      expect(obj.mapValuesToEntries((value, key, o) => {
        expect(o).to.equal(obj)
        return [value + 1, key.upperFirst()]
      })).to.deep.equal({
        2: 'One',
        3: 'Two',
        4: 'Three',
      });
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

describe('Array', function() {

  it('pluck',  () => {
    const arr = [{ a: 1 }, { a: 2 }, { a: 3 }];
    expect(arr.pluck('a')).to.eql([1, 2, 3]);
  });

  describe('minProp, maxProp', function() {

    it('identity',  () => {
      const arr = [1, 2, 3];
      expect(arr.minProp()).to.eql(1);
      expect(arr.maxProp()).to.eql(3);
    });
    it('property',  () => {
      const arr = [{ a: 1 }, { a: 2 }, { a: 3 }];
      expect(arr.minProp('a')).to.eql(1);
      expect(arr.maxProp('a')).to.eql(3);
    });
    it('deep property',  () => {
      const arr = [{ a: { b: 1 } }, { a: { b: 2 } }, { a: { b: 3 } }];
      expect(arr.minProp('a.b')).to.eql(1);
      expect(arr.maxProp('a.b')).to.eql(3);
    });
    it('callback',  () => {
      const arr = [{ a: 1 }, { a: 2 }, { a: 3 }];
      expect(arr.minProp(ea => ea.a)).to.eql(1);
      expect(arr.maxProp(ea => ea.a)).to.eql(3);
    });

  });

  describe('remove items', function() {

    it('removeItem',  () => {
      const arr = [2,5,9,1,5,8,5];
      arr.removeItem(5);
      expect(arr).to.eql([2,9,1,5,8,5]);
    });
    
    it('removeItem all',  () => {
      const arr = [2,5,9,1,5,8,5];
      arr.removeItem(5, true);
      expect(arr).to.eql([2,9,1,8]);
    });

    it('removeAll',  () => {
      const arr = [2,5,9,1,5,8,5];
      arr.removeAll(ea => ea === 5);
      expect(arr).to.eql([2,9,1,8]);
    });

  });

  describe('sortBy', function() {

    it('initial array unchanged',  () => {
      const arr = [2,5,9,1];
      const sorted = arr.sortBy();

      expect(arr).to.eql([2,5,9,1])
    });
    
    it('default is ascending',  () => {
      const arr = [2,5,9,1];
      const sorted = arr.sortBy();

      expect(sorted).to.eql([1,2,5,9]);
    });
    
    it('optional descending',  () => {
      const arr = [2,5,9,1];
      const sorted = arr.sortBy(Function.identity, false);

      expect(sorted).to.eql([9,5,2,1]);
    });

    it('explicit ascending',  () => {
      const arr = [2,5,9,1];
      const sorted = arr.sortBy(Function.identity, true);

      expect(sorted).to.eql([1,2,5,9]);
    });

    it('descending and property access',  () => {
      const arr = [{ prop: 2 },{ prop: 5 },{ prop: 9 },{ prop: 1 }];
      const sorted = arr.sortBy('prop', false);

      expect(sorted).to.eql([{ prop: 9 },{ prop: 5 },{ prop: 2 },{ prop: 1 }]);
    });

    it('descending and function',  () => {
      const arr = [{ prop: 2 },{ prop: 5 },{ prop: 9 },{ prop: 1 }];
      const sorted = arr.sortBy(ea => ea.prop, false);

      expect(sorted).to.eql([{ prop: 9 },{ prop: 5 },{ prop: 2 },{ prop: 1 }]);
    });

  });
});




