'use strict';

import { Scope } from '../src/copv2/scope.js';
import onInstanceEvent from '../src/copv2/instanceEventTransition.js';
import testOnlyInBrowser from './testInBrowserHelper.js';

describe('instanceEventTransition', function() {

    testOnlyInBrowser('should support a basic event-based layer transition', () => {
        var div = document.createElement('div'),
            l1 = new Scope().activateFor(div),
            l2 = new Scope();
        document.body.appendChild(div);

        let eventTransition = onInstanceEvent('click', 'div')
            .transition([l1], [l2]);

        div.click();
        eventTransition.uninstall();

        expect(l1.isActiveFor(div)).to.be.false;
        expect(l2.isActiveFor(div)).to.be.true;
    });

    testOnlyInBrowser('should select the first match on transition', () => {
        var div = document.createElement('div'),
            l1 = new Scope(),
            l2 = new Scope().activateFor(div),
            l3 = new Scope();
        document.body.appendChild(div);

        let eventTransition = onInstanceEvent('click', 'div')
            .transition([l1], [l2])
            .transition([l2], [l1])
            .transition([l2], [l1, l3]);

        div.click();
        eventTransition.uninstall();

        expect(l1.isActiveFor(div)).to.be.true;
        expect(l2.isActiveFor(div)).to.be.false;
        expect(l3.isActiveFor(div)).to.be.false;
    });

    testOnlyInBrowser('should consider the condition when the appropriate event fires', () => {
        var div = document.createElement('div'),
            l1 = new Scope().activateFor(div),
            l2 = new Scope(),
            callback = sinon.spy(),
            condition = false;
        document.body.appendChild(div);


        let eventTransition = onInstanceEvent('click', 'div', () => { return condition})
            .transition([l1], [l2]);

        div.click();

        // the click should have no effect, as the transition is not fulfilled
        expect(l1.isActiveFor(div)).to.be.true;
        expect(l2.isActiveFor(div)).to.be.false;

        condition = true;

        div.click();
        eventTransition.uninstall();

        expect(l1.isActiveFor(div)).to.be.false;
        expect(l2.isActiveFor(div)).to.be.true;
    });

    testOnlyInBrowser('provides the dom element to the condition', () => {
        var div1 = document.createElement('div'),
            div2 = document.createElement('div'),
            l1 = new Scope()
                .activateFor(div1)
                .activateFor(div2),
            l2 = new Scope();
        document.body.appendChild(div1);
        document.body.appendChild(div2);

        let eventTransition = onInstanceEvent('click', 'div', (event, element) => element === div2)
            .transition([l1], [l2]);

        div1.click();

        // the click should have no effect, as the transition is not fulfilled
        expect(l1.isActiveFor(div1)).to.be.true;
        expect(l1.isActiveFor(div2)).to.be.true;
        expect(l2.isActiveFor(div1)).to.be.false;
        expect(l2.isActiveFor(div2)).to.be.false;

        div2.click();
        eventTransition.uninstall();

        expect(l1.isActiveFor(div1)).to.be.true;
        expect(l1.isActiveFor(div2)).to.be.false;
        expect(l2.isActiveFor(div1)).to.be.false;
        expect(l2.isActiveFor(div2)).to.be.true;
    });

    testOnlyInBrowser('should allow to remove an event listener', () => {
        var div = document.createElement('div'),
            l1 = new Scope().activateFor(div),
            l2 = new Scope(),
            callback = sinon.spy();
        document.body.appendChild(div);

        onInstanceEvent('click', 'div', callback)
            .transition([l1], [l2])
            .uninstall();

        div.click();

        expect(callback.called).to.be.false;
        expect(l1.isActiveFor(div)).to.be.true;
        expect(l2.isActiveFor(div)).to.be.false;

        // TODO: with removed listeners, the layer should then be usable with other
    });

    testOnlyInBrowser('allows to react on consecutive events', () => {
        var div = document.createElement('div'),
            l1 = new Scope().activateFor(div),
            l2 = new Scope(),
            callback = sinon.spy();
        document.body.appendChild(div);

        let eventTransition = onInstanceEvent('click', 'div')
            .transition([l1], [l2])
            .transition([l2], [l1]);

        div.click();

        expect(l1.isActiveFor(div)).to.be.false;
        expect(l2.isActiveFor(div)).to.be.true;

        div.click();
        eventTransition.uninstall();

        expect(l1.isActiveFor(div)).to.be.true;
        expect(l2.isActiveFor(div)).to.be.false;
    });
});
