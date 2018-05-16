export const defaultExample = () => ({
  id: 0,
  name: "script",
  color: "lightgray"
});

export const defaultInstance = () => ({
  id: 0,
  name: "null",
});

export const defaultBabylonConfig = () => ({
  babelrc: false,
  plugins: [],
  presets: [],
  filename: undefined,
  sourceFileName: undefined,
  moduleIds: false,
  sourceMaps: false,
  compact: false,
  comments: false,
  resolveModuleSource: undefined
});

export const defaultAnnotations = () => ({
  probes: [], // [Probe]
  sliders: [], // [Slider]
  examples: [], // [Example]
  replacements: [], // [Replacement]
  instances: [], // [Instance]
});

export const guid = () => {
  // from https://stackoverflow.com/questions/105034/create-guid-uuid-in-javascript
  function s4() {
    return Math.floor((1 + Math.random()) * 0x10000)
      .toString(16)
      .substring(1);
  }
  return  s4() + '-' + s4() + '-' + s4();
}

export const defaultTracker = () => ({
  // Properties
  ids: new Map(), // Map(id, Map(exampleId, Map(runId, [{type, value}]))) 
  blocks: new Map(), // Map(id, Map(exampleId, runCounter))
  executedBlocks: new Set(), // Set(id)

  // Functions
  id: function(id, exampleId, runId, value, name) {
    // Do the things we could just do with a DefaultDict...
    if(!this.ids.has(id)) {
      this.ids.set(id, new Map());
    }
    if(!this.ids.get(id).has(exampleId)) {
      this.ids.get(id)
              .set(exampleId, new Map());
    }
    if(!this.ids.get(id).get(exampleId).has(runId)) {
      this.ids.get(id)
              .get(exampleId)
              .set(runId, []);
    }
    
    // Check and assign object identity
    if(value instanceof Object) {
      if(this._identities.has(value)) {
        value.__tracker_identity = this._identities.get(value);
      } else {
        value.__tracker_identity = this._identitySymbols.pop();
        this._identities.set(value, value.__tracker_identity);
      }
    }
    
    this.ids.get(id)
            .get(exampleId)
            .get(runId)
            .push({
              type: typeof(value),
              value: this._clone(value),
              name: name
            });
    
    return value;
  },
  block: function(exampleId, id) {
    this.executedBlocks.add(id);
    if(!this.blocks.has(id)) {
      this.blocks.set(id, new Map());
    }
    const blockCount = this.blocks.get(id).has(exampleId)
                       ? this.blocks.get(id).get(exampleId)
                       : 0;
    this.blocks.get(id).set(exampleId, blockCount + 1);
    return blockCount;
  },
  
  // Utils
  _clone: function(obj) {
    // TODO: Cyclical structures...
    return JSON.parse(JSON.stringify(obj));
  },
  _identitySymbols:  ['🐶','🐺','🐱','🐭','🐹','🐰','🐸','🐯','🐨','🐻','🐷','🐽','🐮','🐗','🐵','🐒','🐴','🐑','🐘','🐼','🐧','🐦','🐤','🐥','🐣','🐔','🐍','🐢','🐛','🐝','🐜','🐞','🐌','🐙','🐚','🐠','🐟','🐬','🐳','🐋','🐄','🐏','🐀','🐃','🐅','🐇','🐉','🐎','🐐','🐓','🐕','🐖','🐁','🐂','🐲','🐡','🐊'],
  _identities: new Map(), // Map(identity, symbol)
});