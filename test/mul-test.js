define(function(require) {
    "use strict";

    var mul = require('../src/mul');
    var expect = chai.expect;

    describe('Mul', function() {
        "use strict";

        it('should multiply two numbers', function() {
            expect(mul(6, 7)).to.equal(42);
        });
    });
});
