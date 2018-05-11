// System imports
import Morph from 'src/components/widgets/lively-morph.js';
import { babel } from 'systemjs-babel-build';
const { traverse } = babel;

// Custom imports
import ASTWorkerWrapper from "./worker/ast-worker-wrapper.js";
import Timer from "./utils/timer.js";
import LocationConverter from "./utils/location-converter.js";
import {
  generateLocationMap,
  canBeProbed,
  canBeExample,
  canBeReplaced,
  canBeInstance,
  parameterNamesForFunctionIdentifier
} from "./utils/ast.js";
import { 
  loadFile,
  saveFile
} from "./utils/load-save.js";

import Probe from "./annotations/probe.js";
import Slider from "./annotations/slider.js";
import Example from "./annotations/example.js";
import Replacement from "./annotations/replacement.js";
import Instance from "./annotations/instance.js";

// Constants
const COMPONENT_URL = "https://lively-kernel.org/lively4/lively4-babylonian-programming/src/components/babylonian-programming-editor";
const USER_MARKER_KINDS = ["example", "replacement", "probe"];

/**
 * An editor for Babylonian (Example-Based) Programming
 */
export default class BabylonianProgrammingEditor extends Morph {
 
  /**
   * Loading the editor
   */
  
  initialize() {
    this.windowTitle = "Babylonian Programming Editor";
    
    // Lock evaluation until we are fully loaded
    this._evaluationLocked = true;
    
    // Set up the WebWorker for parsing
    this.worker = new ASTWorkerWrapper();
    
    // Set up AST
    this._ast = null; // Node
    this._selectedPath = null; // NodePath

    // Set up markers
    this._deadMarkers = []; // [TextMarker]
    
    // Set up Annotations
    this._annotations = {
      probes: [], // [Probe]
      sliders: [], // [Slider]
      examples: [], // [Example]
      replacements: [], // [Replacement]
      instances: [], // [Instance]
    };

    // Set up timer
    this.evaluateTimer = new Timer(300, this.evaluate.bind(this));
    
    // Set up CodeMirror
    this.editorComp().addEventListener("editor-loaded", () => {
      // Patch editor to load/save comments
      this.livelyEditor().loadFile = this.load.bind(this);
      this.livelyEditor().saveFile = this.save.bind(this);
      
      // Test file
      this.livelyEditor().setURL(`${COMPONENT_URL}/demos/1_script.js`);
      this.livelyEditor().loadFile();
      
      // Event listeners
      this.editor().on("change", () => {
        this.syncIndentations();
        this.evaluateTimer.start();
      });
      this.editor().on("beforeSelectionChange", this.onSelectionChanged.bind(this));
      this.editor().setOption("extraKeys", {
        "Ctrl-1": () => { this.addAnnotationAtSelection("probe") },
        "Ctrl-2": () => { this.addAnnotationAtSelection("example") },
        "Ctrl-3": () => { this.addAnnotationAtSelection("replacement") },
        "Tab": (cm) => { cm.replaceSelection("  ") },
      });
      
      // Inject styling into CodeMirror
      // This is dirty, but currently necessary
      fetch(`${COMPONENT_URL}/codemirror-inject-styles.css`).then(result => {
        result.text().then(styles => {
          const node = document.createElement('style');
          node.innerHTML = styles;
          this.editorComp().shadowRoot.appendChild(node);
        });
      });
    });
  }
  
