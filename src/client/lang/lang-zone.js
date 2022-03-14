import 'lang';
import Dexie from "src/external/dexie3.js";

import * as cop from "src/client/ContextJS/src/contextjs.js"


const { incrementExpectedAwaits, newPSD, decrementExpectedAwaits } = Dexie.Promise;

const global = self;

function exposeGlobal(key, value) {
  Object.defineProperty(global, key, {
    configurable: true,
    enumerable: true,
    
    value,
    writable: true,
  });
}

/*MD
## ZONES

- a **minimal interface** to zones intended to be as compliant as possible to Dart's [Zone concept](https://dart.dev/articles/archive/zones)
- intended to be exchangeable in case of future standard or library advancements
- <span style='background: red'>!only modify if you know what you are doing and understand the **long-term consequences**!</span>
- currently implemented as a lightweight wrapper around [Dexie.Promise](https://dexie.org/docs/Promise/Promise.PSD)
  - Caution: we <span style='background: red'>monkey-patched Dexie</span> to access `incrementExpectedAwaits` and `decrementExpectedAwaits` to correctly detect native await on primitives

MD*/

// check if `incrementExpectedAwaits` and `decrementExpectedAwaits` are available
if (![incrementExpectedAwaits, decrementExpectedAwaits].every(func => typeof func === 'function')) {
  throw new Error('Dexie not monkey-patched to expose `incrementExpectedAwaits` and `decrementExpectedAwaits`');
}

const globalZone = (() => {
  let zone = Dexie.Promise.PSD;
  
  while (!zone.global) {
    if (zone.parent && zone.parent !== zone) {
      zone = zone.parent;
    } else {
      throw new Error('could not initialize `zones`: no global zone found');
    }
  }

  
  return zone;
})();



const Zone = {

  get root() { return globalZone; },

  get current() { return Dexie.Promise.PSD; }

};

export function withZone(scopeFunc, zoneProps = {}) {
  let returnValue;
  try {
    incrementExpectedAwaits();

    newPSD(() => {
      returnValue = scopeFunc.call();
    }, zoneProps);
    
    return returnValue;
  } finally {
    if (returnValue && typeof returnValue.then === 'function') {
      (async () => {
        try {
          await returnValue;
        } catch(e) {
          console.warn("Error in withZone: ", e.toString(), e.stack ? e.stack.toString() : "no stack")
        } finally {
          decrementExpectedAwaits();
        }
      })();
    } else {
      decrementExpectedAwaits();
    }
  }
}

function runZoned(fn, { zoneValues } = {} ) {
  return withZone(fn, zoneValues);
}

exposeGlobal('Zone', Zone);
exposeGlobal('runZoned', runZoned);

// ensure zones in known native promise calls
cop.layer(window, "ZonifyNativePromisesLayer").refineClass(Response, {
  text(...rest) {
    return Promise.resolve(cop.proceed(...rest))
  },
  
  json(...rest) {
    return Promise.resolve(cop.proceed(...rest))
  }
})
ZonifyNativePromisesLayer.beGlobal()
