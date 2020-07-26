// System imports
import Morph from 'src/components/widgets/lively-morph.js';
import systemBabel from 'systemjs-babel-build';
const { traverse } = systemBabel.babel;

// Custom imports
import BabylonianWorker from "./worker/babylonian-worker.js";
import Timer from "./utils/timer.js";
import LocationConverter from "./utils/location-converter.js";
import {
  astForCode,
  canBeProbe,
  canBeExample,
  canBeReplacement,
  canBeInstance,
  canBeSlider,
  parameterNamesForFunctionIdentifier,
  constructorParameterNamesForClassIdentifier,
  bodyForPath
} from "./utils/ast.js";
import {
  defaultContext,
  defaultAnnotations
} from "./utils/defaults.js";
import Probe from "./annotations/probe.js";
import Slider from "./annotations/slider.js";
import Example from "./annotations/example.js";
import Replacement from "./annotations/replacement.js";
import Instance from "./annotations/instance.js";
import InstanceWidget from "./ui/instance-widget.js";
import StatusBar from "./ui/status-bar.js";
import { TextButton } from "./ui/buttons.js";
import CustomInstance from "./utils/custom-instance.js";
import {
  compareKeyLocations,
  keyLocationsAreEqual,
  stringInsert,
  stringRemove
} from "./utils/utils.js";
import Performance from "./utils/performance.js";


// Constants
const COMPONENT_URL = `${lively4url}/src/babylonian-programming-editor`;
const DEFAULT_FILE_URL = `${COMPONENT_URL}/demos/tree-improved.js`;


/**
 * An editor for Babylonian (Example-Based) Programming
 */
export default class BabylonianProgrammingEditor extends Morph {

  /**
   * Loading the editor
   */

  async initialize() {
    this.windowTitle = "Babylonian Programming Editor";

    // Lock evaluation until we are fully loaded
    this._evaluationLocked = true;

    // Register editor
    BabylonianWorker.registerEditor(this);

    // AST
    this._ast = null; // Node

    // Selection
    this._selectedLocation = null;
    this._selectedPath = null; // NodePath
    this._selectedPathActions = []; // [String]

    // Pure text markers
    this._deadMarkers = []; // [TextMarker]

    // All Annotations
    this._annotations = defaultAnnotations();
    this._customInstances = [];

    // Module context
    this._context = defaultContext();

    // Currently activated examples
    this._activeExamples = []; // [Example]

    // Timer to evaluate when user stops writing
    this._changeTimer = new Timer(500, this.evaluate.bind(this));

    // Status Bar
    this._statusBar = new StatusBar(this.get("#status"));
    this.updateButtons();

    // CodeMirror

    this.livelyEditor().postLoadFile = (text) => {
      return this.loadFileBabylonian(text)
    }
    
    this.livelyEditor().preSaveFile = (text) => {
      return this.saveFileBabylonian(text)
    }
    
    this.livelyEditor().addEventListener("url-changed", (evt) => {
      this.setAttribute("url", this.livelyEditor().getURL())
    })
     
     
    
    var editorComp = this.editorComp()
      
    console.log("Babylonian: load editor" + editorComp)
    editorComp.addEventListener("editor-loaded", () => {
      
      console.log("Babylonian: editor loaded ", this.livelyEditor())
      // Patch editor to load/save comments

      // Test file
      // this.livelyEditor().setURL(DEFAULT_FILE_URL);

      // Event listeners
      this.editor().on("change", () => {
        this.syncIndentations() ;
        this._changeTimer.start();
      });
      this.editor().on("beforeSelectionChange", this.onSelectionChanged.bind(this));
      this.livelyCodeMirror().registerExtraKeys({
        "Ctrl-1": () => this.addAnnotationAtSelection("probe"),
        "Ctrl-2": () => this.addAnnotationAtSelection("slider"),
        "Ctrl-3": () => this.addAnnotationAtSelection("example"),
        "Ctrl-4": () => this.addAnnotationAtSelection("instance"),
        "Ctrl-5": () => this.addAnnotationAtSelection("replacement"),
        "Tab": (cm) => { cm.replaceSelection("  ") },
      });

      // Inject styling into CodeMirror
      const livelyEditorStyle = <link rel="stylesheet" href={`${COMPONENT_URL}/lively-code-editor-inject-styles.css`}></link>;
      const codeMirrorStyle = <link rel="stylesheet" href={`${COMPONENT_URL}/codemirror-inject-styles.css`}></link>;
      this.livelyEditor().shadowRoot.appendChild(livelyEditorStyle);
      this.editorComp().shadowRoot.appendChild(codeMirrorStyle);
      
      var url = this.getAttribute("url")
      if (url) {
        this.setURL(url)
        this.loadFile()
      }
      
    });
  }
  
  
  detachedCallback() {
     BabylonianWorker.unregisterEditor(this);
  }