  async load() {
    // Unlock evaluation after two seconds
    this._evaluationLocked = true;
    setTimeout(() => {
      this._evaluationLocked = false;
    }, 2000);
    
    // Remove all existing annotations
    for(let key in this._annotations) {
      for(let index in this._annotations[key]) {
        this._annotations[key][index].clear();
        this._annotations[key].splice(index, 1);
      }
    }
    
    // Load file from network
    let text = await loadFile(this.livelyEditor());
    await this.parse();
    
    // Find annotations
    let annotations = null;
    const matches = text.match(/\/\* Examples: (.*) \*\//);
    if(matches) {
      annotations = JSON.parse(matches[matches.length-1]);
      text = text.replace(matches[matches.length-2], "");
    }
    
    // Set text
    this.livelyEditor().setText(text);
    
    console.log(annotations);
    
    this.evaluate(this);
  }
  
  async save() {
    let serializedAnnotations = {};
    
    // Serialize annotations
    for(let key in this._annotations) {
      serializedAnnotations[key] = [];
      for(let annotation of this._annotations[key]) {
        serializedAnnotations[key].push(annotation.serializeForSave());
      }
    }
    const stringAnnotations = JSON.stringify(serializedAnnotations);
    
    // Save file
    let data = this.livelyEditor().currentEditor().getValue();
    data = `${data}/* Examples: ${stringAnnotations} */`;
    saveFile(this.livelyEditor(), data);
  }
  
  async loadAnnotations(newAnnotations) {
    // Unlock evaluation after two seconds
    this._evaluationLocked = true;
    setTimeout(() => {
      this._evaluationLocked = false;
    }, 2000);
    
    // Remove all existing annotations
    for(let key in this._annotations) {
      for(let index in this._annotations[key]) {
        this._annotations[key][index].clear();
        this._annotations[key].splice(index, 1);
      }
    }
    
    /*
    
    // Remove all existing markers
    for(let kind of USER_MARKER_KINDS) {
      this.markers[kind].forEach((w,m) => {
        this.markers[kind].get(m).clear(true);
        this.markers[kind].delete(m);
        m.clear();
      });
    }
    
    // Make sure we have a locationMap
    await this.parse();
    
    // Add new markers
    if(markers) {
      markers.probe.forEach(m => {
        const path = this.ast._locationMap[m.loc];
        this.addProbeAtPath(path);
      });
      markers.replacement.forEach(m => {
        const path = this.ast._locationMap[m.loc];
        this.addReplacementAtPath(path, m.value);
      });
      markers.example.forEach(m => {
        const path = this.ast._locationMap[m.loc];
        this.addExampleAtPath(path, m.value);
      });
    }*/
    
    // Evaluate
    this.evaluate(true);
  }
  
  
  /**
   * Adding annotations
   */
  
  addAnnotationAtSelection(kind) {
    // Get selected path
    const path = this._selectedPath;
    if(!path) {
      throw new Error("The selection is not valid");
    }
    
    // Add annotation
    switch(kind) {
      case "probe":
        // Decide if we mean a probe or a slider
        if(path.isLoop()) {
          this.addSliderAtPath(path);
        } else {
          this.addProbeAtPath(path);
        }
        break;
      case "example":
        // Decide if we mean an example or an instance
        if(path.parentPath.isClassDeclaration()) {
          this.addInstanceAtPath(path);
        } else {
          this.addExampleAtPath(path);
        }
        break;
      case "replacement":
        this.addReplacementAtPath(path);
        break;
      default:
        throw new Error("Unknown annotation kind");
    }
  }
  
  addProbeAtPath(path) {
    // Make sure we can probe this path
    if(!canBeProbed(path)) {
      return;
    }
    
    // Add the probe
    this._annotations.probes.push(
      new Probe(
        this.editor(),
        LocationConverter.astToMarker(path.node.loc),
        this._annotations.examples
      )
    );
    
    this.enforceAllSliders();
    this.evaluate();
  }

  addSliderAtPath(path) {
    // Make sure we can probe this path
    if(!canBeProbed(path)) {
      return;
    }
    
    // Add the slider
    this._annotations.sliders.push(
      new Slider(
        this.editor(),
        LocationConverter.astToMarker(path.node.loc),
        this.onSliderChanged.bind(this),
        this._annotations.examples
      )
    );
    
    this.evaluate();
  }

  addExampleAtPath(path) {
    // Make sure we can probe this path
    if(!canBeExample(path)) {
      return;
    }
    
    // Add the example
    this._annotations.examples.push(
      new Example(
        this.editor(),
        LocationConverter.astToMarker(path.node.loc),
        this.onEvaluationNeeded.bind(this)
      )
    );
    
    this.evaluate();
  }
  
  addReplacementAtPath(path) {
    // Make sure we can replace this path
    if(!canBeReplaced(path)) {
      return;
    }
    
    // Add the replacement
    this._annotations.replacements.push(
      new Replacement(
        this.editor(),
        LocationConverter.astToMarker(path.node.loc),
        this.onEvaluationNeeded.bind(this)
      )
    );
    
    this.evaluate();
  }
  
  addInstanceAtPath(path) {
    // Make sure we can add an instance to this path
    if(!canBeInstance(path)) {
      return;
    }
    
    // Add the instance
    this._annotations.instances.push(
      new Instance(
        this.editor(),
        LocationConverter.astToMarker(path.node.loc),
        this.onEvaluationNeeded.bind(this)
      )
    );
    
    this.evaluate();
  }
  
  
  /**
   * Updating annotations
   */
  
  syncIndentations() {
    for(let key in this._annotations) {
      for(let annotation of this._annotations[key]) {
        annotation.syncIndentation();
      }
    }
  }
  
  updateAnnotations() {
    // Update sliders
    for(let slider of this._annotations.sliders) {
      const node = this.nodeForAnnotation(slider).body;
      if(window.__tracker.blocks.has(node._id)) {
        slider.maxValues = window.__tracker.blocks.get(node._id);
      } else {
        slider.empty();
      }
    }
    
    // Update probes
    for(let probe of this._annotations.probes) {
      const node = this.nodeForAnnotation(probe);
      if(window.__tracker.ids.has(node._id)) {
        probe.values = window.__tracker.ids.get(node._id);
      } else {
        probe.empty();
      }
    }
    
    // Update examples
    for(let example of this._annotations.examples) {
      if(example.default) {
        continue;
      }
      const path = this.pathForAnnotation(example);
      example.keys = parameterNamesForFunctionIdentifier(path);
    }
  }

  updateDeadMarkers() {
    // Remove old dead markers
    this._deadMarkers.map(m => m.clear());

    // Add new markers
    const that = this;
    traverse(this._ast, {
      BlockStatement(path) {
        if(!window.__tracker.executedBlocks.has(path.node._id)) {
          const markerLocation = LocationConverter.astToMarker(path.node.loc);
          that._deadMarkers.push(
            that.editor().markText(
              markerLocation.from,
              markerLocation.to,
              {
                className: "marker dead"
              }
            )
          );
        }
      }
    });
  }
  
  enforceAllSliders() {
    for(let slider of this._annotations.sliders) {
      slider.fire();
    }
  }
  
  removeAnnotation(annotation) {
    for(let key in this._annotations) {
      if(this._annotations[key].includes(annotation)) {
        this._annotations[key].splice(this._annotations[key].indexOf(annotation), 1);
      }
    }
    annotation.clear()
  }
  
  
  /**
   * Evaluating code
   */
  
  async parse() {    
    // Serialize annotations
    let serializedAnnotations = {};
    for(let key in this._annotations) {
      serializedAnnotations[key] = this._annotations[key].map((a) => a.serializeForWorker());
    }

    // Call the worker
    const { ast, code } = await this.worker.process(
      this.editor().getValue(),
      serializedAnnotations
    );
    if(!ast) {
      return;
    }

    this._ast = ast;

    // Post-process AST
    // (we can't do this in the worker because it create a cyclical structure)
    generateLocationMap(ast);
    
    return code;
  }
  
  async evaluate(ignoreLock = false) {
    if(this._evaluationLocked && !ignoreLock) {
      return;
    }
    
    // Parse the code
    const code = await this.parse()

    // Execute the code
    console.log("Executing", code);
    this.execute(code);

    // Show the results
    this.updateAnnotations();
    this.updateDeadMarkers();
  }
  
  execute(code) {
    // Prepare result container
    window.__tracker = {
      // Properties
      ids: new Map(), // Map(id, Map(exampleId, Map(runId, {type, value}))) 
      blocks: new Map(), // Map(id, Map(exampleId, runCounter))
      executedBlocks: new Set(), // Set(id)

      // Functions
      id: function(exampleId, id, value, runId) {
        if(!this.ids.has(id)) {
          this.ids.set(id, new Map());
        }
        if(!this.ids.get(id).has(exampleId)) {
          this.ids.get(id).set(exampleId, new Map());
        }
        this.ids.get(id).get(exampleId).set(runId, {type: typeof(value), value: value});
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
    };

    // Execute the code
    try {
      eval(code);
    } catch (e) {
      console.warn("Could not execute code");
      console.error(e);
    }
  }

  
  /**
   * Event handlers
   */
  
  onSelectionChanged(instance, data) {
    // This needs an AST
    if(!this.hasWorkingAst()) {
      this._selectedPath = null;
      return;
    }
    
    // Get selected path
    const selectedLocation = LocationConverter.selectionToKey(data.ranges[0]);

    // Check if we selected a node
    if(selectedLocation in this._ast._locationMap) {
      this._selectedPath = this._ast._locationMap[selectedLocation];
    } else {
      this._selectedPath = null;
    }
  }

  onSliderChanged(slider, exampleId, value) {
    // Get the location for the body
    const node = this.nodeForAnnotation(slider);
    const bodyLocation = LocationConverter.astToKey({
      start: node.loc.start,
      end: node.body.loc.end
    });

    // Get all probes in the body
    const includedProbes = this._annotations.probes.filter((probe) => {
      const probeLocation = probe.locationAsKey;
      const beginsAfter = probeLocation[0] > bodyLocation[0]
                          || (probeLocation[0] === bodyLocation[0]
                              && probeLocation[1] >= bodyLocation[1]);
      const endsBefore = probeLocation[2] < bodyLocation[2]
                         || (probeLocation[2] === bodyLocation[2]
                             && probeLocation[3] <= bodyLocation[3]);
      return beginsAfter && endsBefore;
    });
    
    // Tell all probes about the selected run
    for(let probe of includedProbes) {
      probe.setActiveRunForExampleId(exampleId, value);
    }
  }
  
  onEvaluationNeeded() {
    this.evaluate();
  }
  
  
  /**
   * Shortcuts
   */

  hasWorkingAst() {
    return (this._ast && this._ast._locationMap);
  }
  
  nodeForAnnotation(annotation) {
    const path = this.pathForAnnotation(annotation);
    if(path) {
      return path.node;
    }
    return null;
  }
  
  pathForAnnotation(annotation) {
    if(this.hasWorkingAst()) {
      return this._ast._locationMap[annotation.locationAsKey];
    }
    return null;
  }
  
  livelyEditor() {
    return this.get("#source");
  }
  
  editorComp() {
    return this.livelyEditor().get("lively-code-mirror");
  }
  
  editor() {
    return this.editorComp().editor
  }
  
}