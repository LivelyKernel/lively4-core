"ae";
import chai, {expect} from 'src/external/chai.js';
import sinon from 'src/external/sinon-3.2.1.js';
import sinonChai from 'src/external/sinon-chai.js';
chai.use(sinonChai);

import { deleteMember} from '../../active-expression-rewriting/active-expression-rewriting.js';

describe('delete operator (logic)', function() {
  it('delete a member', () => {
    const obj = { prop: 42 };

    expect(deleteMember(obj, 'prop')).to.be.true;

    expect(obj).to.not.have.property('prop');
  });
});

describe('delete operator (transformation)', function() {
  it('delete a member', () => {
    var obj = {
      prop1: 42,
      prop2: 17
    };

    expect(delete obj.prop1).to.be.true;

    expect(obj).to.not.have.property('prop1');
    expect(obj).to.have.property('prop2');

    expect(delete obj['prop2']).to.be.true;

    expect(obj).to.not.have.property('prop1');
    expect(obj).to.not.have.property('prop2');
  });
});

// #TODO: deleting a non-member might deviate from the standard behavior, especially in strict-mode
