'use strict';

import {} from '../src/aexpr-source-transformation-propagation.js';

describe('Sinon', function() {

    it('should be supported', () => {
        var spy = sinon.spy();

        spy(42);

        expect(spy.withArgs(42).calledOnce).to.be.true;
    });

    it('should be supported with proper integration', () => {
        var spy = sinon.spy();

        spy(42);

        expect(spy).to.be.calledWith(42);
    });

});
