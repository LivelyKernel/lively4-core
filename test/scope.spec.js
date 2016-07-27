'use strict';

import { Scope, Partial, COMPOSE_ALL, COMPOSE_ANY, COMPOSE_LAST } from '../src/copv2/scope.js';

// TODO: install spies to __method__
class SpyPartial extends Partial {
    constructor(...args) {
        super(...args);

        this.activate = sinon.spy(this.activate);
        this.deactivate = sinon.spy(this.deactivate);
        this.activateFor = sinon.spy(this.activateFor);
        this.deactivateFor = sinon.spy(this.deactivateFor);

        this.id  = Math.random();
    }
}

describe('Partial', () => {
    // TODO: move notification tests here
    describe('Basic Functionality', () => {
        let partial;

        beforeEach(() => {
            partial = new Partial();
        });

        xit('should delegate a basic activation', () => {
            let partial = new SpyPartial();

            partial
                .add(partial)
                .activate();

            expect(partial.activate.calledOnce).to.be.true;

            partial.deactivate();
            expect(partial.deactivate.calledOnce).to.be.true;
        });

        it('allows simple reflection via isActiveFor', () => {
            let obj = {},
                obj2 = {};

            expect(partial.isActiveFor(obj)).to.be.false;
            expect(partial.isActiveFor(obj2)).to.be.false;

            partial.activateFor(obj);
            expect(partial.isActiveFor(obj)).to.be.true;
            expect(partial.isActiveFor(obj2)).to.be.false;

            partial.activateFor(obj2);
            expect(partial.isActiveFor(obj)).to.be.true;
            expect(partial.isActiveFor(obj2)).to.be.true;

            partial.deactivateFor(obj);
            expect(partial.isActiveFor(obj)).to.be.false;
            expect(partial.isActiveFor(obj2)).to.be.true;
        });
    });
});

