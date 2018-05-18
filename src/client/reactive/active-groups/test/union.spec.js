"enable aexpr";

import chai, {expect} from 'src/external/chai.js';
import sinon from 'src/external/sinon-3.2.1.js';
import sinonChai from 'src/external/sinon-chai.js';
chai.use(sinonChai);

import select from 'roq';
import { getValueClass } from './class-factory.js';
var ValueHolder = getValueClass();

describe('.union operator', function() {
    it('ValueHolder example', function() {
        this.timeout(10000);

        var range1 = {
            min: 0,
            max: 25
        };
        var range2 = {
            min: 15,
            max: 50
        };
        var view1 = select(ValueHolder).filter(function(data) {
            return range1.min <= data.value && data.value <= range1.max;
        });
        var view2 = select(ValueHolder).filter(function(data) {
            return range2.min <= data.value && data.value <= range2.max;
        });
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
