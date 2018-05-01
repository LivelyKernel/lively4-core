import * as cop from "src/client/ContextJS/src/contextjs.js";
import {pt,rect, Point, Rectangle} from "src/client/graphics.js"
import Preferences from './preferences.js';
import select, { trackInstance } from 'active-groups';
import { Knot } from 'src/client/triples/triples.js';

/* Layer for interactive development, that will not be active by default
 *
 * - This API should not be used in other methods...
 * - One could consider it as an internal API-based more EUD-friendly DSL
 * - The domain is "interactive" development... using workspace and other such tools
 */

cop.layer(window, "InteractiveLayer")
// we will risk overriding methods here, because it is only active in a layer, that is not loaded by default
.refineClass(Object, {
	$methods() {
    var m = [];
    for (var ea in this) {
      try {
	      if (this[ea] instanceof Function)
          m.push(ea)
      } catch(e) {}
    }
    return m.sort()
  }
})
.refineClass(Point, {
  $show() {
    lively.showPoint(this)
  }
})
.refineClass(Rectangle, {
  $show() {
    lively.showRect(this.topLeft(), this.extent())
  }
})
.refineClass(HTMLElement, {
  get $pos() {
    return lively.getPosition(this)
  },

  set $pos(value) {
    return lively.setPosition(this, value)
  },

  get $g_pos() {
    return lively.getGlobalPosition(this)
  },

  set $g_pos(value) {
    return lively.setGlobalPosition(this, value)
  },
  $show() {
    lively.showElement(this)
  }
})
.refineObject(window, {
  get pt() {
    return pt
  },
  get rect() {
    return rect
  },
  get Preferences() {
    return Preferences
  },

  get cop() {
    return cop
  },

  get select() {
    return select;
  },
  get trackInstance() {
    return trackInstance;
  },
  get Knot() {
    return Knot;
  },

  get $morph() {
    return name => document.body.querySelector("#" + name)
  },
})
