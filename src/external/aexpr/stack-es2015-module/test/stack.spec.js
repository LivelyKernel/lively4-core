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