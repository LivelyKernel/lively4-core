import chai, {expect} from 'src/external/chai.js';
import sinon from 'src/external/sinon-3.2.1.js';
import sinonChai from 'src/external/sinon-chai.js';
chai.use(sinonChai);

import Stack from '../src/stack.js';

function setFoo() {
    this.foo = 42;
}

describe('STACK', () => {

    it('support bind syntax', () => {
        let obj = {};
        obj::setFoo();

        expect(obj.foo).to.equal(42);
    });
    it('should test the stack', () => {
        let s = new Stack();
        s.push(42);

        expect(s.top()).to.equal(42);
    })

});