define(function(require) {
    "use strict";

    var expect = chai.expect;
    var messaging = require('./../src/client/messaging.js');

    require('./../src/external/focalStorage.js');

    
    describe('Github Fetch API', function() {
        it('throw an error if not github token is available', function(done) {

            focalStorage.setItem("githubToken", null).then(function(){
                done()
            })
        });
    });
});
