define(function module(require) { "use strict";
    var withLogging = require('../../src/withlogging');
    var select = require('../../src/select');

    describe('.reduce operator', function() {
        var AValueClass = require('../fixtures/class-factory').getValueClass();

        it('Example', function() {
            this.timeout(10000);

            withLogging.call(AValueClass);

            var currentValue,
                timesCalled = 0,
                threshold = { min: 0 },
                initialValue = 3;
            var instance1 = new AValueClass(42);
            var baseView = select(AValueClass, function(data) {
                return data.value > threshold.min;
            }).reduce(function(aggregation) {
                timesCalled++;
                currentValue = aggregation;
            }, function(acc, instance) {
                return acc + instance.value;
            }, initialValue);

            expect(currentValue).to.equal(initialValue + instance1.value);
            expect(timesCalled).to.equal(1);

            var instance2 = new AValueClass(5);
            expect(currentValue).to.equal(
                initialValue +
                instance1.value +
                instance2.value
            );
            expect(timesCalled).to.equal(2);

            threshold.min = 50;
            expect(currentValue).to.equal(initialValue);
            expect(timesCalled).to.equal(4);
        });
    });
});
