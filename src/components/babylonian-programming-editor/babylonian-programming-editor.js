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
  Slider,
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

// Constants
const COMPONENT_URL = "https://lively-kernel.org/lively4/lively4-babylonian-programming/src/components/babylonian-programming-editor";
const USER_MARKER_KINDS = ["example", "replace", "probe"];

/**
 * An editor for Babylonian (Example-Based) Programming
 */
export default class BabylonianProgrammingEditor extends Morph {
 
  initialize() {
    this.windowTitle = "Babylonian Programming Editor";
    
    // Set up the WebWorker for parsing
    this.worker = new ASTWorkerWrapper();
    
    // Set up AST
    this.ast = null;
    this.selectedPath = null;

    // Set up markers
    this.markers = {
      dead: []
    };
    USER_MARKER_KINDS.map(m => this.markers[m] = new Map()); // TextMarker -> Annotation
    
    // Set up timer
    this.evaluateTimer = new Timer(300, this.evaluate.bind(this));
    
    // Set up CodeMirror
    this.editorComp().addEventListener("editor-loaded", () => {
      // Test file
      this.get("#source").setURL(`${COMPONENT_URL}/demos/1_script.js`);
      this.get("#source").loadFile();
      
      // Event listeners
      this.editor().on("change", this.evaluateTimer.start.bind(this.evaluateTimer));
      this.editor().on("beforeSelectionChange", this.selectionChanged.bind(this));
      this.editor().setOption("extraKeys", {
        "Ctrl-1": this.toggleProbe.bind(this),
        "Ctrl-2": this.toggleReplace.bind(this),
        "Ctrl-3": this.toggleExample.bind(this)
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
  
  
  // Event handlers
  
  /**
   * Is called whenever the user's selection in the editor changes
   */
  selectionChanged(instance, data) {
    // This needs an AST
    if(!this.hasWorkingAst()) {
      return;
    }
    
    // Get selected path
    const selectedLocation = LocationConverter.selectionToKey(data.ranges[0]);

    // Check if we selected a node
    if(selectedLocation in this.ast._locationMap) {
      this.selectedPath = this.ast._locationMap[selectedLocation];
    } else {
      this.selectedPath = null;
    }
  }
  
  /**
   * Toggles a probe at the selected location
   */
  toggleProbe() {
    this.toggleMarkerAtSelection("probe");
  }

  /**
   * Toggles a replacement at the selected location
   */
  toggleReplace() {
    this.toggleMarkerAtSelection("replace");
  }
  
  /**
   * Toggles an example at the selected location
   */
  toggleExample() {
    this.toggleMarkerAtSelection("example");
  }
  
  
  // Evaluating and running code
  
  /**
   * Evaluates the current editor content and updates the results
   */
  async evaluate() {
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
    }

    // Call the worker
    const { ast, code } = await this.worker.process(
      this.editor().getValue(),
      markers
    );
    if(!ast) {
      return;
    }
    console.log(code);

    this.ast = ast;

    // Post-process AST
    // (we can't do this in the worker because it create a cyclical structure)
    generateLocationMap(ast);

    // Execute the code
    this.execute(code);

    // Show the results
    this.updateWidgets();
    this.updateDeadMarkers();
  }
  
  
  /**
   * Executes the given code
   */
  execute(code) {
    // Prepare result container
    window.__tracker = {
      // Properties
      ids: new Map(),
      blocks: new Map(),

      // Functions
      id: function(id, value, blockCount) {
        if(!this.ids.has(id)) {
          this.ids.set(id, new Map());
        }
        this.ids.get(id).set(blockCount, [typeof(value), value]);
        return value;
      },
      block: function(id) {
        const blockCount = this.blocks.has(id) ? this.blocks.get(id) : 0;
        this.blocks.set(id, blockCount + 1);
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
   * Returns the marker-location of the currently selected path
   */
  getSelectedPathLocation() {
    if(!this.selectedPath) {
      return null;
    }

    return LocationConverter.astToMarker(this.selectedPath.node.loc);
  }
  
  /**
   * Removes a marker from the editor
   */
  removeMarker(marker) {
    marker.clear();
    USER_MARKER_KINDS.map(m => {
      if(this.markers[m].has(marker)) {
        this.markers[m].get(marker).clear();
        this.markers[m].delete(marker);
      }
    });
  }
  
  /**
   * Removes an existing marker at the selected location,
   * or calls the callback to create a new one
   */
  toggleMarkerAtSelection(newMarkerKind) {
    const loc = this.getSelectedPathLocation();
    if(!loc) {
      return;
    }
    if(!USER_MARKER_KINDS.includes(newMarkerKind)) {
      throw Error("Unknown marker kind");
    }

    const existingMarks = this.editor()
                              .findMarks(loc.from, loc.to)
                              .filter(m => m._babylonian);
    if(existingMarks.length > 0) {
      existingMarks.map(this.removeMarker.bind(this));
    } else if(newMarkerKind === "probe" && canBeProbed(this.selectedPath)) {
      // Distinguish between value-probes (identifier, return) and loop-probes
      if(this.selectedPath.isLoop()) {
        const marker = addMarker(this.editor(), loc, [newMarkerKind]);
        const onSliderChanged = (newValue) => {
          // Get all markers for the body
          const loopPath = this.ast._locationMap[LocationConverter.markerToKey(marker.find())];
          const bodyLoc = LocationConverter.astToMarker({
            start: loopPath.node.loc.start,
            end: loopPath.node.body.loc.end
          });
          const includedMarkers = this.editor()
                                      .findMarks(bodyLoc.from, bodyLoc.to)
                                      .filter(m => m._babylonian);


          includedMarkers.forEach(marker => {
            const widget = this.markers.probe.get(marker);
            if(widget instanceof Annotation) {
              widget.setActiveRun(newValue);
            }
          });
        }
        this.markers[newMarkerKind].set(
          marker,
          new Slider(this.editor(), loc.to.line, newMarkerKind, onSliderChanged)
        );
        onSliderChanged(0);
      } else {
        this.markers[newMarkerKind].set(
          addMarker(this.editor(), loc, [newMarkerKind]),
          new Annotation(this.editor(), loc.to.line, newMarkerKind)
        );
      }
    } else if(newMarkerKind === "replace" && canBeReplaced(this.selectedPath)) {
      const marker = addMarker(this.editor(), loc, [newMarkerKind]);
      this.markers[newMarkerKind].set(
        marker,
        new Input(
          this.editor(),
          loc.to.line,
          newMarkerKind,
          (newValue) => {
            marker._replacementNode = replacementNodeForCode(newValue);
            this.evaluate();
          }
        )
      );
    } else if(newMarkerKind === "example" && canBeExample(this.selectedPath)) {
      const marker = addMarker(this.editor(), loc, [newMarkerKind]);
      let lineWidget;
      
      // TMP: Just a plain input for classes
      if(this.selectedPath.parentPath.isClassDeclaration()) {
        lineWidget = new Input(
          this.editor(),
          loc.to.line,
          newMarkerKind,
          (newValue) => {
            marker._replacementNode = replacementNodeForCode(newValue);
            this.evaluate();
          }
        )
      } else {
        lineWidget = new Form(
          this.editor(),
          loc.to.line,
          newMarkerKind,
          parameterNamesForFunctionIdentifier(this.selectedPath),
          (newValue) => {
            marker._replacementNode = replacementNodeForCode(newValue);
            this.evaluate();
          }
        );
      }
      
      this.markers[newMarkerKind].set(
        marker,
        lineWidget
      );
    } else {
      console.warn("Could neither remove nor add a marker");
    }
    this.evaluate();
  }
  
  updateWidgets() {
    // Update widgets for replacements
    this.markers.replace.forEach((widget, marker) => {
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

  updateDeadMarkers() {
    // Remove old dead markers
    this.markers.dead.map(m => m.clear());

    // Add new markers
    const that = this;
    traverse(this.ast, {
      BlockStatement(path) {
        if(!window.__tracker.blocks.has(path.node._id)) {
          const markerLocation = LocationConverter.astToMarker(path.node.loc);
          that.markers.dead.push(
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
   * Checks whether we currently have a working AST
   */
  hasWorkingAst() {
    return (this.ast && this.ast._locationMap);
  }
  
  
  // UI Acessors
  
  editorComp() {
    return this.get("#source").get("lively-code-mirror");
  }
  
  editor() {
    return this.editorComp().editor
  }
  
}