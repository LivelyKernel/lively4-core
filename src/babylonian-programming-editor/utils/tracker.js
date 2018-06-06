import { defaultExample } from "./defaults.js";
import { deepCopy } from "./ast.js";
import { DefaultMap } from "./collections.js";

export default class Tracker {
  
  constructor() {
    this.ids = new DefaultMap( // Map(id, Map(exampleId, Map(runId, {before, after: {type, value, name}]})) 
      DefaultMap.builder(
        DefaultMap.builder(Object)
      )
    );
    this.blocks = new DefaultMap( // Map(id, Map(exampleId, runCounter))
      DefaultMap.builder(0)
    );
    this.errors = new Map(); // Map(exampleId, errorMsg);
    this.executedBlocks = new Set(); // Set(id)
    this.exampleId = defaultExample().id;
    this.timer = new Timer();
    this._identities = new Map(); // Map(identity, symbol)
    this._symbolProvider = new IdentitySymbolProvider();
  }
  
  reset() {
    this.ids.clear();
    this.blocks.clear();
    this.errors.clear();
    this.executedBlocks.clear();
    this.exampleId = defaultExample().id;
    this._identities.clear();
    this._symbolProvider.reset();
  }

  id(id, exampleId, runId, value, name, keyword = "after") {
    if(!["before", "after"].includes(keyword)) {
      return value;
    }
   
    // Check and assign object identity
    if(value instanceof Object) {
      if(this._identities.has(value)) {
        value.__tracker_identity = this._identities.get(value);
      } else {
        value.__tracker_identity = this._symbolProvider.next();
        this._identities.set(value, value.__tracker_identity);
      }
    }
    
   
    // Check and store object type
    let type = typeof(value);
    if(value.constructor && value.constructor.name) {
      type = value.constructor.name;
    }
    
    // Copy the value
    if(value instanceof CanvasRenderingContext2D) {
      value = value.getImageData(0, 0, value.canvas.width, value.canvas.height);
    } else {
      value = deepCopy(value);
    }
   
    this.ids.get(id)
            .get(exampleId)
            .get(runId)[keyword] = {
              type: type,
              value: value,
              name: name
            };
    
    return value;
  }
  
  block(id) {
    this.executedBlocks.add(id);
    const blockCount = this.blocks.get(id).get(this.exampleId);
    this.blocks.get(id).set(this.exampleId, blockCount + 1);
    return blockCount;
  }
  
  error(errorMsg) {
    this.errors.set(this.exampleId, errorMsg);
  }
}


class IdentitySymbolProvider {
  constructor() {
    this._identitySymbols =  ['🐶','🐺','🐱','🐭','🐹','🐰','🐸','🐯','🐨','🐻','🐷','🐽','🐮','🐗','🐵','🐒','🐴','🐑','🐘','🐼','🐧','🐦','🐤','🐥','🐣','🐔','🐍','🐢','🐛','🐝','🐜','🐞','🐌','🐙','🐚','🐠','🐟','🐬','🐳','🐋','🐄','🐏','🐀','🐃','🐅','🐇','🐉','🐎','🐐','🐓','🐕','🐖','🐁','🐂','🐲','🐡','🐊'];
    this._index = 0;
  }
  
  next() {
    return this._identitySymbols[this._index++ % this._identitySymbols.length];
  }
  
  reset() {
    this._index = 0;
  }
}


class Timer {
  constructor() {
    this._maxRuntime = 5000;
    this._interruptDuration = 100;
    this._startTime = null;
    this._lastInterruptTime = null;
    this.timeoutReached = false;
  }
  
  start() {
    this._startTime = (+new Date());
  }
  
  async check() {
    const now = (+new Date());
    if(now - this._startTime > this._maxRuntime) {
      this.timeoutReached = true;
      throw new Error("Timeout reached");
    }
    if(now - this._lastInterruptTime > this._interruptDuration) {
      await new Promise(resolve => setTimeout(resolve, 0));
      this._lastInterruptTime = now;
    }
  }
}