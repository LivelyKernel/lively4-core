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
    expect(hull.has(1)).to.be.true('element not included');
    expect(hull.has(2)).to.be.true;
    expect(hull.has(3)).to.be.true;
    expect(hull.has(4)).to.be.true;
  });

  it('reach into collections (Set)',  () => {
    var set = new Set([1,2, 3,4])
    
    const hull = lively.reflection.convexHull(set)

    expect(hull).to.be.an.instanceof(Set);
    expect(hull).to.have.property('size', 5);
    expect(hull.has(set)).to.be.true;
    expect(hull.has(1)).to.be.true;
    expect(hull.has(2)).to.be.true;
    expect(hull.has(3)).to.be.true;
    expect(hull.has(4)).to.be.true;

  });
});
