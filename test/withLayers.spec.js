'use strict';

import { Scope } from '../src/copv2/scope.js';
import { withLayers, withoutLayers, withLayersFor, withoutLayersFor } from '../src/copv2/withLayers.js';

function getSpyOnActivate(partial) {
    return partial.activate = sinon.spy();
}

describe('withLayers', function() {
    it('should allow basic control flow-based scoping', () => {
        var l1 = new Scope(),
            l2 = new Scope(),
            spy = sinon.spy();

        var value = withLayers([l1, l2], () => {
            expect(l1.isActive()).to.be.true;
            expect(l2.isActive()).to.be.true;
            spy();
            return 42;
        });

        expect(l1.isActive()).to.be.false;
        expect(l2.isActive()).to.be.false;
        assert(spy.called);
        expect(value).to.equal(42);
    });

    it('should support nested withLayers', () => {
        var l1 = new Scope(),
            l2 = new Scope(),
            spy = sinon.spy();

        withLayers([l1], () => {
            expect(l1.isActive()).to.be.true;
            expect(l2.isActive()).to.be.false;

            withLayers([l2], () => {
                expect(l1.isActive()).to.be.true;
                expect(l2.isActive()).to.be.true;
                spy();
            });

            expect(l1.isActive()).to.be.true;
            expect(l2.isActive()).to.be.false;

            withLayers([l1, l2], () => {
                expect(l1.isActive()).to.be.true;
                expect(l2.isActive()).to.be.true;
                spy();
            });

            expect(l1.isActive()).to.be.true;
            expect(l2.isActive()).to.be.false;
            spy();
        });

        expect(l1.isActive()).to.be.false;
        expect(l2.isActive()).to.be.false;
        assert(spy.calledThrice);
    });
});

describe('withoutLayers', function() {

    it('should remember previous state', () => {
        var l1 = new Scope(),
            spy = sinon.spy();

        withoutLayers([l1], () => {
            expect(l1.isActive()).to.be.false;
            spy();
        });

        expect(l1.isActive()).to.be.false;
        assert(spy.calledOnce);
    });

    it('should remember the previous state of scopes', () => {
        var l1 = new Scope(),
            spy = sinon.spy();

        withLayers([l1], () => {
            withoutLayers([l1], () => {
                expect(l1.isActive()).to.be.false;
                spy();
            });

            expect(l1.isActive()).to.be.true;
        });

        expect(l1.isActive()).to.be.false;
        assert(spy.calledOnce);
    });

    it('should handle nested with- and withoutLayers', () => {
        var l1 = new Scope(),
            l2 = new Scope(),
            spy = sinon.spy();

        withoutLayers([l1], () => {
            expect(l1.isActive()).to.be.false;
            expect(l2.isActive()).to.be.false;

            withLayers([l2], () => {
                expect(l1.isActive()).to.be.false;
                expect(l2.isActive()).to.be.true;

                withoutLayers([l1, l2], () => {
                    expect(l1.isActive()).to.be.false;
                    expect(l2.isActive()).to.be.false;
                    spy();
                });

                expect(l1.isActive()).to.be.false;
                expect(l2.isActive()).to.be.true;
            });

            expect(l1.isActive()).to.be.false;
            expect(l2.isActive()).to.be.false;
        });

        expect(l1.isActive()).to.be.false;
        expect(l2.isActive()).to.be.false;
        assert(spy.calledOnce);
    });
});

describe('interaction of withLayers and withoutLayers', function() {
    it('should support nested activation', () => {
        var l1 = new Scope(),
            l2 = new Scope(),
            spy = sinon.spy();

        withLayers([l1, l2], () => {
            expect(l1.isActive()).to.be.true;
            expect(l2.isActive()).to.be.true;
            withoutLayers([l2], () => {
                expect(l1.isActive()).to.be.true;
                expect(l2.isActive()).to.be.false;
                spy();
            });
            expect(l1.isActive()).to.be.true;
            expect(l2.isActive()).to.be.true;
        });

        expect(l1.isActive()).to.be.false;
        expect(l2.isActive()).to.be.false;
        assert(spy.calledOnce);
    });
});

