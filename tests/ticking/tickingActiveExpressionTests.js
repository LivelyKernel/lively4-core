'use strict';

import { aexpr } from '../../src/ticking/ticking-active-expressions.js';


describe('Ticking Active Expressions', function() {
    it("runs a basic aexpr", () => {
        var obj = {a: 2, b: 3};
        let spy = sinon.spy();

        aexpr(function() {
            return obj.a;
        }, {obj}).onChange(spy);

        expect(spy.called).to.be.false;

        obj.a = 42;

        expect(spy.calledOnce).to.be.true;
    });
});
