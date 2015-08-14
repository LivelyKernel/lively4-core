define(function(require) {
    "use strict";

    require('../src/external/jquery-1.11.3.js');
    var expect = chai.expect;

    describe('Eval', function() {
        it('should eval 3 + 4 to 7', function(done) {
            $.ajax({
                url: "https://eval/3+4",
                type: "get",
                success: function(actualResult) {
                    expect(actualResult).to.equal('7');
                    done();
                }
            });
        });
    });
});