describe('withtLayersFor', function() {

    it('should remember previous state', () => {
        var l1 = new Scope(),
            obj = 42,
            spy = sinon.spy();

        withLayersFor([l1], [obj], () => {
            expect(l1.isActiveFor(obj)).to.be.true;
            spy();
        });

        expect(l1.isActiveFor(obj)).to.be.false;
        assert(spy.calledOnce);
    });

    it('handles multiple layers and objects', () => {
        var l1 = new Scope(),
            l2 = new Scope(),
            obj1 = 42,
            obj2 = 17,
            spy = sinon.spy();

        var value = withLayersFor([l1, l2], [obj1, obj2], () => {
            expect(l1.isActiveFor(obj1)).to.be.true;
            expect(l1.isActiveFor(obj2)).to.be.true;
            expect(l2.isActiveFor(obj1)).to.be.true;
            expect(l2.isActiveFor(obj2)).to.be.true;
            spy();
            spy();
            spy();
            return 42;
        });

        expect(l1.isActiveFor(obj1)).to.be.false;
        expect(l1.isActiveFor(obj2)).to.be.false;
        expect(l2.isActiveFor(obj1)).to.be.false;
        expect(l2.isActiveFor(obj2)).to.be.false;
        assert(spy.calledThrice);
        expect(value).to.equal(42);
    });

    it('should support nested withLayersFor', () => {
        var l1 = new Scope(),
            l2 = new Scope(),
            obj1 = 42,
            obj2 = 17,
            spy = sinon.spy();

        withLayersFor([l1], [obj1], () => {
            expect(l1.isActiveFor(obj1)).to.be.true;
            expect(l1.isActiveFor(obj2)).to.be.false;

            withLayersFor([l1, l2], [obj2], () => {
                expect(l1.isActiveFor(obj1)).to.be.true;
                expect(l1.isActiveFor(obj2)).to.be.true;
                expect(l2.isActiveFor(obj1)).to.be.false;
                expect(l2.isActiveFor(obj2)).to.be.true;
                spy();
            });

            expect(l1.isActiveFor(obj1)).to.be.true;
            expect(l1.isActiveFor(obj2)).to.be.false;
            expect(l2.isActiveFor(obj1)).to.be.false;
            expect(l2.isActiveFor(obj2)).to.be.false;

            withLayersFor([l1, l2], [obj1], () => {
                expect(l1.isActiveFor(obj1)).to.be.true;
                expect(l1.isActiveFor(obj2)).to.be.false;
                expect(l2.isActiveFor(obj1)).to.be.true;
                expect(l2.isActiveFor(obj2)).to.be.false;

                spy();
            });

            expect(l1.isActiveFor(obj1)).to.be.true; // the important check
            expect(l1.isActiveFor(obj2)).to.be.false;
            expect(l2.isActiveFor(obj1)).to.be.false;
            expect(l2.isActiveFor(obj2)).to.be.false;

            spy();
        });

        expect(l1.isActiveFor(obj1)).to.be.false;
        expect(l1.isActiveFor(obj2)).to.be.false;
        expect(l2.isActiveFor(obj1)).to.be.false;
        expect(l2.isActiveFor(obj2)).to.be.false;

        assert(spy.calledThrice);
    });
});

describe('withoutLayersFor', function() {

    it('should remember previous state', () => {
        var l1 = new Scope(),
            obj = 42,
            spy = sinon.spy();

        withoutLayersFor([l1], [obj], () => {
            expect(l1.isActiveFor(obj)).to.be.false;
            spy();
        });

        expect(l1.isActiveFor(obj)).to.be.false;
        assert(spy.calledOnce);
    });

    it('should remember the previous state of scopes', () => {
        var l1 = new Scope(),
            obj = 42,
            spy = sinon.spy();

        withLayersFor([l1], [obj], () => {
            withoutLayersFor([l1], [obj], () => {
                expect(l1.isActiveFor(obj)).to.be.false;
                spy();
            });

            expect(l1.isActiveFor(obj)).to.be.true;
        });

        expect(l1.isActiveFor(obj)).to.be.false;
        assert(spy.calledOnce);
    });

    it('should handle nested with- and withoutLayersFor', () => {
        var l1 = new Scope(),
            l2 = new Scope(),
            obj = 42,
            spy = sinon.spy();

        withoutLayersFor([l1], [obj], () => {
            expect(l1.isActiveFor(obj)).to.be.false;
            expect(l2.isActiveFor(obj)).to.be.false;

            withLayersFor([l2], [obj], () => {
                expect(l1.isActiveFor(obj)).to.be.false;
                expect(l2.isActiveFor(obj)).to.be.true;

                withoutLayersFor([l1, l2], [obj], () => {
                    expect(l1.isActiveFor(obj)).to.be.false;
                    expect(l2.isActiveFor(obj)).to.be.false;
                    spy();
                });

                expect(l1.isActiveFor(obj)).to.be.false;
                expect(l2.isActiveFor(obj)).to.be.true;
            });

            expect(l1.isActiveFor(obj)).to.be.false;
            expect(l2.isActiveFor(obj)).to.be.false;
        });

        expect(l1.isActiveFor(obj)).to.be.false;
        expect(l2.isActiveFor(obj)).to.be.false;
        assert(spy.calledOnce);
    });
});

