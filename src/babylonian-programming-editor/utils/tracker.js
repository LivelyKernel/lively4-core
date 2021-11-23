import { defaultExample } from "./defaults.js";
import { deepCopy } from "./utils.js";
import { DefaultMap } from "./collections.js";

export default class Tracker {
  
  constructor() {
    this.ids = new DefaultMap( // Map(id, Map(exampleId, Map(runId, {before, after: {type, value, name}]})) 
      DefaultMap.builder(
        DefaultMap.builder(Object)
      )
    );
    this.idIterationParents = new DefaultMap(0); // Map(id, iterationId); 
    this.iterations = new DefaultMap( // Map(id, Map(exampleId, iterationCounter))
      DefaultMap.builder(0)
    );
    this.errors = new Map(); // Map(exampleId, errorMsg);
    this.executedBlocks = new Set(); // Set(id)
    // this.exampleId = defaultExample().id;
    this.exampleIds = new Set();
    this.exampleIds.add(this.exampleId);
    this.timer = new Timer();
    this._identities = new Map(); // Map(identity, symbol)
    this._symbolProvider = new IdentitySymbolProvider();
  }
  
  reset() {
    this.ids.clear();
    this.idIterationParents.clear();
    this.iterations.clear();
    this.errors.clear();
    this.executedBlocks.clear();
    this.exampleId = defaultExample().id;
    this.exampleIds.clear();
    this.exampleIds.add(this.exampleId);
    this._identities.clear();
    this._symbolProvider.reset();
  }

  id(id, exampleId, iterationParentId, runId, value, name, keyword = "after") {
    const originalValue = value;
    
    // console.log('TRACKER ID ' + id 
    //             + " exampleId: " + exampleId 
    //             +  " iterationParentId: " + iterationParentId
    //             +  " runId: " + runId
    //             + " Value: " + value
    //             + " keyword:" + keyword)
    // #TODO #ContinueHere for implementing aysnc Babylonian Programming....
    // next steps is signalling that this item has changed and might be in need for updating...
    if(!["before", "after"].includes(keyword)) {
      return value;
    }
    this.idIterationParents.set(id, iterationParentId);
   
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
    if(value && value.constructor && value.constructor.name) {
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
    
    return originalValue;
  }
  
  block(id) {
    this.executedBlocks.add(id);
  }
  
  iteration(id) {
    const iterationMap = this.iterations.get(id);
    const iterationCount = iterationMap.get(this.exampleId);
    iterationMap.set(this.exampleId, iterationCount + 1);
    return iterationCount;
  }
  
  error(errorMsg) {
    this.errors.set(this.exampleId, errorMsg);
  }
  
  get exampleId() {
    return Zone.current.babylonianExampleId
  }
  
  set exampleId(id) {
    // throw new Error("exampleId should not be set")
  }
  
  example(exampleId) {
    // this.exampleId = exampleId; // for async examples this is not enough... Zone.current.babylonianExampleId
    this.exampleIds.add(this.exampleId);
  }
}


export class IdentitySymbolProvider {
  constructor() {
    this._identitySymbols =  ['🐶','🐺','🐱','🐭','🐹','🐰','🐸','🐯','🐨','🐻','🐷','🐽','🐮','🐗','🐵','🐒','🐴','🐑','🐘','🐼','🐧','🐦','🐤','🐥','🐣','🐔','🐍','🐢','🐛','🐝','🐜','🐞','🐌','🐙','🐚','🐠','🐟','����','🐳','🐋','🐄','🐏','🐀','🐃','🐅','🐇','🐉','🐎','🐐','🐓','🐕','🐖','🐁','🐂','🐲','🐡','🐊'];
    this._index = 0;
  }
  
  next() {
    return this._identitySymbols[this._index++ % this._identitySymbols.length];
  }
  
  reset() {
    this._index = 0;
  }
}

export class Timer {
  
  static get MaxRuntime() {
     return 1000
  }
  
  constructor() {
    this._maxRuntime = Timer.MaxRuntime;
    this._startTime = null;
  }
  
  start() {
    this._startTime = (+new Date());
  }
  
  reset() {
    this._startTime = null;
  }
  
  check() {
    if(this._startTime === null) {
      return;
    }
    
    const time = (+new Date());
    if(time - this._startTime > this._maxRuntime) {
      throw new Error("Timeout reached. Maybe there is an inifinite loop?");
    }
  }
}
