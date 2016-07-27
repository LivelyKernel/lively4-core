'use strict';

describe('Sinon', function() {

    it('should be supported', () => {
        var spy = sinon.spy();

        spy(42);

        expect(spy.withArgs(42).calledOnce).to.be.true;
    });

    xit('should be supported with proper integration', () => {
        var spy = sinon.spy();

        var div = document.createElement('div');
        document.body.appendChild(div);

        let notifier = notify('click', 'div', spy);

        div.click();
        notifier.uninstall();

        expect(spy.calledOnce).to.be.true;
    });

});
