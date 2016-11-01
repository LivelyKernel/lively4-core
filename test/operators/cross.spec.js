import withLogging from '../../src/withlogging.js';
import select from '../../src/select.js';
import { getValueClass } from '../fixtures/class-factory.js';
var ValueClassA = getValueClass(),
    ValueClassB = getValueClass();

describe('.cross operator', function() {
    it('Example', function() {
        this.timeout(10000);

        withLogging.call(ValueClassA);
        withLogging.call(ValueClassB);

        var instanceA1 = new ValueClassA(42);
        var instanceB1 = new ValueClassB(43);
        var baseA = select(ValueClassA, function(data) {
            return data.value > 30;
        }, locals);
        var baseB = select(ValueClassB, function(data) {
            return data.value > 30;
        }, locals);
        var product = baseA.cross(baseB);

        expect(product.now()).to.have.lengthOf(1);
        expect(product.now()[0].first).to.equal(instanceA1);
        expect(product.now()[0].second).to.equal(instanceB1);

        var instanceA2 = new ValueClassA(44);
        expect(product.now()).to.have.lengthOf(2);
        expect(product.now()[1].first).to.equal(instanceA2);
        expect(product.now()[1].second).to.equal(instanceB1);

        var instanceB2 = new ValueClassB(44);
        expect(product.now()).to.have.lengthOf(4);
        expect(product.now()[2].first).to.equal(instanceA1);
        expect(product.now()[2].second).to.equal(instanceB2);
        expect(product.now()[3].first).to.equal(instanceA2);
        expect(product.now()[3].second).to.equal(instanceB2);

        instanceA1.value = 17;
        expect(product.now()).to.have.lengthOf(2);
        expect(product.now()[0].first).to.equal(instanceA2);
        expect(product.now()[0].second).to.equal(instanceB1);
        expect(product.now()[1].first).to.equal(instanceA2);
        expect(product.now()[1].second).to.equal(instanceB2);

    });
});
