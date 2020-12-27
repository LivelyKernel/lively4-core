import 'lang';
import Dexie from "src/external/dexie3.js";

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
MD*/

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

function runZoned(fn, { zoneValues } = {} ) {
  return Dexie.Promise.newPSD(fn, zoneValues);
}

exposeGlobal('Zone', Zone);
exposeGlobal('runZoned', runZoned);
