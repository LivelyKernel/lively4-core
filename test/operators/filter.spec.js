import withLogging from '../../src/withlogging.js';
import select from '../../src/select.js';
import { getValueClass } from '../fixtures/class-factory.js';

describe('.filter operator', function() {
    it('DataHolder example', function() {
        var DataHolder = getValueClass();
        withLogging.call(DataHolder);
        var range = {
            min: 0,
            max: 20
        };
        var positiveData = select(DataHolder, function(data) {
            return data.value > range.min;
        }, locals);
        var d1 = new DataHolder(17);
        var d2 = new DataHolder(33);
        expect(positiveData.now()).to.have.lengthOf(2);
        var smallData = positiveData.filter(function(data) {
            return data.value < range.max;
        }, locals);
        expect(smallData.now()).to.have.lengthOf(1);
        range.max = 50;
        expect(smallData.now()).to.have.lengthOf(2);
        var d3 = new DataHolder(42);
        expect(smallData.now()).to.have.lengthOf(3);
        range.min = 40;
        expect(smallData.now()).to.have.lengthOf(1);
    });
});