  async loadFileBabylonian(text) {
    
    console.log("Babylonian  loadFileBabylonian")
    // Lock evaluation until we are fully loaded
    this._evaluationLocked = true;
    
    // Remove all existing annotations
    this.removeAnnotations();
    this._annotations = defaultAnnotations();
    this._activeExamples = [];
    this._context = defaultContext();
    this._customInstances.length = 0;

    let comments = [];
    
    console.log("AST for code ", text)
    try {
      comments = astForCode(text).comments;
    } catch(e) {
      this.status("error", "Syntax error. Fix syntax and reload file.");
      this.livelyEditor().setText(text);
      return;
    }

    // Find annotations
    const getAnnotationKind = (string) => {
      for(let key of ["probe", "slider", "example", "instance", "replacement"]) {
        if(string == `${key}:`) {
          return key;
        }
      }
      return false;
    }
    const getAnnotationValue = (string) => {
      try {
        const value = JSON.parse(string);
        if(typeof(value) === "object") {
          return value;
        }
      } catch(e) {
        return false;
      }
      return false
    }

    // Collect annotations and remove comments
    const lines = text.split("\n");
    const annotationsQueue = [];
    const annotations = [];

    let removedChars = 0;

    let lineIndex = 0;
    for(let comment of comments) {
      const loc = LocationConverter.astToKey(comment.loc);
      if(loc[0] - 1 !== lineIndex) {
        lineIndex = loc[0] - 1;
        removedChars = 0;
      }

      const removeComment = () => {
        const pos = loc[1] - removedChars;
        lines[lineIndex] = stringRemove(lines[lineIndex], pos, loc[3] - removedChars);
        removedChars += loc[3] - loc[1];
        return pos;
      };

      let kind = getAnnotationKind(comment.value);
      let value = getAnnotationValue(comment.value);
      
      if(kind) {
        annotationsQueue.push([kind, removeComment()]);
      } else if(value) {
        
        let annotationMeta = annotationsQueue.shift();
        if(annotationMeta) {
          value.kind = annotationMeta[0];
          value.location = [lineIndex+1, annotationMeta[1], lineIndex+1, removeComment()];
          annotations.push(value);
        }
      }
    }
    text = lines.join("\n");

    // Add context
    if(comments.length) {
      const lastComment = comments[comments.length-1].value;
      const matches = lastComment.match(/^\s*Context: (.*)\s*/);
      if(matches) {
        text = text.replace(`/*${matches[0]}*/`, "");
        const data = JSON.parse(matches[1]);
        this._context = data.context ? data.context : defaultContext();
        if(data.customInstances) {
          data.customInstances.forEach(i => this._customInstances.push(new CustomInstance().load(i)));
        }
      }
    }

    // Add annotations
    this.livelyEditor().setText(text);
    await BabylonianWorker.evaluateEditor(this, false);
    
    for(let annotation of annotations) {
      let obj;
      switch(annotation.kind) {
        case "probe":
          this.addProbeAtPath(this.pathForKey(annotation.location));
          break;
        case "slider":
          this.addSliderAtPath(this.pathForKey(annotation.location));
          break;
        case "instance":
          obj = this.addInstanceAtPath(this.pathForKey(annotation.location));
          obj && obj.load(annotation);
          break;
        case "example":
          obj = this.addExampleAtPath(this.pathForKey(annotation.location), false);
          obj && obj.load(annotation);
          break;
        case "replacement":
          obj = this.addReplacementAtPath(this.pathForKey(annotation.location));
          obj && obj.load(annotation);
      }
    }

    // Evaluate
    await this.evaluate(true);
    setTimeout(() => {
      this._evaluationLocked = false;
    }, 2000);
    
    return text
  }

