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
"enable aexpr";

import chai, {expect} from 'src/external/chai.js';
import sinon from 'src/external/sinon-3.2.1.js';
import sinonChai from 'src/external/sinon-chai.js';
chai.use(sinonChai);

import * as cop from '../src/Layers.js';
import { LayerableObject, proceed, Layer } from '../src/Layers.js';
import { withLayers, withoutLayers, layer } from '../src/contextjs.js';
import aexpr from 'aexpr-source-transformation-propagation';

describe("Implicit Layer Activation", () => {

  let l;
  beforeEach(() => {
    l = new Layer('Test Layer (Implicit Layer Activation)');
  });
  afterEach(() => {
    l.uninstall();
  });

  it("layers respond to onActivate", () => {
    expect(Layer).to.respondTo('activeWhile');
  });

  it("is chainable", () => {
    expect(l.activeWhile(() => true)).to.equal(l);
  });

  it("adapts behavior", () => {
    let bool = false;
    const obj = {
      fn() {
        return 17;
      }
    };

    l.refineObject(obj, {
      fn() {
        return 42;
      }
    }).activeWhile(() => bool)

    expect(obj.fn()).to.equal(17);

    bool = true;
    expect(obj.fn()).to.equal(42);
  });

  it("can be uninstalled", () => {
    const obj = { fn() { return 17; } };

    l.refineObject(obj, {
      fn() {
        return 42;
      }
    }).activeWhile(() => true)
    .uninstall()

    expect(obj.fn()).to.equal(17);
  });

  // #TODO: how should this behave?
  // be active when
  // - ANY condition is true
  // - ALL conditions are true
  // - the LAST condition is true
  // - we just throw an ERROR
  xit("reacts to multiple conditions", () => {
    const obj = { fn() { return 17; } };

    l
      .refineObject(obj, { fn() { return 42; } })
      .activeWhile(() => true)
      .activeWhile(() => false);

    expect(obj.fn()).to.equal(43);
  });

  it("falls back to eager activation when combining ILA with life-cycle callbacks", () => {
    let bool = false;
    const spy = sinon.spy();
    const obj = { fn() { return 17; } };

    l
      .refineObject(obj, {
        fn() {
          return 42;
        }
      })
      .activeWhile(() => bool, aexpr)
      .onActivate(spy) // check bot orderings

    expect(spy).not.to.be.called;

    bool = true;
    expect(spy).to.be.calledOnce;
    spy.reset();

    bool = false;
    expect(spy).not.to.be.called;
  });

  it("eager activation may trigger immediately", () => {
    const spy = sinon.spy();

    l
      .activeWhile(() => true, aexpr)
      .onActivate(spy)

    expect(spy).to.be.calledOnce;
  });

  it("eager activation may trigger immediately (reversed order)", () => {
    const spy = sinon.spy();

    l
      .onActivate(spy)
      .activeWhile(() => true, aexpr)

    expect(spy).to.be.calledOnce;
  });

  it("falls back to eager activation when combining ILA with life-cycle callbacks (onDeactivate)", () => {
    let bool = true;
    const spy = sinon.spy();
    const obj = { fn() { return 17; } };

    l
      .refineObject(obj, {
        fn() {
          return 42;
        }
      })
      .activeWhile(() => bool, aexpr)
      .onDeactivate(spy); // check bot orderings

    expect(spy).not.to.be.called;

    bool = false;
    expect(spy).to.be.calledOnce;
  });

  // #TODO: interaction with other activation means
  xit("integration with be(not)Global", () => {});
  xit("integration with with(out)Layers", () => {});
});

