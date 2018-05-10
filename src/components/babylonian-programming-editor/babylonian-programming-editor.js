// System imports
import Morph from 'src/components/widgets/lively-morph.js';
import { babel } from 'systemjs-babel-build';
const { traverse } = babel;

// Custom imports
import ASTWorkerWrapper from "./worker/ast-worker-wrapper.js";
import Timer from "./utils/timer.js";
import LocationConverter from "./utils/location-converter.js";
import {
  Annotation,
  Input,
  Form,
  addMarker
} from "./utils/ui.js";
import {
  generateLocationMap,
  canBeProbed,
  canBeExample,
  canBeReplaced,
  replacementNodeForCode,
  parameterNamesForFunctionIdentifier
} from "./utils/ast.js";
import { patchEditor } from "./utils/load-save.js";

import Probe from "./data/probe.js";
import Slider from "./data/slider.js";

// Constants
const COMPONENT_URL = "https://lively-kernel.org/lively4/lively4-babylonian-programming/src/components/babylonian-programming-editor";
const USER_MARKER_KINDS = ["example", "replacement", "probe"];

/**
 * An editor for Babylonian (Example-Based) Programming
 */
export default class BabylonianProgrammingEditor extends Morph {
 
  initialize() {
    this.windowTitle = "Babylonian Programming Editor";
    
    // Lock evaluation until we are fully loaded
    this._evaluationLocked = false;
    
    // Set up the WebWorker for parsing
    this.worker = new ASTWorkerWrapper();
    
    // Set up AST
    this._ast = null;
    this._selectedPath = null;

    // Set up markers
    this._deadMarkers = []
    
    // Set up Annotations
    this._annotations = {
      probes: [], // [Probe]
      sliders: [], // [Slider]
    };
    
    // Set up timer
    this.evaluateTimer = new Timer(300, this.evaluate.bind(this));
    
    // Set up CodeMirror
    this.editorComp().addEventListener("editor-loaded", () => {
      // Patch editor to load/save comments
      /*patchEditor(
        this.get("#source"),
        () => this.markers,
        this.setMarkers.bind(this)
      );*/
      
      // Test file
      this.get("#source").setURL(`${COMPONENT_URL}/demos/1_script.js`);
      this.get("#source").loadFile();
      
      // Event listeners
      this.editor().on("change", () => {
        this.syncIndentations();
        this.evaluateTimer.start();
      });
      this.editor().on("beforeSelectionChange", this.onSelectionChanged.bind(this));
      this.editor().setOption("extraKeys", {
        "Ctrl-1": () => { this.addAnnotationAtSelection("probe") },
        "Ctrl-2": () => { this.toggleMarkerAtSelection("replacement") },
        "Ctrl-3": () => { this.toggleMarkerAtSelection("example") },
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
  
  
  async setMarkers(markers) {
    // Unlock evaluation after two seconds
    this._evaluationLocked = true;
    setTimeout(() => {
      this._evaluationLocked = false;
    }, 2000);
    
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
    }
    
    // Evaluate
    this.evaluate(true);
  }

  // Event handlers
  
  /**
   * Is called whenever the user's selection in the editor changes
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
  
  
  /**
   * Is called when a slider's value changes
   */
  onSliderChanged(slider, exampleId, value) {
    // Get the location for the body
    const node = this._nodeForAnnotation(slider);
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
  
  
  // Adding new Annotations
  
  /**
   * Adds a new annotation at the selected element
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
      default:
        throw new Error("Unknown annotation kind");
    }
  }
  
  
  /**
   * Adds a new probe at the given path
   */
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
      )
    );
    
    this.enforceAllSliders();
    this.evaluate();
  }
  
  /**
   * Adds a new slider at the given path
   */
  addSliderAtPath(path) {
    // Make sure we can probe this path
    if(!canBeProbed(path)) {
      return;
    }
    
    // Add the probe
    this._annotations.sliders.push(
      new Slider(
        this.editor(),
        LocationConverter.astToMarker(path.node.loc),
        this.onSliderChanged.bind(this)
      )
    );
    
    this.evaluate();
  }
  
  
  // Evaluating and running code
  
  /**
   * Parses the current code
   */
  async parse() {
    /*
    // Convert the markers
    const convertMarker = m => ({
      loc: LocationConverter.markerToKey(m.find()),
      replacementNode: m._replacementNode
    });
    
    const markers = {};
    for(const markerKey of USER_MARKER_KINDS) {
      // Remove invalid markers
      this.markers[markerKey].forEach((annotation, marker) => {
        if(!marker.find()) {
          this.removeMarker(marker);
        }
      })
      
      // Convert marker
      markers[markerKey] = Array.from(this.markers[markerKey].keys())
                                .map(convertMarker);
    }*/
    
    // TODO: Remove unused
    
    // Serialize annotations
    let serializedAnnotations = {};
    for(let key in this._annotations) {
      serializedAnnotations[key] = this._annotations[key].map((a) => a.serialize());
    }
    console.log(serializedAnnotations);

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
  
  /**
   * Evaluates the current editor content and updates the results
   */
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
  
  
  /**
   * Executes the given code
   */
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
  
  
  // UI
  
  /**
   * Removes a marker from the editor
   */
  removeMarker(marker) {
    // Remove the associated widget
    USER_MARKER_KINDS.map(m => {
      if(this.markers[m].has(marker)) {
        this.markers[m].get(marker).clear();
        this.markers[m].delete(marker);
      }
    });
    // Remove the marker itself
    marker.clear();
  }
  
  /**
   * Removes an existing marker at the selected location,
   * or calls the callback to create a new one
   */
  toggleMarkerAtSelection(kind) {
    // Make sure there is a selection
    if(!this.selectedPath) {
      throw Error("There is no selected node");
    }
    
    // Make sure the marker kind is valid
    if(!USER_MARKER_KINDS.includes(kind)) {
      throw Error("Unknown marker kind");
    }
    
    // Get existing markers at the selection
    const path = this.selectedPath;
    const loc = LocationConverter.astToMarker(path.node.loc);
    const existingMarks = this.editor()
                              .findMarks(loc.from, loc.to)
                              .filter(m => m._babylonian);
    
    if(existingMarks.length > 0) {
      // Remove existing markers
      existingMarks.map(this.removeMarker.bind(this));
    } else if(kind === "probe") {
      // Add a probe
      this.addProbeAtPath(path);
    } else if(kind === "replacement") {
      // Add a replacement
      this.addReplacementAtPath(path);
    } else if(kind === "example") {
      // Add a example
      this.addExampleAtPath(path);
    }
    
    // Re-evaluate the examples
    this.evaluate();
  }
  
  /**
   * Adds a replacement at the given path
   */
  addReplacementAtPath(path, initialValue = null) {
    // Make sure we can replace this path
    if(!canBeReplaced(path)) {
      return;
    }
    
    // Prepare variables
    const kind = "replacement";
    const loc = LocationConverter.astToMarker(path.node.loc);
    
    // Add a new replacement
    const marker = addMarker(this.editor(), loc, kind);
    const widget = new Input(
      this.editor(),
      loc,
      kind,
      initialValue,
      this.makeInputValueCallback(this, marker)
    );
    
    this.markers[kind].set(marker, widget);
  }
  
  /**
   * Adds an example at the given path
   */
  addExampleAtPath(path, initialValue = null) {
    // Make sure we can add an example at this path
    if(!canBeExample(path)) {
      return;
    }
    
    // Prepare variables
    const kind = "example";
    const loc = LocationConverter.astToMarker(path.node.loc);
    const marker = addMarker(this.editor(), loc, kind);
    let widget = null;

    // Distinguish between class- and function examples
    if(path.parentPath.isClassDeclaration()) {
      // For classes: Just show a simple input
      widget = new Input(
        this.editor(),
        loc,
        kind,
        initialValue,
        this.makeInputValueCallback(this, marker)
      )
    } else {
      // For functions: Show a form for the parameters
      widget = new Form(
        this.editor(),
        loc,
        kind,
        initialValue,
        parameterNamesForFunctionIdentifier(path),
        this.makeInputValueCallback(this, marker)
      );
    }

    // Add a new example
    if(marker && widget) {
      this.markers[kind].set(marker, widget);
    }
  }
  
  /**
   * Creates a callback for input value changes (examples, replacements)
   */
  makeInputValueCallback(that, marker) {
    return (newValue) => {
      marker._replacementNode = replacementNodeForCode(newValue);
      that.evaluate();
    }
  }
  
  /**
   * Is called whenever a slider's value changes (loops)
   */
  makeSliderValueCallback(that, marker) {
    return (newValue) => {
      // Get the location for the body
      const loopPath = that.ast._locationMap[LocationConverter.markerToKey(marker.find())];
      const bodyLoc = LocationConverter.astToMarker({
        start: loopPath.node.loc.start,
        end: loopPath.node.body.loc.end
      });

      // Get all markers in the body
      const includedMarkers = that.editor()
                                  .findMarks(bodyLoc.from, bodyLoc.to)
                                  .filter(m => m._babylonian);

      // Tell all markers about the selected run
      includedMarkers.forEach(marker => {
        const widget = that.markers.probe.get(marker);
        if(widget instanceof Annotation) {
          widget.setActiveRun(newValue);
        }
      });
    }
  }
  
  /**
   * Syncs the indentations of all annotations
   */
  syncIndentations() {
    for(let key in this._annotations) {
      for(let annotation of this._annotations[key]) {
        annotation.syncIndentation();
      }
    }
  }
  
  /**
   * Updates the values of all annotations
   */
  updateAnnotations() {
    // Update sliders
    for(let slider of this._annotations.sliders) {
      const node = this._nodeForAnnotation(slider).body;
      if(window.__tracker.blocks.has(node._id)) {
        slider.value = window.__tracker.blocks.get(node._id);
      }
    }
    
    // Update probes
    for(let probe of this._annotations.probes) {
      const node = this._nodeForAnnotation(probe);
      if(window.__tracker.ids.has(node._id)) {
        probe.value = window.__tracker.ids.get(node._id);
      }
    }
  }
  
  /**
   * Updates the values of all widgets
   */
  updateWidgets() {
    // Enforce all sliders
    this.enforceSliders();
    
    // Update widgets for replacements
    this.markers.replacement.forEach((widget, marker) => {
      const markerLoc = marker.find();
      widget.update(markerLoc.from.ch);
    });
    
    // Update widgets for probes
    this.markers.probe.forEach((widget, marker) => {
      const markerLoc = marker.find();
      const probedNode = this.ast._locationMap[LocationConverter.markerToKey(marker.find())].node;
      
      // Distinguish between Annotations and Sliders
      if(widget instanceof Annotation) {
        let values = null;
        if(window.__tracker.ids.has(probedNode._id)) {
          values = window.__tracker.ids.get(probedNode._id);
        }
        widget.update(values, markerLoc.from.ch);
      } else if(widget instanceof Slider) {
        let maxValue = 0;
        if(window.__tracker.blocks.has(probedNode.body._id)) {
          maxValue = window.__tracker.blocks.get(probedNode.body._id) - 1;
        }
        widget.update(maxValue, markerLoc.from.ch);
      }
    });
    
    // Update widgets for examples
    this.markers.example.forEach((widget, marker) => {
      const markerLoc = marker.find();
      const exampleNode = this.ast._locationMap[LocationConverter.markerToKey(marker.find())];
      if(widget instanceof Form) {
        widget.update(
          parameterNamesForFunctionIdentifier(exampleNode),
          markerLoc.from.ch
        );
      } else if (widget instanceof Input) {
        widget.update(
          markerLoc.from.ch
        );
      }
    });
  }

  /**
   * Marks all dead code
   */
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
  
  /**
   * Enforces all sliders
   */
  enforceAllSliders() {
    for(let slider of this._annotations.sliders) {
      slider.fire();
    }
  }
  
  /**
   * Checks whether we currently have a working AST
   */
  hasWorkingAst() {
    return (this._ast && this._ast._locationMap);
  }
  
  /**
   * Returns the node for a given annotation
   */
  _nodeForAnnotation(annotation) {
    if(this.hasWorkingAst()) {
      return this._ast._locationMap[annotation.locationAsKey].node;
    }
    return null;
  }
  
  
  // UI Acessors
  
  editorComp() {
    return this.get("#source").get("lively-code-mirror");
  }
  
  editor() {
    return this.editorComp().editor
  }
  
}