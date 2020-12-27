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

const globalZone = () => {
  Dexie.Promise.PSD
}

const Zone = {

  get root() {return 42 },

  get current() {return 42 }

};

function runZoned(fn, { zoneValues = {} } = {} ) {
  
}

exposeGlobal('Zone', Zone);
exposeGlobal('runZoned', runZoned);
