define(function(require) {
    "use strict";

    var expect = chai.expect;
    require('https://code.jquery.com/jquery-2.1.4.js');
    var Github = require('../client/github/github-client.js');

    describe('Github API', function() {
        it('should load appropriately', function(done) {
            $.ajax({
                url: "https://eval/3+4",
                type: "get",
                success: function(d) {
                    expect('7').to.equal(d);
                    expect(Github.answer).to.equal(42);
                    done();
                }
            });
        });
    });
});
