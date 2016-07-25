'use strict';

import Stack from '../src/stack.js';

describe('Stack', function() {
    it('returns the latest pushed element', () => {
        let el1 = { id: 1 },
            el2 = { id: 2 },
            stack = new Stack();

        stack.push(el1);
        stack.push(el2);

        expect(stack.top()).to.equal(el2);

        stack.pop();

        expect(stack.top()).to.equal(el1);
    });
});