  async saveFileBabylonian(textFromEditor) {
    // Serialize annotations
    const serializedAnnotations = [];
    for(let key in this._annotations) {
      for(let annotation of this._annotations[key]) {
        serializedAnnotations.push(annotation.serializeForSave());
      }
    }
    serializedAnnotations.sort((a,b) => compareKeyLocations(a.location, b.location));
    const makeTags = (annotation) => {
      const beginTag = `/*${annotation.kind}:*/`;
      const endObj = Object.assign({}, annotation);
      delete endObj.kind;
      delete endObj.location;
      const endTag = `/*${JSON.stringify(endObj)}*/`;
      return [beginTag, endTag];
    };

    // Write annotations
    let currentAnnotation = serializedAnnotations.shift();
    const lines = this.livelyEditor().currentEditor().getValue().split("\n").map((line, i) => {
      let insertedRanges = [];
      const insert = (string, index) => {
        const originalIndex = index;
        const originalRange = [originalIndex, string.length];
        // Apply existing ranges
        for(let range of insertedRanges) {
          if(range[0] <= originalIndex) {
            index += range[1];
          }
        }
        // Insert
        line = stringInsert(line, string, index);
        // Store range
        insertedRanges.push(originalRange);
      };

      while(currentAnnotation && currentAnnotation.location[0]-1 === i) {
        const tags = makeTags(currentAnnotation);
        insert(tags[0], currentAnnotation.location[1]);
        insert(tags[1], currentAnnotation.location[3]);
        currentAnnotation = serializedAnnotations.shift();
      }
      return line;
    });

    for(let lineIndex in lines) {
      let charsAddedOnLine = 0;
    }

    // Write file
    let text = lines.join("\n");
    const appendString = JSON.stringify({
      context: this._context,
      customInstances: this._customInstances.map(i => i.serializeForSave())
    });
    text = `${text}/* Context: ${appendString} */`;
    // #BUG... Babylonian editor seems to violate the assumtion that the editor holds all the text...! #continue
    this.value = text
    return text
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
        this.addProbeAtPath(path);
        break;
      case "slider":
        this.addSliderAtPath(path);
        break;
      case "example":
        this.addExampleAtPath(path, false);
        break;
      case "instance":
        this.addInstanceAtPath(path);
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
    if(!canBeProbe(path)) {
      return;
    }

    // Add the probe
    const probe = new Probe(
      this.editor(),
      LocationConverter.astToMarker(path.node.loc),
      this.removeAnnotation.bind(this)
    );
    this._annotations.probes.push(probe);

    this.enforceAllSliders();
    this.evaluate();
    return probe;
  }

  addSliderAtPath(path) {
    // Make sure we can probe this path
    if(!canBeSlider(path)) {
      return;
    }

    // Add the slider
    const slider = new Slider(
      this.editor(),
      LocationConverter.astToMarker(path.node.loc),
      this.onSliderChanged.bind(this),
      this.removeAnnotation.bind(this)
    );
    this._annotations.sliders.push(slider);

    this.evaluate();
    return slider;
  }

  addExampleAtPath(path, isOn = true) {
    // Make sure we can probe this path
    if(!canBeExample(path)) {
      return;
    }

    // Add the example
    const example = new Example(
      this.editor(),
      LocationConverter.astToMarker(path.node.loc),
      this.onEvaluationNeeded.bind(this),
      this.removeAnnotation.bind(this),
      this.onExampleStateChanged.bind(this),
      isOn,
      this._annotations.instances,
      this._customInstances
    );
    this._annotations.examples.push(example);

    if(isOn) {
      this._activeExamples.push(example);
    }

    this.evaluate();
    return example;
  }

  addReplacementAtPath(path) {
    // Make sure we can replace this path
    if(!canBeReplacement(path)) {
      return;
    }

    // Add the replacement
    const replacement = new Replacement(
      this.editor(),
      LocationConverter.astToMarker(path.node.loc),
      this.onEvaluationNeeded.bind(this),
      this.removeAnnotation.bind(this)
    );
    this._annotations.replacements.push(replacement);

    this.evaluate();
    return replacement;
  }

  addInstanceAtPath(path) {
    // Make sure we can add an instance to this path
    if(!canBeInstance(path)) {
      return;
    }

    // Add the instance
    const instance = new Instance(
      this.editor(),
      LocationConverter.astToMarker(path.node.loc),
      this.onEvaluationNeeded.bind(this),
      this.removeAnnotation.bind(this),
      this._annotations.instances,
      this._customInstances
    );
    this._annotations.instances.push(instance);

    this.evaluate();
    return instance;
  }