// TODO: check interoperability of withLayers and withLayersFor
describe('interaction of global and instance-specific activations', function() {

    it('handles nested with- and withoutLayersFor', () => {
        var l1 = new Scope(),
            l2 = new Scope(),
            obj1 = 42,
            obj2 = 17,
            spy = sinon.spy();

        withLayersFor([l1, l2], [obj1], () => {
            expect(l1.isActiveFor(obj1)).to.be.true;
            expect(l1.isActiveFor(obj2)).to.be.false;
            expect(l2.isActiveFor(obj1)).to.be.true;
            expect(l2.isActiveFor(obj2)).to.be.false;
            expect(l1.isActive()).to.be.false;
            expect(l2.isActive()).to.be.false;

            withLayers([l1, l2], () => {
                expect(l1.isActiveFor(obj1)).to.be.true;
                expect(l1.isActiveFor(obj2)).to.be.false;
                expect(l2.isActiveFor(obj1)).to.be.true;
                expect(l2.isActiveFor(obj2)).to.be.false;
                expect(l1.isActive()).to.be.true;
                expect(l2.isActive()).to.be.true;

                withoutLayers([l2], () => {
                    expect(l1.isActiveFor(obj1)).to.be.true;
                    expect(l1.isActiveFor(obj2)).to.be.false;
                    expect(l2.isActiveFor(obj1)).to.be.true;
                    expect(l2.isActiveFor(obj2)).to.be.false;
                    expect(l1.isActive()).to.be.true;
                    expect(l2.isActive()).to.be.false;

                    withoutLayersFor([l2], [obj1, obj2], () => {
                        expect(l1.isActiveFor(obj1)).to.be.true;
                        expect(l1.isActiveFor(obj2)).to.be.false;
                        expect(l2.isActiveFor(obj1)).to.be.false;
                        expect(l2.isActiveFor(obj2)).to.be.false;
                        expect(l1.isActive()).to.be.true;
                        expect(l2.isActive()).to.be.false;

                        spy();
                    });

                    expect(l1.isActiveFor(obj1)).to.be.true;
                    expect(l1.isActiveFor(obj2)).to.be.false;
                    expect(l2.isActiveFor(obj1)).to.be.true;
                    expect(l2.isActiveFor(obj2)).to.be.false;
                    expect(l1.isActive()).to.be.true;
                    expect(l2.isActive()).to.be.false;
                });

                expect(l1.isActiveFor(obj1)).to.be.true;
                expect(l1.isActiveFor(obj2)).to.be.false;
                expect(l2.isActiveFor(obj1)).to.be.true;
                expect(l2.isActiveFor(obj2)).to.be.false;
                expect(l1.isActive()).to.be.true;
                expect(l2.isActive()).to.be.true;
            });

            expect(l1.isActiveFor(obj1)).to.be.true;
            expect(l1.isActiveFor(obj2)).to.be.false;
            expect(l2.isActiveFor(obj1)).to.be.true;
            expect(l2.isActiveFor(obj2)).to.be.false;
            expect(l1.isActive()).to.be.false;
            expect(l2.isActive()).to.be.false;
        });

        expect(l1.isActiveFor(obj1)).to.be.false;
        expect(l1.isActiveFor(obj2)).to.be.false;
        expect(l2.isActiveFor(obj1)).to.be.false;
        expect(l2.isActiveFor(obj2)).to.be.false;
        expect(l1.isActive()).to.be.false;
        expect(l2.isActive()).to.be.false;

        assert(spy.calledOnce);
    });
});