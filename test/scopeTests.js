'use strict';

import { Layer } from '../src/scope.js';

class TestPartial {
    constructor() {}
    
    activate() {}
    deactivate() {}
    activateFor() {}
    deactivateFor() {}
}

function getSpyOnActivate(partial) {
    return partial.activate = sinon.spy();
}

describe('Scope', function() {
    describe('Basic Functionality', function() {
        var testLayer;

        beforeEach(() => {
            testLayer = new Layer();
        });

        it('should delegate a basic activation', () => {
            var partial = new TestPartial();
            var spy = getSpyOnActivate(partial);

            testLayer
                .add(partial)
                .activate();

            assert(spy.called)
        });

        // TODO: What about edge cases like adding an existing element or removing a non-existing one?
        it('manage contained objects', () => {
            var obj1 = {},
                obj2 = {},
                obj3 = {};

            testLayer
                .add(obj1)
                .add(obj2);

            expect(testLayer.contains(obj1)).to.be.true;
            expect(testLayer.contains(obj2)).to.be.true;
            expect(testLayer.contains(obj3)).not.to.be.true;

            testLayer.remove(obj2);

            expect(testLayer.contains(obj1)).to.be.true;
            expect(testLayer.contains(obj2)).not.to.be.true;
            expect(testLayer.contains(obj3)).not.to.be.true;
        });

        it('should support nested scopes', () => {
            var partial = new TestPartial();
            var spy = getSpyOnActivate(partial);

            testLayer
                .add(new Layer()
                    .add(partial))
                .activate();

            assert(spy.called)
        });

        it('should support iterating over added _partials', () => {
            var partial1 = new TestPartial(),
                partial2 = new TestPartial(),
                partial3 = new TestPartial();
            var spy = sinon.spy();

            testLayer
                .add(partial1)
                .add(partial2)
                .add(partial3);

            for(let partial of testLayer) {
                spy(partial);
            }

            assert(spy.calledWith(partial1));
            assert(spy.calledWith(partial2));
            assert(spy.calledWith(partial3));
        });

        it('allows simple reflection via isActive', () => {
            expect(testLayer.isActive()).not.to.be.true;
            testLayer.activate();
            expect(testLayer.isActive()).to.be.true;
            testLayer.deactivate();
            expect(testLayer.isActive()).not.to.be.true;
        });
    });

    describe('Activation Hooks', function() {
        it('should delegate a basic activation', () => {
            var callback = sinon.spy();

            new Layer()
                .on('beforeActivation', callback)
                .activate();

            assert(callback.called)
        });

        it('should call before hooks, _partials, then after hooks in that order', () => {
            var beforeCallback = sinon.spy();
            var partial = new TestPartial();
            var partialActivated = getSpyOnActivate(partial);
            var afterCallback = sinon.spy();

            var layer = new Layer()
                .on('beforeActivation', beforeCallback)
                .add(partial)
                .on('afterActivation', afterCallback)
                .activate();

            assert(beforeCallback.called);
            assert(partialActivated.called);
            assert(afterCallback.called);
            assert(beforeCallback.calledBefore(partialActivated));
            assert(partialActivated.calledBefore(afterCallback));

            var beforeDeactivationCallback = sinon.spy();
            var partialDeactivated = partial.deactivate = sinon.spy();
            var afterDeactivationCallback = sinon.spy();

            layer
                .on('beforeDeactivation', beforeDeactivationCallback)
                .on('afterDeactivation', afterDeactivationCallback)
                .deactivate();

            assert(beforeDeactivationCallback.called);
            assert(partialDeactivated.called);
            assert(afterDeactivationCallback.called);
            assert(beforeDeactivationCallback.calledBefore(partialDeactivated));
            assert(partialDeactivated.calledBefore(afterDeactivationCallback));
        });

        it('should allow to detach existing hooks', () => {
            var layer = new Layer();
            var callback = function() {
                layer.off('beforeActivation', spy)
            };
            var spy = sinon.spy(callback);

            layer
                .on('beforeActivation', spy)
                .activate();

            assert(spy.calledOnce);

            layer
                .deactivate()
                .activate();

            // callback should not be called again
            assert(spy.calledOnce);
        });
    })
});