  /**
   * Updating annotations
   */

  syncIndentations() {
    if(!this.hasWorkingAst()) {
      return;
    }

    for(let key in this._annotations) {
      for(let annotation of this._annotations[key]) {
        annotation.syncIndentation();
      }
    }
  }

  /*example:*/updateAnnotations/*{"id":"8de8_4761_b269","name":{"mode":"input","value":""},"color":"hsl(80, 30%, 70%)","values":{},"instanceId":{"mode":"connect","value":"8de8_4761_b269_this"},"prescript":"","postscript":""}*/() {
    // Update sliders
    for(let /*probe:*/slider/*{}*/ of this._annotations.sliders) {
      const node = bodyForPath(this.pathForAnnotation(slider)).node;
      if(BabylonianWorker.tracker.iterations.has(node._id)) {
        /*probe:*/slider.maxValues/*{}*/ = BabylonianWorker.tracker.iterations.get(node._id);
      } else {
        slider.empty();
      }
    }

    // Update probes
    for(let probe of this._annotations.probes) {
      const node = this.nodeForAnnotation(probe);
      if(BabylonianWorker.tracker.ids.has(node._id)) {
        probe.iterationParentId = BabylonianWorker.tracker.idIterationParents.get(node._id);
        probe.values = BabylonianWorker.tracker.ids.get(node._id);
      } else {
        probe.empty();
      }
    }

    // Update instances
    this.updateInstances();

    // Update examples
    this.updateExamples();
  }

  updateExamples() {
    for(let example of this._annotations.examples) {
      try {
        const path = this.pathForAnnotation(example);
        if (!path) {
          console.log("BabylonianProgrammingEditor could not updateExamples ", example)
          return 
        }
        
        if(BabylonianWorker.tracker.errors.has(example.id)) {
          example.error = BabylonianWorker.tracker.errors.get(example.id);
        } else {
          example.error = null;
        }
        example.keys = parameterNamesForFunctionIdentifier(path);
      } catch(e) {
        debugger
        console.error("updateExamples Error" + e, example, this)
      }
    }
  }

  updateInstances() {
    for(let instance of this._annotations.instances) {
      const path = this.pathForAnnotation(instance);
      instance.keys = constructorParameterNamesForClassIdentifier(path);
    }
  }

  cleanupAnnotations() {
    this.removeAnnotations(annotation => !annotation.location);
  }

