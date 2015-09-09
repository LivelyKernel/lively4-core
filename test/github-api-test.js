define(function(require) {
    "use strict";

    var expect = chai.expect;
    var $ = require('https://code.jquery.com/jquery-2.1.4.js');

    describe('Github API', function() {
        it('should DO THINGS', function(done) {
            $.ajax({
                url: "https://eval/3+4",
                type: "get",
                success: function(d) {
                    expect('7').to.be(d);
                    console.log('FOOOOOOOOOOOOOOOOOOOOOOOOO');
                    done();
                }
            });
        });
    });
});
