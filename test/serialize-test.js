"use strict";
import chai, {expect} from 'src/external/chai.js';
import sinon from 'src/external/sinon-3.2.1.js';
import sinonChai from 'src/external/sinon-chai.js';
chai.use(sinonChai);
const assert = chai.assert;

import { serialize, deserialize } from 'src/client/serialize.js';

function isACopy(a, b) {
  
}

describe('simple serialization with JSON.{parse,stringify}', () => {

  it('exports defined', () => {
    expect(serialize).to.be.defined;
    expect(deserialize).to.be.defined;
  });

  it('simple case', () => {
    const o = { prop: 42};
    const o2 = deserialize(serialize(o));

    assert.notStrictEqual(o, o2);
    assert.strictEqual(o.prop, o2.prop);
  });

  it('empty key', () => {
    const o = { '': 42};
    const o2 = deserialize(serialize(o));

    assert.notStrictEqual(o, o2);
    assert.strictEqual(o[''], o2['']);
  });

  it('2 ref on 1 object', () => {
    const referredObject = {}
    const o = {
      a: referredObject,
      b: referredObject,
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

});
