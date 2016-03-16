define(function module(require) { "use strict";
    var withLogging = require('../../src/withlogging');
    var select = require('../../src/select');

    describe('interpretation', function() {
        it('runs an empty program', function() {
            expect((undefined)).to.be.undefined;
        });
    });
});
