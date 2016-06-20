'use strict';

import { Layer } from '../src/scope.js';
import onEvent from '../src/eventTransition.js';
import testOnlyInBrowser from './testInBrowserHelper.js';

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

describe('eventTransition', function() {

    // TODO: this test only run in browser environment currently
    testOnlyInBrowser('should support a basic event-based layer transition', () => {
        var l1 = new Layer().activate(),
            l2 = new Layer();

        onEvent('click')
            .transition([l1], [l2]);

        document.documentElement.click();

        expect(l1.isActive()).not.to.be.true;
        expect(l2.isActive()).to.be.true;
    });

    testOnlyInBrowser('should select the first match on transition', () => {
        var l1 = new Layer(),
            l2 = new Layer().activate(),
            l3 = new Layer();

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
        var l1 = new Layer().activate(),
            l2 = new Layer(),
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
        var l1 = new Layer().activate(),
            l2 = new Layer(),
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
});
