define(function module(require) { "use strict";
    var withLogging = require('../../src/withlogging');
    var select = require('../../src/select');

    describe('.filter operator', function() {
        it('DataHolder example', function() {
            var DataHolder = require('../../src/expr').DataHolder;
            withLogging.call(DataHolder);
            var range = {
                min: 0,
                max: 20
            };
            var positiveData = select(DataHolder, function(data) {
                return data.value > range.min;
            });
            var d1 = new DataHolder(17);
            var d2 = new DataHolder(33);
            var smallData = positiveData.filter(function(data) {
                return data.value < range.max;
            });
            expect(smallData.now()).to.have.lengthOf(1);
            range.max = 50;
            expect(smallData.now()).to.have.lengthOf(2);
            var d3 = new DataHolder(42);
            expect(smallData.now()).to.have.lengthOf(3);
            range.min = 40;
            expect(smallData.now()).to.have.lengthOf(1);

        });
    });
});