  updateDeadMarkers() {
    // Remove old dead markers
    this._deadMarkers.map(m => m.clear());

    // Don't show dead markers if we have no activated example (except the default example)
    if(BabylonianWorker.activeExamples.size <= 1) {
      return;
    }

    // Add new markers
    const that = this;
    traverse(this._ast, {
      BlockStatement(path) {
        if(!BabylonianWorker.tracker.executedBlocks.has(path.node._id)) {
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

  removeAnnotation(annotation, fromContainer = null) {
    if(fromContainer) {
      fromContainer.splice(fromContainer.indexOf(annotation), 1);
    } else {
      for(let key in this._annotations) {
        if(this._annotations[key].includes(annotation)) {
          this._annotations[key].splice(this._annotations[key].indexOf(annotation), 1);
        }
      }
    }

    // If the annotation was an active example, we have to deactivate it
    const activeIndex = this._activeExamples.indexOf(annotation);
    if(activeIndex !== -1) {
      this._activeExamples.splice(activeIndex, 1);
    }
    annotation.clear();

    // If the annotation was an instance, we have to update the examples that might have used it
    if(annotation._widget instanceof InstanceWidget) {
      this.updateExamples();
    }

    this.evaluate();
  }

  removeAnnotations(callback = null) {
    for(let annotationType in this._annotations) {
      for(let annotation of this._annotations[annotationType]) {
        if(!callback || callback(annotation)) {
          this.removeAnnotation(annotation, this._annotations[annotationType]);
        }
      }
    }
  }


  /**
   * Evaluating code
   */

  async evaluate(ignoreLock = false) {
    if(this._evaluationLocked && !ignoreLock) {
      return;
    }
    
    // Performance
    Performance.step("prep");
    
    // Make sure we have no zombie annotations
    this.cleanupAnnotations()

    this.status("evaluating");
    
    await BabylonianWorker.evaluateEditor(this);
  }


  /**
   * Event handlers
   */

  onTrackerChanged() {
    // console.log("BAB onTrackerChanged", this)
    if(this.hadParseError) {
      this.status("error", "Syntax Error");
    } else if(this.hadEvalError) {
      this.status("error", this.lastEvalError);
      this.updateInstances();
      this.updateExamples();
    } else {
      this.updateAnnotations();
      this.updateDeadMarkers();
      if(BabylonianWorker.tracker.errors.size) {
        this.status("warning", "At least one example caused an Error");
      } else {
        this.status();
      }
    }
    
    // Performance
    Performance.stop();
  }


  onSelectionChanged(instance, data) {
    // This needs an AST
    if(!this.hasWorkingAst()) {
      this._selectedPath = null;
      return;
    }

    // Get selected path
    this._selectedLocation = LocationConverter.selectionToKey(data.ranges[0]);

    // Check if we selected a node
    if(this._selectedLocation in this._ast._locationMap) {
      const selectedPath = this._ast._locationMap[this._selectedLocation];
      if(selectedPath && !selectedPath.isProgram()) {
        this._selectedPath = selectedPath;
      }
    } else {
      this._selectedPath = null;
    }

    this.updateSelectedPathActions();
  }

  async onEditPrePostScript() {
    let comp = await lively.openComponentInWindow("pre-post-script-editor");
    comp.setup("Module", [], this._context.prescript, this._context.postscript, (value) => {
      this._context.prescript = value.prescript;
      this._context.postscript = value.postscript;
      this.onEvaluationNeeded();
    }, "Module");
  }

  async onEditInstances() {
    let comp = await lively.openComponentInWindow("custom-instance-template-editor");
    comp.setup(this._customInstances, this.onEvaluationNeeded.bind(this));
  }

  onSliderChanged(slider, exampleId, value) { 
    const includedIds = [];
    const visitor = {
      Identifier(path) {
        includedIds.push(path.node._id);
      },
      ReturnStatement(path) {
        includedIds.push(path.node._id);
      },
      MemberExpression(path) {
        includedIds.push(path.node._id);
      },
      Function(path) {
        path.skip();
      },
      Loop(path) {
        path.skip();
      }
    };
    
    // Find in body
    const loopPath = bodyForPath(this.pathForAnnotation(slider)).parentPath;
    traverse(loopPath.node, visitor, loopPath.scope, loopPath);
    
    // Get all probes directly in the body
    this._annotations.probes.forEach((probe) => {
      if(includedIds.includes(this.nodeForAnnotation(probe)._id)) {
        probe.setActiveRunForExampleId(exampleId, value);
      }
    });
  }

  onExampleStateChanged(example, newIsOn) {
    if(newIsOn) {
      this._activeExamples.push(example);
    } else {
      this._activeExamples.splice(this._activeExamples.indexOf(example), 1);
    }
    this.evaluate();
  }

  onEvaluationNeeded() {
    this.evaluate();
  }

  updateSelectedPathActions() {
    this._selectedPathActions = [];

    if(this._selectedPath) {
      const checkFunctions = {
        "probe": canBeProbe,
        "slider": canBeSlider,
        "replacement": canBeReplacement,
        "example": canBeExample,
        "instance": canBeInstance,
      }

      Object.keys(checkFunctions).forEach(key => {
        if(checkFunctions[key](this._selectedPath)) {
          this._selectedPathActions.push(key);
        }
      });
    }

    this.updateButtons();
  }

  updateButtons() {
    this._buttons = this.get("#buttons");
    this._buttons.innerHTML = "";

    // Always visible
    this._buttons.appendChild(TextButton("", "exchange", this.onEditPrePostScript.bind(this)));
    this._buttons.appendChild(TextButton("", "object-group", this.onEditInstances.bind(this)));
    //this._buttons.appendChild(TextButton("", "", this.onBenchmark.bind(this)));
    
    if(!this._selectedPath) {
      return;
    }

    // Remove annotations
    for(let annotation of this._annotations.probes.concat(this._annotations.sliders)) {
      if(keyLocationsAreEqual(LocationConverter.markerToKey(annotation.location), this._selectedLocation)) {
        this._buttons.appendChild(
          TextButton(
            this.normalizeButtonName(annotation.__proto__.constructor.name), "minus", () => {
              this.removeAnnotation(annotation);
            }
          )
        );
      }
    }

    // Add annotations
    for(let key of this._selectedPathActions) {
      this._buttons.appendChild(
        TextButton(
          this.normalizeButtonName(key), "plus", this.addAnnotationAtSelection.bind(this, key)
        )
      );
    }
  }
  
  onBenchmark() {
    let counter = 0;
    let numTests = 100;
    const doBenchmark = () => {
      console.log(`Benchmark ${counter} of ${numTests}`);
      
      // Benchmark actions
      this.evaluate();
      
      // Repeat
      counter++;
      if(counter < numTests) {
        setTimeout(doBenchmark, 5000);
      }
    }
    
    Performance.reset();
    doBenchmark();
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
    if(annotation.locationAsKey && this.hasWorkingAst()) {
      return this.pathForKey(annotation.locationAsKey);
    }
    return null;
  }

  status(status = null, message = null) {
    this._statusBar.setStatus(status, message);
  }

  pathForKey(key) {
    return this._ast._locationMap[key];
  }



  editorComp() {
    return this.livelyEditor().get("lively-code-mirror");
  }

  editor() {
    return this.editorComp().editor
  }

  /*example:*//*example:*/normalizeButtonName/*{"id":"8943_87e4_9899","name":{"mode":"input","value":"Invalid"},"color":"hsl(350, 30%, 70%)","values":{"name":{"mode":"input","value":"\"Hello\""}},"instanceId":{"mode":"input","value":""},"prescript":"","postscript":""}*//*{"id":"49e7_b2c7_0340","name":{"mode":"input","value":"Instance"},"color":"hsl(180, 30%, 70%)","values":{"name":{"mode":"input","value":"\"Instance\""}},"instanceId":{"mode":"input","value":""},"prescript":"","postscript":""}*/(name) {
    if(name[name.length - 1] === "s") {
      name = name.slice(0, -1);
    }
    name = name.charAt(0).toUpperCase() + name.slice(1);

    switch(name.toLowerCase()) {
      case "instance":
        name = "Instance template";
    }

    /*probe:*/return/*{}*/ name;
  }

  /**
   * Accessors
   */

  get activeExamples() { return this._activeExamples; }
  get annotations() { return this._annotations; }
  set ast(ast) { this._ast = ast; }
  get context() { return this._context; }
  get customInstances() { return this._customInstances; }
  get url() { return this.livelyEditor().getURL().toString(); }
  
  get value() { return this.editor().getValue() }
  set value(value) { return this.editor().value =  value }
  

  
  /* EDITOR Levels / FACADEs */
  
  babylonianProgrammingEditor() {
    return this
  }
  
  livelyEditor() {
    return this.get("#source")
  }

  livelyCodeMirror() {
    return this.editorComp()
  }
  
  livelyCodeMirrorEditor() {
    return this.editor() // the cm object
  }
  
  
  /*
   * Editor API Facade
   */
  hideToolbar() {
     return this.livelyEditor().hideToolbar()
  }
  
  setScrollInfo(info) {
    return this.livelyEditor().setScrollInfo(info)
  }
  
  getScrollInfo() {
    return this.livelyEditor().getScrollInfo()
  }
  
  currentEditor() {
    return this.editor()
  }

  getCursor() {
    return this.livelyEditor().getCursor()
  }
  
  setCursor(cur) {
     return this.livelyEditor().setCursor(cur)
  }

  getURL(url) {
    return this.livelyEditor().getURL()  // || this.getAttribute("url")
  }
  
  setURL(url) {
    this.setAttribute("url", url)
    return this.livelyEditor().setURL(url)
  }

  async setText(text, preserveView) {
    await this.loadFileBabylonian(text)
  }

  getText() {
    return this.livelyEditor().getText()
  }
  
  async saveFile() {
    return this.livelyEditor().saveFile()
    
  }
  
  loadFile() {
    return this.livelyEditor().loadFile()
  }
  
  
  async awaitEditor() {
    while(!editor) {
      var editor = this.currentEditor()
      if (!editor) {
        await lively.sleep(10) // busy wait
      }
    }
    return editor
  }
  
  livelyExample() {
    this.setURL(DEFAULT_FILE_URL)
    this.loadFile()
  }
  
  
  
  
}
/* Context: {"context":{"prescript":"","postscript":""},"customInstances":[]} */