'use strict';

import { Scope } from '../src/copv2/scope.js';
import onEvent from '../src/copv2/eventTransition.js';
import testOnlyInBrowser from './testInBrowserHelper.js';

describe('eventTransition', function() {

    // TODO: this test only run in browser environment currently
    testOnlyInBrowser('should support a basic event-based layer transition', () => {
        var l1 = new Scope().activate(),
            l2 = new Scope();

        onEvent('click')
            .transition([l1], [l2]);

        document.documentElement.click();

        expect(l1.isActive()).not.to.be.true;
        expect(l2.isActive()).to.be.true;
    });

    testOnlyInBrowser('should select the first match on transition', () => {
        var l1 = new Scope(),
            l2 = new Scope().activate(),
            l3 = new Scope();

        onEvent('click')
            .transition([l1], [l2])
            .transition([l2], [l1])
            .transition([l2], [l1, l3]);

        document.documentElement.click();

        expect(l1.isActive()).to.be.true;
        expect(l2.isActive()).not.to.be.true;
        expect(l3.isActive()).not.to.be.true;
    });

    testOnlyInBrowser('should consider the condition when the appropriate event fires', () => {
        var l1 = new Scope().activate(),
            l2 = new Scope(),
            condition = false;

        onEvent('click', () => { return condition})
            .transition([l1], [l2]);

        document.documentElement.click();

        // the click should have no effect, as the transition is not fulfilled
        expect(l1.isActive()).to.be.true;
        expect(l2.isActive()).not.to.be.true;

        condition = true;

        document.documentElement.click();

        expect(l1.isActive()).not.to.be.true;
        expect(l2.isActive()).to.be.true;
    });

    testOnlyInBrowser('should allow to remove an event listener', () => {
        var l1 = new Scope().activate(),
            l2 = new Scope(),
            callback = sinon.spy();

        onEvent('click', callback)
            .transition([l1], [l2])
            .uninstall();

        document.documentElement.click();

        expect(callback.called).not.to.be.true;
        expect(l1.isActive()).to.be.true;
        expect(l2.isActive()).not.to.be.true;

        // TODO: with removed listeners, the layer should then be usable with other
    });

    testOnlyInBrowser('allows to react on consecutive events', () => {
        var l1 = new Scope().activate(),
            l2 = new Scope();

        onEvent('click')
            .transition([l1], [l2])
            .transition([l2], [l1]);

        document.documentElement.click();

        expect(l1.isActive()).to.be.false;
        expect(l2.isActive()).to.be.true;

        document.documentElement.click();

        expect(l1.isActive()).to.be.true;
        expect(l2.isActive()).to.be.false;
    });
});
