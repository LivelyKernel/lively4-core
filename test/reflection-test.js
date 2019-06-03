import chai, {expect} from 'src/external/chai.js';
import sinon from 'src/external/sinon-3.2.1.js';
import sinonChai from 'src/external/sinon-chai.js';
chai.use(sinonChai);

import * as reflection from 'src/client/reflection.js';

function expectToInclude(hull, elements) {
  elements.forEach(element => {
    expect(hull.has(1)).to.be.true;    
  })
}

describe('reflection', function() {

  it('reach into collections (Set)',  () => {
    var arr = new Set([1,2, 3,4])
    
    const hull = lively.reflection.convexHull(arr)

    expect(hull).to.be.an.instanceof(Set);
    expect(hull).to.have.property('size', 5);
    expect(hull.has(arr)).to.be.true;
    expect(hull.has(1)).to.be.true;
    expect(hull.has(2)).to.be.true;
    expect(hull.has(3)).to.be.true;
    expect(hull.has(4)).to.be.true;
  });

  it('include prototype of Set',  () => {
    var set = new Set([1,2, 3,4])
    
    const hull = lively.reflection.convexHull(set, { usePrototype: true })

    expect(hull).to.be.an.instanceof(Set);
    expect(hull.size).to.be.greaterThan(5);
    expect(hull.has(set)).to.be.true;
    expect(hull.has(1)).to.be.true;
    expect(hull.has(2)).to.be.true;
    expect(hull.has(3)).to.be.true;
    expect(hull.has(4)).to.be.true;
    expect(hull.has(Set.prototype)).to.be.true;
  });

  it('allows for recursive data structures',  () => {
    const recursive = {
      a: 42,
      b: {
        foo: 17,
        c: ['hello', 'world', { d: 54 }]
      }
    };
    recursive.b.c[3] = recursive;

    const hull = lively.reflection.convexHull(recursive)

    expect(hull).to.be.an.instanceof(Set);
    expect(hull.size).to.greaterThan(8);
    expect(hull.has(recursive)).to.be.true;
    expect(hull.has(recursive.a)).to.be.true;
    expect(hull.has(recursive.b)).to.be.true;
    expect(hull.has(recursive.b.foo)).to.be.true;
    expect(hull.has(recursive.b.c)).to.be.true;
    expect(hull.has(recursive.b.c[0])).to.be.true;
    expect(hull.has(recursive.b.c[1])).to.be.true;
    expect(hull.has(recursive.b.c[2])).to.be.true;
    expect(hull.has(recursive.b.c[2].d)).to.be.true;
  });
  
  it('reach into collections (Map)',  () => {
    const map = new Map([[1,2], [3,4]]);

    const hull = lively.reflection.convexHull(map);

    expect(hull).to.be.an.instanceof(Set);
    expect(hull.size).to.equal(7);
    expect(hull.has(map)).to.be.true;
    // pairs are dynamically generated
    expect(hull.has(1)).to.be.true;
    expect(hull.has(2)).to.be.true;
    expect(hull.has(3)).to.be.true;
    expect(hull.has(4)).to.be.true;
  });

  it('convexHull of undefined is empty',  () => {
    const hull = lively.reflection.convexHull(undefined)

    expect(hull).to.be.an.instanceof(Set);
    expect(hull.size).to.equal(0);
  });
});
