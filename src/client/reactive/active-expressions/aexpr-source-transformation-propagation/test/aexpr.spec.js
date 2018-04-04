'use strict';

import {
    aexpr,
    reset,
    getMember,
    getAndCallMember,
    setMember,
    setMemberAddition,
    setMemberMultiplication,
    setMemberDivision,
    getLocal,
    setLocal,
    getGlobal,
    setGlobal
} from '../src/aexpr-source-transformation-propagation.js';

describe('Propagation Logic', function() {

    it('is a transparent wrapper for property accesses', () => {
        let obj = {
            prop: 42,
            func(mul) { return getMember(this, 'prop') * mul}
        };

        expect(getMember(obj, 'prop')).to.equal(42);
        expect(getAndCallMember(obj, 'func', [2])).to.equal(84);

        setMemberDivision(obj, "prop", 3);

        expect(getMember(obj, 'prop')).to.equal(14);
        expect(getAndCallMember(obj, 'func', [2])).to.equal(28);
    });

    it('should be supported with proper integration', () => {
        let obj = { prop: 42 },
            spy = sinon.spy();

        aexpr(() => getMember(obj, "prop")).onChange(spy);

        expect(spy).not.to.be.called;

        setMember(obj, "prop", 17);

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

        setMember(obj, "a", 17);

        expect(spy.withArgs(17)).to.be.calledOnce;

        setMember(obj, "prop", 'b');

        expect(spy.withArgs(32)).to.be.calledOnce;

        setMember(obj, "a", 42);

        expect(spy.withArgs(42)).not.to.be.called;

        setMember(obj, "b", 33);

        expect(spy.withArgs(33)).to.be.calledOnce;
    });

    it('applies the given operator', () => {
        let obj = {
                a: 5
            },
            spy = sinon.spy();

        aexpr(() => getMember(obj, 'a')).onChange(spy);

        setMemberMultiplication(obj, "a", 1);

        expect(spy).not.to.be.called;

        setMemberAddition(obj, "a", 2);

        expect(spy.withArgs(7)).to.be.calledOnce;
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

        setMember(obj, "a", 1);

        expect(spy.withArgs(3)).to.be.calledOnce;
    });

    it('reset all active expressions', () => {
        let obj = { prop: 42 },
            spy = sinon.spy();

        aexpr(() => getMember(obj, "prop")).onChange(spy);

        reset();

        setMember(obj, "prop", 17);

        expect(spy).not.to.be.called;
    });

    describe('parametrizable aexprs', () => {

        it('handles a single instance binding', () => {
            let _scope = {};
            let obj = { val: 17 },
                spy = sinon.spy();

            aexpr(o => getMember(o, "val"), (getLocal(_scope, "obj"), obj)).onChange((getLocal(_scope, "spy"), spy));

            expect(spy).not.to.be.called;

            setMember(obj, "val", 42);

            expect(spy).to.be.calledOnce;
        });

        it("handle aexprs with one instance binding with multiple variables", () => {
            let obj1 = { val: 1 },
                obj2 = { val: 2 },
                obj3 = { val: 3 },
                spy = sinon.spy();

            aexpr((o1, o2, o3) => getMember(o1, "val") + getMember(o2, "val") + getMember(o3, "val"), obj1, obj2, obj3).onChange(spy);

            expect(spy).not.to.be.called;

            setMember(obj1, "val", 10);

            expect(spy.withArgs(15)).to.be.calledOnce;

            setMember(obj2, "val", 20);

            expect(spy.withArgs(33)).to.be.calledOnce;
        });

        it("handle aexprs with multiple instance bindings", () => {
            let obj1 = { val: 1 },
                obj2 = { val: 2 },
                obj3 = { val: 3 },
                spy12 = sinon.spy(),
                spy23 = sinon.spy(),
                expr = (o1, o2) => getMember(o1, "val") + getMember(o2, "val");

            aexpr(expr, obj1, obj2).onChange(spy12);
            aexpr(expr, obj2, obj3).onChange(spy23);

            expect(spy12).not.to.be.called;
            expect(spy23).not.to.be.called;

            obj1.val = 10;
            setMember(obj1, "val", 10);

            expect(spy12.withArgs(12)).to.be.calledOnce;
            expect(spy23).not.to.be.called;

            obj2.val = 20;
            setMember(obj2, "val", 20);

            expect(spy12.withArgs(30)).to.be.calledOnce;
            expect(spy23.withArgs(23)).to.be.calledOnce;

            obj3.val = 30;
            setMember(obj3, "val", 30);

            expect(spy12.withArgs(30)).to.be.calledOnce;
            expect(spy23.withArgs(50)).to.be.calledOnce;
        });
    });

    describe('locals', () => {

        it('is a transparent wrapper for local variables', () => {
            let _scope = {};
            var x = 0, y = 1, z = 2;

            let func, inc;
            {
                let _scope2 = {};
                let x = 42;
                func = function() {
                    return (getLocal(_scope2, 'x'), x);
                }, setLocal(_scope, 'func'), func;
                inc = function() {
                    x += 1, setLocal(_scope2, 'x'), x;
                }, setLocal(_scope, 'inc'), inc;
            }

            expect(func()).to.equal(42);

            x = 17, setLocal(_scope, 'x'), x;

            expect(x).to.equal(17);
            expect(func()).to.equal(42);

            (getLocal(_scope, 'inc'), inc)();

            expect(x).to.equal(17);
            expect(func()).to.equal(43);
        });

        it('should be supported with proper integration', () => {
            let _scope = {};
            let value = 17,
                spy = sinon.spy();

            aexpr(() => (getLocal(_scope, 'value'), value)).onChange(spy);

            expect(spy).not.to.be.called;

            value = 42, setLocal(_scope, 'value'), value;

            expect(spy).to.be.calledOnce;
        });

        it('should recalculate to recognize latest changes', () => {
            let _scope = {};
            let obj = { a: 15 },
                obj2 =obj,
                spy = sinon.spy();

            aexpr(() => getMember((getLocal(_scope, 'obj'), obj), 'a')).onChange(spy);

            setMember(obj, "a", 17);

            expect(spy.withArgs(17)).to.be.calledOnce;

            obj = { a: 32 }, setLocal(_scope, 'obj'), obj;

            expect(spy.withArgs(32)).to.be.calledOnce;

            setMember(obj2, "a", 42);

            expect(spy.withArgs(42)).not.to.be.called;

            setMember(obj, "a", 33);

            expect(spy.withArgs(33)).to.be.calledOnce;
        });

        it('reset all active expressions', () => {
            let _scope = {};
            let value = 42,
                spy = sinon.spy();

            aexpr(() => (getLocal(_scope, "value"), value)).onChange(spy);

            reset();

            value = 17, setLocal(_scope, "value"), value;

            expect(spy).not.to.be.called;
        });
    });

    describe('globals', () => {
        it('interacts with member accesses on global object', () => {
            window.globalValue = 17;
            let spy = sinon.spy();

            aexpr(() => (getGlobal('globalValue'), globalValue)).onChange(spy);

            expect(spy).not.to.be.called;

            globalValue = 33, setGlobal('globalValue'), globalValue;

            expect(spy.withArgs(33)).to.be.calledOnce;

            setMember((getGlobal('window'), window), 'globalValue', 42);

            expect(spy).to.be.calledWithMatch(42);
        });

        it('should be supported with proper integration', () => {
            let _scope = {};
            window.globalValue = 17;
            let spy = sinon.spy();

            aexpr(() => (getGlobal('globalValue'), globalValue)).onChange(spy);

            expect(spy).not.to.be.called;

            globalValue = 42, setGlobal('globalValue'), globalValue;

            expect(spy).to.be.calledOnce;
        });

        it('reset all active expressions', () => {
            globalValue = 42;
                let spy = sinon.spy();

            aexpr(() => (getGlobal("globalValue"), globalValue)).onChange(spy);

            reset();

            globalValue = 17, setGlobal("globalValue"), globalValue;

            expect(spy).not.to.be.called;
        });
    });
});
