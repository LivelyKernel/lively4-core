'use strict';

import { aexpr, setMember, getMember, getAndCallMember } from '../src/aexpr-source-transformation-propagation.js';

describe('Propagation Logic', function() {

    xit('transparent wrapper', () => {
        let obj = { prop: 42 },
            spy = sinon.spy();

        aexpr(() => getMember(obj, "prop")).onChange(spy);

        expect(spy).not.to.be.called;

        setMember(obj, "prop", "=", 17);

        expect(spy).to.be.calledOnce;
    });

    it('should be supported with proper integration', () => {
        let obj = { prop: 42 },
            spy = sinon.spy();

        aexpr(() => getMember(obj, "prop")).onChange(spy);

        expect(spy).not.to.be.called;

        setMember(obj, "prop", "=", 17);

        expect(spy).to.be.calledOnce;
    });

    it('should recalculate to recognize latest changes', () => {
        let obj = {
                prop: 'a',
                a: 15,
                b: 32
            },
            spy = sinon.spy();

        aexpr(() => getMember(obj, getMember(obj, 'prop'))).onChange(spy);

        setMember(obj, "a", "=", 17);

        expect(spy.withArgs(17)).to.be.calledOnce;

        setMember(obj, "prop", "=", 'b');

        expect(spy.withArgs(32)).to.be.calledOnce;

        setMember(obj, "a", "=", 42);

        expect(spy.withArgs(42)).not.to.be.called;

        setMember(obj, "b", "=", 33);

        expect(spy.withArgs(33)).to.be.calledOnce;
    });

    it('applies the given operator', () => {
        let obj = {
                a: 5
            },
            spy = sinon.spy();

        aexpr(() => getMember(obj, 'a')).onChange(spy);

        setMember(obj, "a", "*=", 1);

        expect(spy).not.to.be.called;
    });

    it('retain the this reference semantic', () => {
        let obj = {
                a: 5,
                func() {
                    return getMember(this, 'a') * 3;
                }
            },
            spy = sinon.spy();

        aexpr(() => getAndCallMember(obj, 'func')).onChange(spy);

        setMember(obj, "a", "=", 1);

        expect(spy.withArgs(3)).to.be.calledOnce;
    });
});
