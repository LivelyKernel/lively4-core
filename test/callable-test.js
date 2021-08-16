import chai, { expect } from 'src/external/chai.js';
import sinon from 'src/external/sinon-3.2.1.js';
import sinonChai from 'src/external/sinon-chai.js';
chai.use(sinonChai);

import Callable from 'src/client/utils/callable.js';

describe('Callable', function () {

  it('is defined', () => {
    expect(Callable).to.be.defined;
  });

  it('create a Callable', () => {
    class Add extends Callable {
      constructor(value) {
        super();
        this.value = value;
      }

      __call__(value) {
        return this.value + value;
      }
    }
    const four = new Add(4);
    expect(four(3)).to.equal(7);
    expect(four(6)).to.equal(10);
  });

  it('requires __call__ to be overwritten', () => {
    class Broken extends Callable {}

    expect(() => new Broken()()).to.throw('subclass responsibility');
  });
});