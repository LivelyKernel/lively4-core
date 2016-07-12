'use strict';

import { aexpr, check } from './../../src/ticking/ticking-active-expressions.js';

describe('Ticking Active Expressions', () => {
    it("runs a basic aexpr", () => {
        var obj = {a: 2, b: 3};
        let spy = sinon.spy();

        aexpr(function() {
            return obj.a;
        }).onChange(spy);

        check();
        expect(spy.called).to.be.false;

        obj.a = 42;

        check();
        expect(spy.calledOnce).to.be.true;
    });

    it("recognize changes to local variables", () => {});

});