describe('Composite Scopes', () => {
    describe('Basic Functionality', () => {
        let scope;

        beforeEach(() => {
            scope = new Scope();
        });

        it('should delegate a basic activation', () => {
            let partial = new SpyPartial();

            scope
                .add(partial)
                .activate();

            expect(partial.activate.calledOnce).to.be.true;

            scope.deactivate();
            expect(partial.deactivate.calledOnce).to.be.true;
        });

        it('does not activate an activated scope again', () => {
            let partial = new SpyPartial();

            scope
                .add(partial)
                .activate();

            expect(partial.activate.calledOnce).to.be.true;

            scope.activate();
            expect(partial.activate.calledOnce).to.be.true;
        });

        it('does not activate an activated scope again', () => {
            let partial = new SpyPartial();

            scope
                .add(partial)
                .activate()
                .deactivate()
                .deactivate();

            expect(partial.deactivate.calledOnce).to.be.true;
        });

        it('ensures that partials have a set semantic', () => {
            let partial = new SpyPartial();

            scope
                .add(partial)
                .add(partial)
                .activate();

            expect(partial.activate.calledOnce).to.be.true;
        });

        // TODO: What about edge cases like adding an existing partial or removing a non-existing one?
        // TODO: Also, what about this, when add to an already activated scope multiple times?
        // the partial should only be activated once
        it('manage contained objects', () => {
            let partial1 = {},
                partial2 = {},
                partial3 = {};

            scope
                .add(partial1)
                .add(partial2);

            expect(scope.contains(partial1)).to.be.true;
            expect(scope.contains(partial2)).to.be.true;
            expect(scope.contains(partial3)).not.to.be.true;

            scope.remove(partial2);

            expect(scope.contains(partial1)).to.be.true;
            expect(scope.contains(partial2)).not.to.be.true;
            expect(scope.contains(partial3)).not.to.be.true;
        });

        it('adding to an already active scope should activate the partial', () => {
            let partial = new Partial();

            scope
                .activate()
                .add(partial);

            //assert(partial.activate.calledOnce);
            expect(partial.isActive()).to.be.true;
        });

        it('removing while being active causes the partial to be deactivated', () => {
            let partial = new Partial();

            scope
                .add(partial)
                .activate()
                .remove(partial);

            expect(partial.isActive()).to.be.false;
        });

        it('should support nested scopes', () => {
            let partial = new SpyPartial();

            scope
                .add((new Scope())
                    .add(partial))
                .activate();

            assert(partial.activate.calledOnce);
        });

        it('should support iterating over added _partials', () => {
            let partial1 = new Partial(),
                partial2 = new Partial(),
                partial3 = new Partial(),
                spy = sinon.spy();

            scope
                .add(partial1)
                .add(partial2)
                .add(partial3);

            for(let partial of scope) {
                spy(partial);
            }

            assert(spy.calledWith(partial1));
            assert(spy.calledWith(partial2));
            assert(spy.calledWith(partial3));
        });

        it('allows simple reflection via isActive', () => {
            expect(scope.isActive()).not.to.be.true;
            scope.activate();
            expect(scope.isActive()).to.be.true;
            scope.deactivate();
            expect(scope.isActive()).not.to.be.true;
        });

        describe('Instance-specific (de-)activation', () => {

            it('should delegate a basic activation', () => {
                let partial = new SpyPartial(),
                    obj = {};

                scope
                    .add(partial)
                    .activateFor(obj);

                expect(partial.activateFor.withArgs(obj).calledOnce).to.be.true;
            });

            it('consequtive (de-)activations are no-ops', () => {
                let partial = new SpyPartial(),
                    obj = {};

                scope
                    .add(partial)
                    .activateFor(obj)
                    .activateFor(obj);

                expect(partial.activateFor.withArgs(obj).calledOnce).to.be.true;

                scope
                    .deactivateFor(obj)
                    .deactivateFor(obj);

                expect(partial.deactivateFor.withArgs(obj).calledOnce).to.be.true;
            });

            it('should support nested scopes', () => {
                let partial = new SpyPartial(),
                    obj = {};

                scope
                    .add(new Scope()
                        .add(partial))
                    .activateFor(obj);

                expect(partial.activateFor.withArgs(obj).calledOnce).to.be.true;
            });

            it('adding a partial causes it to be activated for each activated item', () => {
                let partial = new SpyPartial(),
                    obj = {};

                scope
                    .activateFor(obj)
                    .add(partial);

                assert(partial.activateFor.withArgs(obj).calledOnce);
            });

            it('removing a partial of an active scope causes it to be deactivated for each activated item', () => {
                let partial = new SpyPartial(),
                    obj = {};

                scope
                    .add(partial)
                    .activateFor(obj)
                    .remove(partial);

                assert(partial.deactivateFor.withArgs(obj).calledOnce);
            });
        });
    });

    describe('Reflection', () => {
        it('gets all globally active scopes', () => {
            let scope1 = new Scope().activate(),
                scope2 = new Scope(),
                scope3 = new Scope();

            scope1.foo = 1;
            scope2.foo = 2;
            scope3.foo = 3;

            expect(Scope.activeScopes()).to.include(scope1);
            expect(Scope.activeScopes()).to.not.include(scope2);
            expect(Scope.activeScopes()).to.not.include(scope3);

            scope2.activate();

            expect(Scope.activeScopes()).to.include(scope1);
            expect(Scope.activeScopes()).to.include(scope2);
            expect(Scope.activeScopes()).to.not.include(scope3);

            scope1.deactivate();

            expect(Scope.activeScopes()).to.not.include(scope1);
            expect(Scope.activeScopes()).to.include(scope2);
            expect(Scope.activeScopes()).to.not.include(scope3);
        });

        it('gets all active scopes for a specific instance', () => {
            let scope1 = new Scope(),
                scope2 = new Scope(),
                scope3 = new Scope(),
                obj1 = { id: 1 },
                obj2 = { id: 2 };

            scope1.foo = 1;
            scope2.foo = 2;
            scope3.foo = 3;

            scope1.activateFor(obj1);
            scope2.activateFor(obj2);

            expect(Scope.activeScopesFor(obj1)).to.include(scope1);
            expect(Scope.activeScopesFor(obj1)).to.not.include(scope2);
            expect(Scope.activeScopesFor(obj1)).to.not.include(scope3);
            expect(Scope.activeScopesFor(obj2)).to.not.include(scope1);
            expect(Scope.activeScopesFor(obj2)).to.include(scope2);
            expect(Scope.activeScopesFor(obj2)).to.not.include(scope3);

            scope1.deactivateFor(obj1);
            scope1.deactivateFor(obj2);
            scope3.activateFor(obj1);
            scope3.activateFor(obj2);

            expect(Scope.activeScopesFor(obj1)).to.not.include(scope1);
            expect(Scope.activeScopesFor(obj1)).to.not.include(scope2);
            expect(Scope.activeScopesFor(obj1)).to.include(scope3);
            expect(Scope.activeScopesFor(obj2)).to.not.include(scope1);
            expect(Scope.activeScopesFor(obj2)).to.include(scope2);
            expect(Scope.activeScopesFor(obj2)).to.include(scope3);
        });
    });

    describe('Activation Hooks', () => {
        it('should notify on basic activation', () => {
            let callback = sinon.spy();

            new Scope()
                .on('beforeActivation', callback)
                .activate();

            assert(callback.calledOnce);
        });

        it('activating an already activated scope should not trigger an additional notification', () => {
            let callback = sinon.spy();

            new Scope()
                .on('beforeActivation', callback)
                .activate()
                .activate();

            assert(callback.calledOnce);
        });

        it('should call before hooks, _partials, then after hooks in that order', () => {
            let beforeCallback = sinon.spy(),
                partial = new SpyPartial(),
                afterCallback = sinon.spy();

            let layer = new Scope()
                .on('beforeActivation', beforeCallback)
                .add(partial)
                .on('afterActivation', afterCallback)
                .activate();

            assert(beforeCallback.called);
            assert(partial.activate.called);
            assert(afterCallback.called);
            assert(beforeCallback.calledBefore(partial.activate));
            assert(partial.activate.calledBefore(afterCallback));

            let beforeDeactivationCallback = sinon.spy(),
                afterDeactivationCallback = sinon.spy();

            layer
                .on('beforeDeactivation', beforeDeactivationCallback)
                .on('afterDeactivation', afterDeactivationCallback)
                .deactivate();

            assert(beforeDeactivationCallback.called);
            assert(partial.deactivate.called);
            assert(afterDeactivationCallback.called);
            assert(beforeDeactivationCallback.calledBefore(partial.deactivate));
            assert(partial.deactivate.calledBefore(afterDeactivationCallback));
        });

        it('should allow to detach existing hooks', () => {
            function callback() {
                scope.off('beforeActivation', spy)
            }

            let scope = new Scope(),
                spy = sinon.spy(callback);

            scope
                .on('beforeActivation', spy)
                .activate();

            assert(spy.calledOnce);

            scope
                .deactivate()
                .activate();

            // callback should not be called again
            assert(spy.calledOnce);
        });

        describe('Instance-specific notifications', () => {
            it('should notify on basic activation', () => {
                let obj = {},
                    callback = sinon.spy();

                new Scope()
                    .on('beforeActivationFor', callback)
                    .activateFor(obj);

                expect(callback.withArgs(obj).calledOnce).to.be.true;
            });

            it('should call before hooks, _partials, then after hooks in that order', () => {
                let obj = {},
                    beforeCallback = sinon.spy(),
                    partial = new SpyPartial(),
                    afterCallback = sinon.spy();

                let layer = new Scope()
                    .on('beforeActivationFor', beforeCallback)
                    .add(partial)
                    .on('afterActivationFor', afterCallback)
                    .activateFor(obj);

                expect(beforeCallback.withArgs(obj).calledOnce).to.be.true;
                expect(partial.activateFor.withArgs(obj).calledOnce).to.be.true;
                expect(afterCallback.withArgs(obj).calledOnce).to.be.true;
                assert(beforeCallback.withArgs(obj).calledBefore(partial.activateFor.withArgs(obj)));
                assert(partial.activateFor.withArgs(obj).calledBefore(afterCallback.withArgs(obj)));

                let beforeDeactivationCallback = sinon.spy(),
                    afterDeactivationCallback = sinon.spy();

                layer
                    .on('beforeDeactivationFor', beforeDeactivationCallback)
                    .on('afterDeactivationFor', afterDeactivationCallback)
                    .deactivateFor(obj);

                expect(beforeDeactivationCallback.withArgs(obj).calledOnce).to.be.true;
                expect(partial.deactivateFor.withArgs(obj).calledOnce).to.be.true;
                expect(afterDeactivationCallback.withArgs(obj).calledOnce).to.be.true;
                assert(beforeDeactivationCallback.calledBefore(partial.deactivateFor));
                assert(partial.deactivateFor.calledBefore(afterDeactivationCallback));
            });
        });
    });

    describe('Multiple Parent Semantic', () => {
        xit('supports explicit ALL semantic', () => {
            let partial = new Partial(COMPOSE_ALL);
            // with no parent attached, the partial should not be active, despite the fact that all (zero) parents are active
            expect(partial.isActive()).to.be.false;

            let parent1 = new Scope()
                .add(partial);
            expect(partial.isActive()).to.be.false;

            parent1.activate();
            expect(partial.isActive()).to.be.true;

            let parent2 = new Scope()
                .add(partial);
            expect(partial.isActive()).to.be.false;

            parent2.activate();
            expect(partial.isActive()).to.be.true;

            parent1.deactivate();
            expect(partial.isActive()).to.be.false;

            parent1.remove(partial);
            expect(partial.isActive()).to.be.true;
        });
    });

    describe('Static Hooks', () => {
        it('should notify about new scopes being created', () => {
            let spy = sinon.spy();

            let firstScope = new Scope();
            // TODO: these properties are needed to distinguish scopes during the sinon matching
            // TODO: find a way for identity matching and apply this in other test cases as well
            firstScope.foo = '1';

            Scope.on('created', spy);

            let secondScope = new Scope();
            secondScope.foo = '2';

            Scope.off('created', spy);

            let thirdScope = new Scope();
            thirdScope.foo = '3';

            expect(spy.calledWithExactly(firstScope)).to.be.false;
            expect(spy.calledWithExactly(secondScope)).to.be.true;
            expect(spy.calledWithExactly(thirdScope)).to.be.false;
        });

        it('should get notified about the (de-)activation of scopes', () => {
            let activationSpy = sinon.spy(),
                deactivationSpy = sinon.spy(),
                firstScope = new Scope(),
                secondScope = new Scope();

            firstScope.foo = '1';
            secondScope.foo = '2';

            firstScope.activate();

            Scope.on('activated', activationSpy);
            Scope.on('deactivated', deactivationSpy);

            secondScope.activate();

            expect(activationSpy.withArgs(firstScope).called).to.be.false;
            expect(activationSpy.withArgs(secondScope).calledOnce).to.be.true;

            firstScope.deactivate();

            expect(deactivationSpy.withArgs(firstScope).calledOnce).to.be.true;
            expect(deactivationSpy.withArgs(secondScope).called).to.be.false;
        });

        it('should get notified about the instance-specific (de-)activation of scopes', () => {
            let activationForSpy = sinon.spy(),
                deactivationForSpy = sinon.spy(),
                firstScope = new Scope(),
                secondScope = new Scope(),
                obj1 = { id: 1 },
                obj2 = { id: 2 };

            firstScope.foo = '1';
            secondScope.foo = '2';

            Scope.on('activatedFor', activationForSpy);
            Scope.on('deactivatedFor', deactivationForSpy);

            firstScope.activateFor(obj1);
            firstScope.activateFor(obj2);
            secondScope.activateFor(obj1);

            expect(activationForSpy.withArgs(firstScope, obj1).calledOnce).to.be.true;
            expect(activationForSpy.withArgs(firstScope, obj2).calledOnce).to.be.true;
            expect(activationForSpy.withArgs(secondScope, obj1).calledOnce).to.be.true;
            expect(activationForSpy.withArgs(secondScope, obj2).called).to.be.false;

            firstScope.deactivateFor(obj2);
            secondScope.deactivateFor(obj1);
            secondScope.deactivateFor(obj2);

            expect(deactivationForSpy.withArgs(firstScope, obj1).called).to.be.false;
            expect(deactivationForSpy.withArgs(firstScope, obj2).calledOnce).to.be.true;
            expect(deactivationForSpy.withArgs(secondScope, obj1).calledOnce).to.be.true;
            // the scope was already deactivated, so it is not actually deactivated for the second object
            expect(deactivationForSpy.withArgs(secondScope, obj2).called).to.be.false;
        });
    });
});
