"enable aexpr";

import chai, {expect} from 'src/external/chai.js';
import sinon from 'src/external/sinon-3.2.1.js';
import sinonChai from 'src/external/sinon-chai.js';
chai.use(sinonChai);


import select, { View} from 'active-groups';


import { wait } from 'utils';

describe("Morph.select('css selector')", async () => {
  describe("matches-in-shadow", async () => {
    let widget;
    let livelyWindow;
    beforeEach(async () => {
      widget = await lively.openComponentInWindow('matches-in-shadow');
      livelyWindow = widget.parentElement;
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
        const checkedCheckbox = <input type="checkbox" checked></input>;
        shadow.appendChild(checkedCheckbox);
        shadow.appendChild(<input type="radio"></input>);
        const checkedRadio = <input type="radio" checked></input>;
        shadow.appendChild(checkedRadio);
        
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
        const checkedCheckbox = <input type="checkbox" checked></input>;
        shadow.appendChild(checkedCheckbox);
        shadow.appendChild(<input type="radio"></input>);
        const checkedRadio = <input type="radio" checked></input>;
        shadow.appendChild(checkedRadio);

        await wait(100);
        
        expect(selection.now()).to.have.lengthOf(2);
        expect(selection.now()).to.include(checkedCheckbox);
        expect(selection.now()).to.include(checkedRadio);
      });
      it("View contains elements that later satisfy the condition", async () => {
        const selection = widget.select('input:checked');

        const shadow = widget.shadowRoot;
        const uncheckedCheckbox = <input type="checkbox"></input>;
        shadow.appendChild(uncheckedCheckbox);
        const checkedCheckbox = <input type="checkbox" checked></input>;
        shadow.appendChild(checkedCheckbox);

        await wait(100);
        expect(selection.now()).not.to.include(uncheckedCheckbox);
        
        uncheckedCheckbox.checked = true;

        await wait(100);
        expect(selection.now()).to.include(uncheckedCheckbox);
      });
      xit("View removes elements that not satisfy the condition anymore", async () => {
        const selection = widget.select('input:checked');

        const shadow = widget.shadowRoot;
        const checkedCheckbox = <input type="checkbox" checked></input>;
        shadow.appendChild(checkedCheckbox);

        await wait(100);
        expect(selection.now()).to.include(checkedCheckbox);
        
        checkedCheckbox.checked = null;

        await wait(100);
        expect(selection.now()).not.to.include(checkedCheckbox);
      });
      xit("supports multiple disjunct conditions", async () => {
      });
      xit("multiple Morphs do not conflict with each other", async () => {
      });
    })
    describe('select child elements', () => {
    })
  });
});
