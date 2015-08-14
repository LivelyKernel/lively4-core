define(function(require) {
    "use strict";

    var add = require('../src/add.js');
    var expect = chai.expect;

    describe('Add', function() {
        "use strict";

        it('should add two numbers', function() {
            expect(add(17, 25)).to.equal(42);
        });
    });
});
