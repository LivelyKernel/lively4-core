'use strict';

import { BaseActiveExpression } from './../../src/base/base-active-expressions.js';

describe('Base Active Expressions', () => {
    it("basic callback", () => {
        let spy = sinon.spy(),
            obj = {a:1},
            aexpr = new BaseActiveExpression(() => obj.a)
                .onChange(spy);

        expect(spy).not.to.be.called;

        obj.a = 2;
        aexpr.checkAndNotify();

        expect(spy).to.be.calledOnce;
    });
});
