import {arrayToStack, Stack as ST} from '../src/array-to-stack.js';
import Stack from 'stack-es2015-modules';

describe('Array to Stack.', () => {

    it('should work (imports a webpacked modules)', () => {
        let s1 = arrayToStack([1,2,3]);
        expect(s1.top()).to.equal(3);
        s1.pop();
        expect(s1.top()).to.equal(2);
        s1.pop();
        expect(s1.top()).to.equal(1);
        s1.pop();
        expect(s1.top()).to.be.undefined;

        let s2 = arrayToStack([17, 42]);
        expect(s2.top()).to.equal(42);
        s2.pop();
        expect(s2.top()).to.equal(17);
        s2.pop();
        expect(s2.top()).to.be.undefined;
    });

    it('should type check (support export from)', () => {
        let s = arrayToStack([1,2,3]);
        expect(s).to.be.an.instanceof(Stack);
    });

});
