/*
 * Copyright (c) 2008-2018 Hasso Plattner Institute
 *
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.

 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */

import chai, {expect} from 'src/external/chai.js';
import sinon from 'src/external/sinon-3.2.1.js';
import sinonChai from 'src/external/sinon-chai.js';
chai.use(sinonChai);

import * as cop from '../src/Layers.js';
import { LayerableObject, proceed, Layer } from '../src/Layers.js';
import { withLayers, withoutLayers, layer } from '../src/contextjs.js';

describe("Life-cycle Callbacks", () => {

  describe("onActivate", () => {
    let l;
    beforeEach(() => {
      l = new Layer('onActivate Test Layer');
    });
    afterEach(() => {
      l.uninstall();
    });

    it("layers respond to onActivate", () => {
      expect(Layer).to.respondTo('onActivate');
    });
    it("onActivate is chainable", () => {
      expect(l.onActivate(() => {})).to.equal(l);
    });
    it("invokes callback on beGlobal", () => {
      const spy = sinon.spy();

      l.onActivate(spy);
      expect(spy).not.to.be.called;

      l.beGlobal();
      expect(spy).to.be.calledOnce;
      // expect(spy).to.be.calledWith(l);
    });
    it("invokes multiple callbacks", () => {
      const spy1 = sinon.spy();
      const spy2 = sinon.spy();

      l.onActivate(spy1);
      l.onActivate(spy2);

      l.beGlobal();
      expect(spy1).to.be.calledOnce;
      expect(spy2).to.be.calledOnce;
      expect(spy1).to.be.calledBefore(spy2);
    });
    it("invokes callback only once on beGlobal", () => {
      const spy = sinon.spy();

      l.onActivate(spy);
      expect(spy).not.to.be.called;

      l.beGlobal();

      spy.reset();
      l.beGlobal();
      expect(spy).not.to.be.called;
    });
    it("invokes callback on beGlobal after beNotGlobal", () => {
      const spy = sinon.spy();

      l.onActivate(spy);
      expect(spy).not.to.be.called;

      l.beGlobal();
      spy.reset();

      l.beNotGlobal();
      expect(spy).not.to.be.called;

      l.beGlobal();
      expect(spy).to.be.calledOnce;
      // expect(spy).to.be.calledWith(l);
    });
    it("invokes callback on withLayers", () => {
      const spy = sinon.spy();

      l.onActivate(spy);

      withLayers([l], () => {
        expect(spy).to.be.calledOnce;
        spy.reset();
      });
      expect(spy).not.to.be.called;
    });
    it("invokes callback in order of withLayers", () => {
      const l2 = new Layer('onActivate Test Layer');
      const spy1 = sinon.spy();
      const spy2 = sinon.spy();

      l.onActivate(spy1);
      l2.onActivate(spy2);

      withLayers([l, l2], () => {
        expect(spy1).to.be.calledOnce;
        expect(spy2).to.be.calledOnce;
        expect(spy1).to.be.calledBefore(spy2);
      });

      l2.uninstall();
    });
    it("invokes callback only once on withLayers", () => {
      const spy = sinon.spy();

      l.onActivate(spy);

      withLayers([l], () => {
        expect(spy).to.be.calledOnce;
        spy.reset();
        withLayers([l], () => {
          expect(spy).not.to.be.called;
        });
      });
    });
    it("invokes callback after withoutLayers", () => {
      const spy = sinon.spy();

      l.onActivate(spy);

      withLayers([l], () => {
        expect(spy).to.be.calledOnce;
        spy.reset();
        withoutLayers([l], () => {
          expect(spy).not.to.be.called;
        });
        expect(spy).to.be.calledOnce;
        spy.reset();
      });
      expect(spy).not.to.be.called;
    });
    it("invokes callback when activated a layer using withLayers after deactivation", () => {
      const spy = sinon.spy();

      l.onActivate(spy);

      withLayers([l], () => {
        expect(spy).to.be.calledOnce;
        spy.reset();
        withoutLayers([l], () => {
          expect(spy).not.to.be.called;
          spy.reset();
          withLayers([l], () => {
            expect(spy).to.be.calledOnce;
          });
        });
      });
    });
    it("not invokes callback when activated through multiple means", () => {
      const spy = sinon.spy();

      l.onActivate(spy);

      l.beGlobal();
      spy.reset()
      withLayers([l], () => {
        expect(spy).not.to.be.called;
      });
    });
    it("not invokes callback when activated through multiple means", () => {
      const spy = sinon.spy();

      l.onActivate(spy);

      withLayers([l], () => {
        spy.reset()
        l.beGlobal();
        expect(spy).not.to.be.called;
      });
    });
    
    xit("(not) invokes callback while already active on registration", () => {
      const spy = sinon.spy();

      withLayers([l], () => {
        l.onActivate(spy);
        expect(spy).not.to.be.called; // #TODO which one is expected?
        expect(spy).to.be.calledOnce;
      });
    });
    // #TODO: how do `layer.onActivate` and `object.activeLayers = fn` interact?
    xit('invokes callbacks on changes to activeLayers property', () => {});
  });
  
  
  describe("onDeactivate", () => {
    let l;
    beforeEach(() => {
      l = new Layer('onActivate Test Layer');
    });
    afterEach(() => {
      l.uninstall();
    });

    it("layers respond to onDeactivate", () => {
      expect(Layer).to.respondTo('onDeactivate');
    });
    it("onDeactivate is chainable", () => {
      expect(l.onDeactivate(() => {})).to.equal(l);
    });
    it("invokes callback on beNotGlobal", () => {
      const spy = sinon.spy();

      l.onDeactivate(spy);
      expect(spy).not.to.be.called;

      l.beGlobal();
      expect(spy).not.to.be.called;

      l.beNotGlobal();
      expect(spy).to.be.calledOnce;
    });
    it("invokes multiple callbacks", () => {
      const spy1 = sinon.spy();
      const spy2 = sinon.spy();

      l.onDeactivate(spy1);
      l.onDeactivate(spy2);

      l.beGlobal();
      l.beNotGlobal();
      expect(spy1).to.be.calledOnce;
      expect(spy2).to.be.calledOnce;
      expect(spy1).to.be.calledBefore(spy2);
    });
    it("not invokes callback if not active when deactivating", () => {
      const spy = sinon.spy();

      l.onDeactivate(spy);

      l.beNotGlobal();
      expect(spy).not.to.be.called;
    });
    it("invokes callback only once on beNotGlobal", () => {
      const spy = sinon.spy();

      l.onDeactivate(spy);
      expect(spy).not.to.be.called;

      l.beGlobal();
      l.beNotGlobal();
      spy.reset();

      l.beNotGlobal();
      expect(spy).not.to.be.called;
    });
    it("invokes callback on beNotGlobal after frequent beGlobal", () => {
      const spy = sinon.spy();

      l.onDeactivate(spy);

      l.beGlobal();
      l.beNotGlobal();
      spy.reset();

      l.beGlobal();
      expect(spy).not.to.be.called;

      l.beNotGlobal();
      expect(spy).to.be.calledOnce;
    });
    it("invokes callback on withLayers", () => {
      const spy = sinon.spy();

      l.onDeactivate(spy);

      withLayers([l], () => {
        expect(spy).not.to.be.called;
      });
      expect(spy).to.be.calledOnce;
    });
    it("invokes callback in order of withLayers", () => {
      const l2 = new Layer('onDeactivate Test Layer');
      const spy1 = sinon.spy();
      const spy2 = sinon.spy();

      l.onDeactivate(spy1);
      l2.onDeactivate(spy2);

      withLayers([l, l2], () => {});
        expect(spy1).to.be.calledOnce;
        expect(spy2).to.be.calledOnce;
        expect(spy1).to.be.calledBefore(spy2);

      l2.uninstall();
    });
    it("invokes callback only once on withLayers", () => {
      const spy = sinon.spy();

      l.onDeactivate(spy);

      withLayers([l], () => {
        withLayers([l], () => {});
        expect(spy).not.to.be.called;
      });
      expect(spy).to.be.calledOnce;
    });
    it("invokes callback on withoutLayers", () => {
      const spy = sinon.spy();

      l.onDeactivate(spy);

      withLayers([l], () => {
        withoutLayers([l], () => {
          expect(spy).to.be.calledOnce;
          spy.reset();
        });
        expect(spy).not.to.be.called;
      });
      expect(spy).to.be.calledOnce;
    });
    it("not invokes callback on plain withoutLayers", () => {
      const spy = sinon.spy();

      l.onDeactivate(spy);

      withoutLayers([l], () => {
        expect(spy).not.to.be.called;
      });
    });
    it("invokes callback when activated a layer using withLayers after deactivation", () => {
      const spy = sinon.spy();

      l.onDeactivate(spy);

      withLayers([l], () => {
        withoutLayers([l], () => {
          expect(spy).to.be.calledOnce;
          spy.reset();
          withLayers([l], () => {
            expect(spy).not.to.be.called;
          });
          expect(spy).to.be.calledOnce;
          spy.reset();
        });
        expect(spy).not.to.be.called;
      });
      expect(spy).to.be.calledOnce;
    });
    it("not invokes callback when deactivated through multiple means", () => {
      const spy = sinon.spy();

      l.onDeactivate(spy);

      withLayers([l], () => {});
      spy.reset()
      l.beNotGlobal();
      expect(spy).not.to.be.called;
    });
    it("not invokes callback when activated through multiple means", () => {
      const spy = sinon.spy();

      l.onDeactivate(spy);

      withLayers([l], () => {
        withoutLayers([l], () => {
          spy.reset();
          l.beNotGlobal();
          expect(spy).not.to.be.called;
        });
        expect(spy).not.to.be.called;
      });
    });
    // #TODO: how do `layer.onDeactivate` and `object.activeLayers = fn` interact?
    // -> as `obj.activeLayers` is an instance-specific activation means,
    // it should probably trigger an `activateFor` event
    xit('invokes callbacks on changes to activeLayers property', () => {});
  });
});

