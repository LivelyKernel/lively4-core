import withLogging from '../../src/withlogging.js';
import select from '../../src/select.js';
import { getValueClass } from '../fixtures/class-factory.js';
var ValueHolder = getValueClass();

describe('.union operator', function() {
    it('ValueHolder example', function() {
        this.timeout(10000);

        withLogging.call(ValueHolder);
        var range1 = {
            min: 0,
            max: 25
        };
        var range2 = {
            min: 15,
            max: 50
        };
        var view1 = select(ValueHolder, function(data) {
            return range1.min <= data.value && data.value <= range1.max;
        }, locals);
        var view2 = select(ValueHolder, function(data) {
            return range2.min <= data.value && data.value <= range2.max;
        }, locals);
        var v1 = new ValueHolder(10);
        var v2 = new ValueHolder(20);
        var v3 = new ValueHolder(30);
        var union = view1.union(view2);
        expect(union.now()).to.have.lengthOf(3);
        expect(union.now()).to.include(v1);
        expect(union.now()).to.include(v2);
        expect(union.now()).to.include(v3);

        // remove a value that is contained in only one upstream
        v1.value = -1;
        expect(union.now()).to.have.lengthOf(2);
        expect(union.now()).to.include(v2);
        expect(union.now()).to.include(v3);

        // remove a value from both upstreams
        v2.value = -1;
        expect(union.now()).to.have.lengthOf(1);
        expect(union.now()).to.include(v3);

        // add a value to one upstream
        v1.value = 10;
        expect(union.now()).to.have.lengthOf(2);
        expect(union.now()).to.include(v1);
        expect(union.now()).to.include(v3);

        // add a value to both upstreams
        var v4 = new ValueHolder(20);
        expect(union.now()).to.have.lengthOf(3);
        expect(union.now()).to.include(v1);
        expect(union.now()).to.include(v3);
        expect(union.now()).to.include(v4);

        // remove multiple values at once
        range1.max = 15;
        range2.min = 35;

        expect(union.now()).to.have.lengthOf(1);
        expect(union.now()).to.include(v1);
    });
});
