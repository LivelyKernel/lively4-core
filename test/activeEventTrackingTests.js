'use strict';

import notify from '../src/activeEventTracking.js';
import testOnlyInBrowser from './testInBrowserHelper.js';

describe('Active Event Tracking', function() {

    // TODO: this test only run in browser environment currently
    testOnlyInBrowser('should work in principle', () => {
        var spy = sinon.spy();

        var div = document.createElement('div');
        document.body.appendChild(div);

        let notifier = notify('click', 'div', spy);

        div.click();
        notifier.uninstall();

        expect(spy.calledOnce).to.be.true;
    });

    testOnlyInBrowser('should notify multiple times, once for each click', () => {
        var spy = sinon.spy();

        var div = document.createElement('div');
        document.body.appendChild(div);

        let notifier = notify('click', 'div', spy);

        div.click();
        expect(spy.calledOnce).to.be.true;

        div.click();
        expect(spy.calledTwice).to.be.true;

        div.click();
        expect(spy.calledThrice).to.be.true;

        notifier.uninstall();
    });

    testOnlyInBrowser('should notify created after the hook was created', () => {
        var spy = sinon.spy();

        let notifier = notify('click', 'div', spy);

        var div = document.createElement('div');
        document.body.appendChild(div);

        div.click();

        expect(spy.calledOnce).to.be.true;

        notifier.uninstall();
    });

    testOnlyInBrowser('should dynamically notify nodes matching more complex selectors', () => {
        var spy = sinon.spy();
        let label = 'notify-me';

        let notifier = notify('click', '.' + label, spy);

        var div = document.createElement('div');
        document.body.appendChild(div);

        div.click();

        expect(spy.called).not.to.be.true;

        div.classList.add(label);
        div.click();

        expect(spy.calledOnce).to.be.true;

        notifier.uninstall();
    });
});
