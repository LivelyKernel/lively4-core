"use strict";

import chai, { expect } from 'src/external/chai.js';
import sinon from 'src/external/sinon-3.2.1.js';
import sinonChai from 'src/external/sinon-chai.js';
chai.use(sinonChai);
const assert = chai.assert;

import { uuid } from 'utils';

import { serialize, deserialize } from 'src/client/serialize.js';

describe('simple serialization with JSON.{parse,stringify}', () => {

  it('exports defined', () => {
    expect(serialize).to.be.defined;
    expect(deserialize).to.be.defined;
  });

  it('simple case', () => {
    const o = { prop: 42 };
    const o2 = deserialize(serialize(o));

    assert.notStrictEqual(o, o2);
    assert.strictEqual(o.prop, o2.prop);
  });

  it('empty key', () => {
    const o = { '': 42 };
    const o2 = deserialize(serialize(o));

    assert.notStrictEqual(o, o2);
    assert.strictEqual(o[''], o2['']);
  });

  it('2 ref on 1 object', () => {
    const referredObject = {};
    const o = {
      a: referredObject,
      b: referredObject
    };
    const o2 = deserialize(serialize(o));

    assert.strictEqual(o2.a, o2.b);
  });

  it('cyclic inclusion', () => {
    const o = {
      prop: 42
    };
    o.recursive = o;
    const o2 = deserialize(serialize(o));

    assert.notStrictEqual(o, o2);
    assert.strictEqual(o.prop, o2.prop);
    assert.strictEqual(o2, o2.recursive);
  });

  it('double cyclic inclusion', () => {
    const a = {};
    const b = { a };
    a.b = b;
    const a2 = deserialize(serialize(a));

    assert.strictEqual(a2.b.a, a2);
    assert.strictEqual(a2.b, a2.b.a.b);
  });

  it('clean $id and $ref', () => {
    const o = {
      prop: 42
    };
    o.recursive = o;
    const o2 = deserialize(serialize(o));

    expect(o).not.to.have.property('$id');
    expect(o).not.to.have.property('$ref');
    expect(o2).not.to.have.property('$id');
    expect(o2).not.to.have.property('$ref');
  });

  it('restore classes and clean up $class', () => {
    class A {
      get foo() {
        return 42;
      }
    }
    class B {
      get foo() {
        return 42;
      }
    }
    const a = new A();
    a.b = new B();
    a.b.a = a;
    const a2 = deserialize(serialize(a), { A, B });

    expect(a).not.to.have.property('$class');
    expect(a2).not.to.have.property('$class');
    expect(a2 instanceof A).to.be.true;
    expect(a2.b instanceof B).to.be.true;
  });

  it('restore Arrays', () => {
    const o = {
      arr: [1, 2, 3]
    };
    const o2 = deserialize(serialize(o));

    expect(o.arr).not.to.have.property('$class');
    expect(o2.arr).not.to.have.property('$class');
    expect(o).not.to.have.property('$isArray');
    expect(o2).not.to.have.property('$isArray');
    expect(o).not.to.have.property('$array');
    expect(o2).not.to.have.property('$array');

    expect(Array.isArray(o2.arr)).to.be.true;
    expect(o2.arr).to.deep.equal(o.arr);
    expect(o2.arr).to.not.equal(o.arr);
  });

  it('top-level array', () => {
    const a = [1, 2, 3];
    const a2 = deserialize(serialize(a));

    expect(Array.isArray(a2)).to.be.true;
    expect(a2).to.deep.equal(a);
  });

  it('nested arrays', () => {
    const a = [1, 2, [3, 4]];
    a[2].push(a);
    a.push(a[2]);

    const a2 = deserialize(serialize(a));
    expect(a2).to.deep.equal(a);
  });

  it('arrays with cyclic dependencies', () => {
    class A {}
    const a = [1, 2, new A()];
    a.push(a);
    const a2 = deserialize(serialize(a), { A });

    expect(a2).to.deep.equal(a);
    expect(a2[2] instanceof A).to.be.true;
  });

  describe('outerReplacer/outerReviver', () => {

    it('custom $external reference', () => {
      class MyObject {}
      const o1 = new MyObject();
      const o2 = new MyObject();

      o1.o2 = o2;
      o1.o1 = o1;
      const o = { o1, o2 };
      const refIdToObj = new Map();
      const objToRef = new Map();
      let refId = 0;
      class Reference {
        static for(obj) {
          const ref = objToRef.getOrCreate(obj, () => new Reference());
          refIdToObj.set(ref.id, obj);
          return ref;
        }
        constructor() {
          this.id = refId++;
        }
        restore() {
          return refIdToObj.get(this.id);
        }
      }

      function outerReplacer(key, value) {
        if (value instanceof MyObject) {
          value = Reference.for(value);
        }
        return value;
      }
      function outerReviver(key, value) {
        if (value instanceof Reference) {
          value = value.restore();
        }
        return value;
      }
      const revivedO = deserialize(serialize(o, outerReplacer), { Reference }, outerReviver);

      expect(revivedO).to.deep.equal(o);
      expect(revivedO).to.not.be.equal(o);
      expect(revivedO === o).to.be.false;
      expect(revivedO.o1 === o.o1).to.be.true;
      expect(revivedO.o2 === o.o2).to.be.true;
    });

    it('implementing a reference class', () => {
      class Battler {
        constructor() {
          this.id = uuid();
        }
      }
      const o1 = new Battler();
      const o2 = new Battler();

      o1.o2 = o2;
      o1.o1 = o1;
      const o = { o1, sub: { o2 } };
      class BattlerReference {
        static get refToObj() {
          return this._refToObj = this._refToObj || new Map();
        }
        static for(obj) {
          BattlerReference.refToObj.set(obj.id, obj);
          return new BattlerReference(obj);
        }
        constructor(o) {
          this.id = o.id;
        }
        restore() {
          return BattlerReference.refToObj.get(this.id);
        }
      }

      function outerReplacer(key, value) {
        if (value instanceof Battler) {
          const ref = BattlerReference.for(value);
          return ref;
        }
        return value;
      }
      function outerReviver(key, value) {
        if (value instanceof BattlerReference) {
          value = value.restore();
        }
        return value;
      }
      const revivedO = deserialize(serialize(o, outerReplacer), { BattlerReference }, outerReviver);

      expect(revivedO).to.deep.equal(o);
      expect(revivedO).to.not.be.equal(o);
      expect(revivedO === o).to.be.false;
      expect(revivedO.o1 === o.o1).to.be.true;
      expect(revivedO.sub.o2 === o.sub.o2).to.be.true;
    });
  });

  describe('do not use $id unless its necessary', () => {
    it('not in output', () => {
      const simpleObject = { prop: [1, 2, { c: 42}] }

      const jsonString = serialize(simpleObject);
      expect(jsonString).not.to.match(/\$id/)
    });

    it('only use $id when reference a thing multiple times', () => {
      const singleReffed = {
        multiReffed: {}
      }
      singleReffed.secondRef = singleReffed.multiReffed

      const plainCopy = JSON.parse(serialize(singleReffed))
      expect(plainCopy).not.to.have.property('$id');
      expect(plainCopy.multiReffed).to.have.property('$id');
    });
  });

  describe('Sets and Maps', () => {

    it('restore a Set (real Set, own entries, fresh instance)', () => {
      const o = { set: new Set([1, 2, 3]) };
      const o2 = deserialize(serialize(o));

      expect(o2.set instanceof Set).to.be.true;
      expect(o2.set).to.not.equal(o.set);
      // set-equality: nothing is in one but not the other (order-independent)
      expect(o2.set.symmetricDifference(o.set).size).to.equal(0);
    });

    it('restore a Map (real Map, own entries, fresh instance)', () => {
      const o = { map: new Map([['a', 1], ['b', 2]]) };
      const o2 = deserialize(serialize(o));

      expect(o2.map instanceof Map).to.be.true;
      expect(o2.map).to.not.equal(o.map);
      expect([...o2.map]).to.deep.equal([['a', 1], ['b', 2]]);
    });

    it('empty Set and Map', () => {
      const o2 = deserialize(serialize({ set: new Set(), map: new Map() }));

      expect(o2.set instanceof Set).to.be.true;
      expect(o2.map instanceof Map).to.be.true;
      expect(o2.set.size).to.equal(0);
      expect(o2.map.size).to.equal(0);
    });

    it('top-level Set', () => {
      const s2 = deserialize(serialize(new Set([1, 2, 3])));

      expect(s2 instanceof Set).to.be.true;
      expect([...s2]).to.deep.equal([1, 2, 3]);
    });

    it('a Set shared by two references stays a single instance and keeps its entries', () => {
      const shared = new Set([1, 2]);
      const o = { a: shared, b: shared };
      const o2 = deserialize(serialize(o));

      expect(o2.a instanceof Set).to.be.true;
      expect(o2.a).to.equal(o2.b);            // identity preserved
      expect([...o2.a]).to.deep.equal([1, 2]); // contents preserved
    });

    it('a Map shared by two references stays a single instance and keeps its entries', () => {
      const shared = new Map([['k', 'v']]);
      const o = { a: shared, b: shared };
      const o2 = deserialize(serialize(o));

      expect(o2.a instanceof Map).to.be.true;
      expect(o2.a).to.equal(o2.b);
      expect([...o2.a]).to.deep.equal([['k', 'v']]);
    });

    it('an object entry inside a Set is the same instance as elsewhere in the graph', () => {
      const obj = { id: 1 };
      const o = { set: new Set([obj]), obj };
      const o2 = deserialize(serialize(o));

      expect([...o2.set][0]).to.equal(o2.obj);
    });

    it('an object key inside a Map keeps its identity and is usable as a key', () => {
      const key = { k: 1 };
      const o = { map: new Map([[key, 'v']]), key };
      const o2 = deserialize(serialize(o));

      expect([...o2.map.keys()][0]).to.equal(o2.key);
      expect(o2.map.get(o2.key)).to.equal('v');
    });

    it('a Set that contains itself', () => {
      const s = new Set();
      s.add(s);
      const o2 = deserialize(serialize({ s }));

      expect(o2.s instanceof Set).to.be.true;
      expect(o2.s.has(o2.s)).to.be.true;
    });

    it('does not leak $set/$map/$id helper keys onto restored collections', () => {
      const shared = new Set([1]);
      const o2 = deserialize(serialize({ a: shared, b: shared }));

      expect(o2).not.to.have.property('$set');
      expect(o2.a).not.to.have.property('$id');
      expect(o2.a).not.to.have.property('$set');
    });

  });

  describe('non-finite numbers', () => {

    it('round-trips Infinity, -Infinity and NaN', () => {
      const o = deserialize(serialize({ pos: Infinity, neg: -Infinity, nan: NaN, normal: 42 }));

      expect(o.pos).to.equal(Infinity);
      expect(o.neg).to.equal(-Infinity);
      expect(Number.isNaN(o.nan)).to.be.true;
      expect(o.normal).to.equal(42);
    });

    it('round-trips non-finite numbers inside arrays', () => {
      const o2 = deserialize(serialize({ arr: [Infinity, NaN, -Infinity] }));

      expect(o2.arr[0]).to.equal(Infinity);
      expect(Number.isNaN(o2.arr[1])).to.be.true;
      expect(o2.arr[2]).to.equal(-Infinity);
    });

    it('top-level non-finite numbers', () => {
      expect(deserialize(serialize(Infinity))).to.equal(Infinity);
      expect(deserialize(serialize(-Infinity))).to.equal(-Infinity);
      expect(Number.isNaN(deserialize(serialize(NaN)))).to.be.true;
      expect(deserialize(serialize(42))).to.equal(42);
    });

  });

});