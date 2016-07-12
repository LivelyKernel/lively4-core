'use strict';

import { aexpr, check } from './../../src/ticking/ticking-active-expressions.js';

describe('Ticking Active Expressions', () => {
    it("runs a basic aexpr", () => {
        let obj = {a: 2, b: 3},
            spy = sinon.spy();

        aexpr(() => obj.a).onChange(spy);

        check();
        expect(spy.called).to.be.false;

        obj.a = 42;

        check();
        expect(spy.calledOnce).to.be.true;
    });

    it("recognize changes to local variables", () => {
        let val = 17,
            spy = sinon.spy();

        aexpr(() => val).onChange(spy);

        val = 42;

        check();
        expect(spy.calledOnce).to.be.true;
    });

    it("provide the new value to the callback", () => {
        let val = 17,
            spy = sinon.spy();

        aexpr(() => val).onChange(spy);

        val = 42;

        check();
        expect(spy.withArgs(42).calledOnce).to.be.true;
    });

});
