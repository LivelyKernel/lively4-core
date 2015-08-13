define(function(require) {
    "use strict";

    var expect = chai.expect;

    describe('Babel', function() {
        it('should support ES7 Exponential operator', function() {
            expect(2 ** 3).to.equal(8);
        });
    });

});
