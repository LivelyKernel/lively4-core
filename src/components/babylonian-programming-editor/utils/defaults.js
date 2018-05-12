export const defaultExample = () => ({
  id: 0,
  name: "script",
  color: ""
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

export const defaultTracker = () => ({
  // Properties
  ids: new Map(), // Map(id, Map(exampleId, Map(runId, [{type, value}]))) 
  blocks: new Map(), // Map(id, Map(exampleId, runCounter))
  executedBlocks: new Set(), // Set(id)

  // Functions
  id: function(exampleId, id, value, runId) {
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
    
    this.ids.get(id)
            .get(exampleId)
            .get(runId)
            .push({type: typeof(value), value: value});
    
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
  }
});