"enable aexpr";

import chai, { expect } from 'src/external/chai.js';
import sinon from 'src/external/sinon-3.2.1.js';
import sinonChai from 'src/external/sinon-chai.js';
chai.use(sinonChai);

import select, { View } from 'active-groups';

import { wait } from 'utils';

async function createWidget() {
  const widget = await lively.openComponentInWindow('matches-in-shadow');
  const livelyWindow = widget.parentElement;
  
  return { widget, livelyWindow };
}

describe("Morph.select('css selector')", async () => {
  describe("matches-in-shadow", async () => {
    let widget;
    let livelyWindow;
    beforeEach(async () => {
      ({ widget, livelyWindow } = await createWidget());
    });
    afterEach(() => {
      widget.remove();
      livelyWindow.remove();
    });
    
    it("respondsTo select", async () => {
      expect(widget).itself.to.respondTo('select');
    });
    it("returns a active group", async () => {
      expect(widget.select('div')).to.be.an.instanceOf(View);
    });
    describe('select elements in shadow root', () => {
      it("View contains elements that already satisfy the condition", async () => {
        const shadow = widget.shadowRoot;
        shadow.appendChild(<input type="checkbox"></input>);
        const checkedCheckbox = shadow.appendChild(<input type="checkbox" checked></input>);
        shadow.appendChild(<input type="radio"></input>);
        const checkedRadio = shadow.appendChild(<input type="radio" checked></input>);
        
        const selection = widget.select('input:checked');
        await wait(100);
        
        expect(selection.now()).to.have.lengthOf(2);
        expect(selection.now()).to.include(checkedCheckbox);
        expect(selection.now()).to.include(checkedRadio);
      });
      it("View contains later added elements", async () => {
        const selection = widget.select('input:checked');

        const shadow = widget.shadowRoot;
        shadow.appendChild(<input type="checkbox"></input>);
        const checkedCheckbox = shadow.appendChild(<input type="checkbox" checked></input>);
        shadow.appendChild(<input type="radio"></input>);
        const checkedRadio = shadow.appendChild(<input type="radio" checked></input>);

        await wait(100);
        
        expect(selection.now()).to.have.lengthOf(2);
        expect(selection.now()).to.include(checkedCheckbox);
        expect(selection.now()).to.include(checkedRadio);
      });
      it("View contains elements that later satisfy the condition", async () => {
        const selection = widget.select('input:checked');

        const shadow = widget.shadowRoot;
        const uncheckedCheckbox = shadow.appendChild(<input type="checkbox"></input>);
        const checkedCheckbox = shadow.appendChild(<input type="checkbox" checked></input>);

        await wait(100);
        expect(selection.now()).not.to.include(uncheckedCheckbox);
        
        uncheckedCheckbox.checked = true;

        await wait(100);
        expect(selection.now()).to.include(uncheckedCheckbox);
      });
      it("View removes elements that not satisfy the condition anymore", async () => {
        const selection = widget.select('input:checked');

        const shadow = widget.shadowRoot;
        const checkedCheckbox = shadow.appendChild(<input type="checkbox" checked></input>);

        await wait(100);
        expect(selection.now()).to.include(checkedCheckbox);
        
        checkedCheckbox.checked = null;

        await wait(100);
        expect(selection.now()).not.to.include(checkedCheckbox);
      });
      it("View removes elements that are detached from DOM", async () => {
        const selection = widget.select('input:checked');

        const shadow = widget.shadowRoot;
        const checkedCheckbox = shadow.appendChild(<input type="checkbox" checked></input>);

        await wait(100);
        expect(selection.now()).to.include(checkedCheckbox);
        
        checkedCheckbox.remove();

        await wait(100);
        expect(selection.now()).not.to.include(checkedCheckbox);
      });
      describe('disjunct conditions', () => {
        // no need to check for an element to be in both groups as their conditions have to be disjunct
        it("supports multiple disjunct conditions", async () => {
          const selectionCheckbox = widget.select('input[type=checkbox]:checked');
          const checkboxEnterSpy = sinon.spy();
          selectionCheckbox.enter(checkboxEnterSpy);
          const checkboxExitSpy = sinon.spy();
          selectionCheckbox.exit(checkboxExitSpy);
          const selectionRadio = widget.select('input[type=radio]:checked');
          const radioEnterSpy = sinon.spy();
          selectionRadio.enter(radioEnterSpy);
          const radioExitSpy = sinon.spy();
          selectionRadio.exit(radioExitSpy);
          const resetSpies = () => {
            [checkboxEnterSpy, checkboxExitSpy, radioEnterSpy, radioExitSpy].forEach(spy => spy.reset());
          };
          
          const shadow = widget.shadowRoot;
          const uncheckedCheckbox = shadow.appendChild(<input type="checkbox"></input>);
          const checkedCheckbox = shadow.appendChild(<input type="checkbox" checked></input>);
          const uncheckedRadio = shadow.appendChild(<input type="radio"></input>);
          const checkedRadio = shadow.appendChild(<input type="radio" checked></input>);

          await wait(100);
          expect(selectionCheckbox.now()).not.to.include(uncheckedCheckbox);
          expect(selectionCheckbox.now()).to.include(checkedCheckbox);
          expect(selectionCheckbox.now()).not.to.include(uncheckedRadio);
          expect(selectionCheckbox.now()).not.to.include(checkedRadio);
          expect(checkboxEnterSpy).to.be.calledOnce;
          expect(checkboxExitSpy).not.to.be.called;
          expect(selectionRadio.now()).not.to.include(uncheckedCheckbox);
          expect(selectionRadio.now()).not.to.include(checkedCheckbox);
          expect(selectionRadio.now()).not.to.include(uncheckedRadio);
          expect(selectionRadio.now()).to.include(checkedRadio);
          expect(radioEnterSpy).to.be.calledOnce;
          expect(radioExitSpy).not.to.be.called;
          resetSpies();

          uncheckedCheckbox.checked = true;
          await wait(100);
          expect(selectionCheckbox.now()).to.include(uncheckedCheckbox);
          expect(checkboxEnterSpy).to.be.calledOnce;
          expect(checkboxExitSpy).not.to.be.called;
          expect(selectionRadio.now()).not.to.include(uncheckedCheckbox);
          expect(radioEnterSpy).not.to.be.called;
          expect(radioExitSpy).not.to.be.called;
          resetSpies();

          uncheckedRadio.checked = true;
          await wait(100);
          expect(selectionCheckbox.now()).not.to.include(uncheckedRadio);
          expect(checkboxEnterSpy).not.to.be.called;
          expect(checkboxExitSpy).not.to.be.called;
          expect(selectionRadio.now()).to.include(uncheckedRadio);
          expect(radioEnterSpy).to.be.calledOnce;
          expect(radioExitSpy).not.to.be.called;
          resetSpies();

          checkedCheckbox.checked = null;
          await wait(100);
          expect(selectionCheckbox.now()).not.to.include(checkedCheckbox);
          expect(checkboxEnterSpy).not.to.be.called;
          expect(checkboxExitSpy).to.be.calledOnce;
          expect(selectionRadio.now()).not.to.include(checkedCheckbox);
          expect(radioEnterSpy).not.to.be.called;
          expect(radioExitSpy).not.to.be.called;
          resetSpies();
          
          // re-add a previously removed element
          checkedCheckbox.checked = true;
          await wait(100);
          expect(selectionCheckbox.now()).to.include(checkedCheckbox);
          expect(checkboxEnterSpy).to.be.calledOnce;
          expect(checkboxExitSpy).not.to.be.called;
          expect(selectionRadio.now()).not.to.include(checkedCheckbox);
          expect(radioEnterSpy).not.to.be.called;
          expect(radioExitSpy).not.to.be.called;
          resetSpies();
        });
      });

      describe('multiple Morphs', () => {
        let secondWidget;
        let secondLivelyWindow;
        beforeEach(async () => {
          ({ widget: secondWidget, livelyWindow: secondLivelyWindow } = await createWidget());
        });
        afterEach(() => {
          secondWidget.remove();
          secondLivelyWindow.remove();
        });
        
        xit("multiple Morphs do not conflict with each other", async () => {
        });
      })
      xit("removing the Morph from DOM stops checking for new matching elements", async () => {
      });
      xit("re-adding the removed Morph restarts checking for new matching elements", async () => {
      });
      xit("disposing a View removes its listeners", async () => {
      });
    })
    describe('select child elements', () => {
      // TODO: basically the same as with shadow root
    })
    describe('combined select child elements and elements in shadow root', () => {
    })
  });
});
