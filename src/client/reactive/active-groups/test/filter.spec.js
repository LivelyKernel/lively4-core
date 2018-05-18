"enable aexpr";
import chai, {expect} from 'src/external/chai.js';
import sinon from 'src/external/sinon-3.2.1.js';
import sinonChai from 'src/external/sinon-chai.js';
chai.use(sinonChai);

import select from '../src/select.js';
import { getValueClass } from './class-factory.js';

describe('.filter operator', function() {
    it('DataHolder example', function() {
        var DataHolder = getValueClass();
        var range = {
            min: 0,
            max: 20
        };
        var positiveData = select(DataHolder).filter(function(data) {
            return data.value > range.min;
        });
        new DataHolder(17);
        new DataHolder(33);
        expect(positiveData.now()).to.have.lengthOf(2);
        var smallData = positiveData.filter(function(data) {
            return data.value < range.max;
        });
        expect(smallData.now()).to.have.lengthOf(1);
        range.max = 50;
        expect(smallData.now()).to.have.lengthOf(2);
        new DataHolder(42);
        expect(smallData.now()).to.have.lengthOf(3);
        range.min = 40;
        expect(smallData.now()).to.have.lengthOf(1);
    });
});
