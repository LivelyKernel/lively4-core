"enable aexpr";
import chai, {expect} from 'src/external/chai.js';
import sinon from 'src/external/sinon-3.2.1.js';
import sinonChai from 'src/external/sinon-chai.js';
chai.use(sinonChai);

import select from 'roq';
import { getValueClass } from './class-factory.js';
var OtherClass = getValueClass();

describe('.delay operator', function() {
    it('OtherClass example', function(done) {
        this.timeout(10000);

        var otherInstance1 = new OtherClass(42);
        var baseView = select(OtherClass).filter(function(data) {
            return data.value === 42;
        });
        var otherInstance2 = new OtherClass(42);
        var delayedView = baseView.delay(500);
        var otherInstance3 = new OtherClass(42);
        var otherInstance4;

        expect(delayedView.now()).to.have.lengthOf(0);

        setTimeout(function() {
            otherInstance4 = new OtherClass(42);
            otherInstance3.value = 17;
        }, 150);

        setTimeout(function() {
            otherInstance3.value = 42;
        }, 350);

        setTimeout(function() {
            expect(delayedView.now()).to.have.lengthOf(2);
            expect(delayedView.now()).to.include(otherInstance1);
            expect(delayedView.now()).to.include(otherInstance2);

            otherInstance1.value = 17;

            expect(delayedView.now()).to.have.lengthOf(1);
            expect(delayedView.now()).to.include(otherInstance2);
        }, 550);

        setTimeout(function() {
            expect(delayedView.now()).to.have.lengthOf(2);
            expect(delayedView.now()).to.include(otherInstance2);
            expect(delayedView.now()).to.include(otherInstance4);
        }, 750);

        setTimeout(function() {
            expect(delayedView.now()).to.have.lengthOf(3);
            expect(delayedView.now()).to.include(otherInstance2);
            expect(delayedView.now()).to.include(otherInstance3);
            expect(delayedView.now()).to.include(otherInstance4);
            done();
        }, 1000);
    });
});
