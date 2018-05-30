import { defaultExample } from "./defaults.js";
import { deepCopy } from "./ast.js";
import { DefaultMap } from "./collections.js";

export default class Tracker {
  
  constructor() {
    this.ids = new DefaultMap( // Map(id, Map(exampleId, Map(runId, [{type, value}])))
      DefaultMap.builder(
        DefaultMap.builder(Array)
      )
    );
    this.blocks = new DefaultMap( // Map(id, Map(exampleId, runCounter))
      DefaultMap.builder(0)
    );
    this.executedBlocks = new Set(); // Set(id)
    this.exampleId = defaultExample().id;
    this.timer = new Timer();
    this._identities = new Map(); // Map(identity, symbol)
    this._symbolProvider = new IdentitySymbolProvider();
  }
  
  reset() {
    this.ids.clear();
    this.blocks.clear();
    this.executedBlocks.clear();
    this.exampleId = defaultExample().id;
    this._identities.clear();
    this._symbolProvider.reset();
  }

 id(id, exampleId, runId, value, name) {
    // Check and assign object identity
    if(value instanceof Object) {
      if(this._identities.has(value)) {
        value.__tracker_identity = this._identities.get(value);
      } else {
        value.__tracker_identity = this._symbolProvider.next();
        this._identities.set(value, value.__tracker_identity);
      }
    }
    
   
    let type = typeof(value);
    if(value.constructor && value.constructor.name) {
      type = value.constructor.name;
    }
    
    // Handle special cases
    if(value instanceof CanvasRenderingContext2D) {
      value = value.getImageData(0, 0, value.canvas.width, value.canvas.height);
    } else {
      value = deepCopy(value);
    }
    
    this.ids.get(id)
            .get(exampleId)
            .get(runId)
            .push({
              type: type,
              value: value,
              name: name
            });
    
    return value;
  }
  
  block(exampleId, id) {
    this.executedBlocks.add(id);
    const blockCount = this.blocks.get(id).get(exampleId);
    this.blocks.get(id).set(exampleId, blockCount + 1);
    return blockCount;
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
    this._maxRuntime = 1000;
    this._startTime = null;
  }
  
  start() {
    this._startTime = (+new Date());
  }
  
  check() {
    const time = (+new Date());
    if(time - this._startTime > this._maxRuntime) {
      throw new Error("Timeout reached. Maybe there is an inifinite loop?");
    }
  }
}
