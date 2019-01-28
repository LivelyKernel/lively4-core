import { expect } from 'src/external/chai.js';

describe('array assignment', () => {
  it('override existing array', () => {
    var target = {}

    target.data = []
    target.data = [1, 2, 3]

    expect(target.data).to.deep.equal([1, 2, 3]);
  });

  it('append array to array', () => {
    var target = {}

    target.data = []
    target.data.concat([1, 2, 3])

    target.data.push.apply(target.data, [1, 2, 3])
    expect(target.data).to.deep.equal([1, 2, 3]);
  });
})

describe('map to array', () => {
  it('use indexer to set values', () => {
    var map = new Map()

    map[1] = 10
    map[2] = 20

    var array = Array.from(map.values());

    expect(array).to.deep.equal([10, 20]);
    expect(map.size).to.deep.equal(2);
  });
  it('use set to set values', () => {
    var map = new Map()

    map.set(1, 10)
    map.set(2, 20)

    var array = Array.from(map.values());

    expect(array).to.deep.equal([10, 20]);
    expect(map.size).to.deep.equal(2);
  });
})

describe('check if key in map exists', () => {
  it('in operator with indexer', () => {
    var map = new Map()

    map[1] = 10

    expect(1 in map).to.deep.equal(true);
    expect(2 in map).to.deep.equal(false);
  });
  it('has funtion with indexer', () => {
    var map = new Map()

    map[1] = 10

    expect(map.has(1)).to.deep.equal(true);
    expect(map.has(2)).to.deep.equal(false);
  });
  it('has funtion with set', () => {
    var map = new Map()

    map.set(1, 10)

    expect(map.has(1)).to.deep.equal(true);
    expect(map.has(2)).to.deep.equal(false);
  });
  it('in operator funtion with set', () => {
    var map = new Map()

    map.set(1, 10)

    expect(1 in map).to.deep.equal(true);
    expect(2 in map).to.deep.equal(false);
  });
})
