'use strict';

import { PropertyAccessor } from '../src/property-accessor.js';

describe('Property Accessor', function() {
    it("wrap a property", function() {
        var obj = {a: 2, b: 3};

        new PropertyAccessor(obj, 'a');

        expect(obj.a).to.equal(2);

        obj.a = 42;

        expect(obj.a).to.equal(42);
    });
    it("delegates to existing accessors by default", function() {
        let getterSpy = sinon.spy(),
            setterSpy = sinon.spy(),
            obj = {
            base: 17,
            get prop() {
                console.log('get prop', this.base);
                getterSpy();
                return this.base;
            },
            set prop(val) {
                console.log('set prop', val, this.base);
                setterSpy(val);
                return this.base = val;
            }
        };

        //new PropertyAccessor(obj, 'prop');

        expect(obj.prop).to.equal(17);
        expect(getterSpy.calledOnce).to.be.true;

        obj.prop = 42;

        expect(setterSpy.withArgs(42).calledOnce).to.be.true;
    });
    it("delegates to existing accessors by default", function() {
    });
});
