define(function(require) {
    "use strict";

    require('https://code.jquery.com/jquery-2.1.4.js');
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
