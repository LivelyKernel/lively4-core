"use strict";
import chai, {expect} from 'node_modules/chai/chai.js';
import sinon from 'src/external/sinon-3.2.1.js';
import sinonChai from 'node_modules/sinon-chai/lib/sinon-chai.js';
chai.use(sinonChai);

describe('Propagation Logic1', function() {

    it('is a transparent wrapper for property accesses', () => {
        let obj = {
            prop: 42,
            func(mul) { return this.prop * mul}
        };

        expect(obj.prop).to.equal(42);
        expect(obj.func(2)).to.equal(84);

        obj.prop /= 3;

        expect(obj.prop).to.equal(14);
        expect(obj.func(2)).to.equal(28);
      
        let foo = sinon.spy();
        foo()
    });

    it('is a transparent wrapper for property accesses', () => {
        let obj = {
            prop: 42,
            func(mul) { return this.prop * mul}
        };

        expect(obj.prop).to.equal(42);
        expect(obj.func(2)).to.equal(84);

        obj.prop /= 3;

        expect(obj.prop).to.equal(14);
        expect(obj.func(2)).to.equal(28);
      
        let foo = sinon.spy();
        foo()
    });
});
