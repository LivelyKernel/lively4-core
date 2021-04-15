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
});