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
      
    })
    describe('select child elements', () => {
      
    })
  });
});
