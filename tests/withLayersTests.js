'use strict';

import { Layer } from '../src/scope.js';
import { withLayers } from '../src/withLayers.js';

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

describe('withLayers', function() {
    it('should allow control flow-based scoping', () => {
        var l1 = new Layer(),
            l2 = new Layer(),
            spy = sinon.spy();

        var value = withLayers([l1, l2], () => {
            expect(l1.isActive()).to.be.true;
            expect(l2.isActive()).to.be.true;
            spy();
            return 42;
        });

        expect(l1.isActive()).not.to.be.true;
        expect(l2.isActive()).not.to.be.true;
        assert(spy.called);
        expect(value).to.equal(42);
    });

    xit('should support nested activation', () => {
        var l1 = new Layer(),
            l2 = new Layer(),
            spy = sinon.spy();

        withLayers([l1, l2], () => {
            expect(l1.isActive()).to.be.true;
            expect(l2.isActive()).to.be.true;
            withLayers([l1, l2], () => {
                expect(l1.isActive()).to.be.true;
                expect(l2.isActive()).to.be.true;
                spy();
            });
            // TODO: nested withLayers should support the intended behavior
            expect(l1.isActive()).to.be.true;
            expect(l2.isActive()).to.be.true;
            spy();
        });

        expect(l1.isActive()).not.to.be.true;
        expect(l2.isActive()).not.to.be.true;
        assert(spy.calledTwice)
    });
});
