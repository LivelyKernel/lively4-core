'use strict';

import chai, {expect} from 'src/external/chai.js';
import sinon from 'src/external/sinon-3.2.1.js';
import sinonChai from 'src/external/sinon-chai.js';
chai.use(sinonChai);

import Stack from '../../utils/stack.js';

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
