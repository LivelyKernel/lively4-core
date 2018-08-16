import Morph from 'src/components/widgets/lively-morph.js';
import { uuid, without, getTempKeyFor, getObjectFor, flatMap, fileEnding } from 'utils';
import VivideLayer from 'src/client/vivide/vividelayer.js';
import VivideObject from 'src/client/vivide/vivideobject.js';
import Annotations from 'src/client/reactive/active-expressions/active-expressions/src/annotations.js';
import ScriptStep from 'src/client/vivide/vividescriptstep.js';
import Script from 'src/client/vivide/vividescript.js';

async function initialScriptsFromTemplate() {
  const transform = await ScriptStep.newFromTemplate('transform');
  const extract = await ScriptStep.newFromTemplate('extract');
  const descent = await ScriptStep.newFromTemplate('descent');
  
  transform.insertAfter(extract);
  extract.insertAfter(descent);
  descent.lastScript = true;
  
  return transform;
}

export default class VivideView extends Morph {
  static findViewWithId(id) {
    return document.body.querySelector(`vivide-view[vivide-view-id=${id}]`);
  }
  
  static getIdForView(view) {
    return view.id;
  }
  
  static get idAttribute() { return 'vivide-view-id'; }
  
  static get outportAttribute() { return 'outport-target'; }
  
  static get scriptAttribute() { return 'vivide-script'; }
  
  static get widgetId() { return 'widget'; }
  
  static get widgetSelector() { return '#' + this.widgetId; }
  
  static modelToData(model) {
    return model.map(m => m.object);
  }
  
  static dataToModel(data) {
    return data.map(d => ({ object: d, properties: new Annotations(), children: []}));
  }

  get widget() { return this.get(VivideView.widgetSelector); }
  
  get input() { return this._input || (this._input = []); }
  
  set input(val) { return this._input = val; }
  
  get id() {
    let id = this.getAttribute(VivideView.idAttribute);
    if(id) { return id; }
    
    // ensure uuid begins with a letter to match the requirements for a css selector
    let newId = 'vivide-view-' + uuid();
    this.setAttribute(VivideView.idAttribute, newId);
    return newId;
  }
  
  get outportTargets() {
    let ids = this.getJSONAttribute(VivideView.outportAttribute);
    if(ids) {
      return flatMap.call(ids, id => {
        let view = VivideView.findViewWithId(id);
        if(view === null) {
          lively.error('could not find view: ' + id);
          return [];
        }
        return [view];
      });
    }
    
    return this.outportTargets = [];
  }
  
  set outportTargets(targets) {
    return this.setJSONAttribute(
      VivideView.outportAttribute,
      targets.map(VivideView.getIdForView)
    );
  }
  
  addOutportTarget(target) {
    return this.outportTargets = this.outportTargets.concat(target);
  }
  
  removeOutportTarget(target) {
    return this.outportTargets = without.call(this.outportTargets, target);
  }
  
  get inportSources() {
    return Array.from(document.body.querySelectorAll(`vivide-view[${VivideView.outportAttribute}*=${this.id}]`));
  }
  
  get targetHull() {
    let hull = new Set();
    
    function addToHull(view) {
      if(view && !hull.has(view)) {
        hull.add(view);
        view.outportTargets.forEach(addToHull);
      }
    }
    addToHull(this);
    
    return Array.from(hull);
  }
  
  connectTo(target) {
    // #TODO: cycle detection, here?
    this.addOutportTarget(target);
  }
  removeConnectionTo(target) {
    this.removeOutportTarget(target);
  }
  
  notifyOutportTargets() {
    this.outportTargets
      .forEach(target => {
        target.newDataFromUpstream(VivideView.modelToData(this.modelToDisplay));
      });
  }
  
  getSelectedData() {
    let widget = this.widget;
    if(widget) {
      return widget.getSelectedData();
    }
    return undefined;
  }

  selectionChanged() {
    this.updateOutportTargets();
  }
  
  updateOutportTargets() {
    let selection = this.getSelectedData();
    if(selection) {
      this.outportTargets.forEach(target => target.newDataFromUpstream(selection.map(item => item.data)));
    }
  }
  
  addDragInfoTo(evt) {
    const dt = evt.dataTransfer;
    // #TODO: An improved fix would be to change what is returned by the widget selection
    let selection = this.getSelectedData();
    if(selection) {
      dt.setData("javascript/object", getTempKeyFor(selection.map(item => item.data)));
    } else {
      lively.error('could not add drag data');
    }

    dt.setData("vivide", "");
    dt.setData("vivide/source-view", getTempKeyFor(this));
  }

  async initialize() {
    this.windowTitle = "VivideView";
    this.addEventListener('extent-changed', evt => this.onExtentChanged(evt));
    
    this.addEventListener('dragenter', evt => this.dragenter(evt), false);
    this.addEventListener('dragover', evt => this.dragover(evt), false);
    this.addEventListener('dragleave', evt => this.dragleave(evt), false);
    this.addEventListener('drop', evt => this.drop(evt), false);

    this.input = this.input || [];
  }
  
  onExtentChanged() {
    this.childNodes.forEach(childNode => {
      if(childNode.dispatchEvent) {
        childNode.dispatchEvent(new CustomEvent("extent-changed"));
      }
    })
  }
  
  dragenter(evt) {}
  dragover(evt) {
    evt.preventDefault();

    this._resetDropOverEffects();
    this.classList.add('over');
    
    const dt = evt.dataTransfer;
    
    let hasSourceView = dt.types.includes("vivide") && dt.types.includes("vivide/source-view");
    if(hasSourceView) {
      // unfortunately, we cannot check for a circular dependency here,
      // because we cannot get data from the dataTransfer outside dragStart and drop
      // see: https://stackoverflow.com/a/31922258/1152174
      this.classList.add('accept-drop');
      dt.dropEffect = "link";
      
      return;
    }
    
    let hasData = dt.types.includes("javascript/object");
    if(hasData) {
      this.classList.add('accept-drop');
      dt.dropEffect = "copy";
      
      return;
    }
    
    this.classList.add('reject-drop');
  }
  dragleave(evt) {
    this._resetDropOverEffects();
  }
  _resetDropOverEffects() {
    this.classList.remove('over');
    this.classList.remove('reject-drop');
    this.classList.remove('accept-drop');
  }
  drop(evt) {
    this._resetDropOverEffects();

    let shouldPreventPropagation = false;
    
    const dt = evt.dataTransfer;
    if (dt.types.includes("javascript/object")) {
      lively.success('drop data');

      const data = getObjectFor(dt.getData("javascript/object"));
      this.newDataFromUpstream(data);
      
      shouldPreventPropagation = true;
    }
    
    if (dt.types.includes("vivide") && dt.types.includes("vivide/source-view")) {
      lively.success('drop vivide');
      
      const sourceView = getObjectFor(dt.getData("vivide/source-view"));

      if(this.targetHull.includes(sourceView)) {
        lively.warn('cannot connect views', 'preventing cyclic dependencies')
      } else {
        sourceView.connectTo(this);
      }

      shouldPreventPropagation = true;
    }

    if(shouldPreventPropagation) {
      evt.stopPropagation();
    }
  }
  
  get myCurrentScript() { return this._myCurrentScript; }
  set myCurrentScript(script) { return this._myCurrentScript = script; }

  async initDefaultScript() {
    this.setFirstStep(await initialScriptsFromTemplate());
  }
  setFirstStep(firstStep) {
    lively.warn('set script')
    if(!firstStep) {
      lively.error('undefined first step');
      return;
    }
    if(!firstStep.isScriptStep) {
      lively.error('first step not a script step');
      return;
    }

    this.myCurrentScript = new Script(this);
    this.myCurrentScript.setInitialStep(firstStep);
    
    this.setJSONAttribute(VivideView.scriptAttribute, this.myCurrentScript.toJSON());
  }
  
  getFirstStep() {
    // script.deserializeFromJSON();
    return this.myCurrentScript.getInitialStep();
  }
  
  async newDataFromUpstream(data) {
    this.input = data;
    
    if (this.getFirstStep()) {
      await this.calculateOutputModel();
    } else {
      // #TODO: is this obsolete?
      this.modelToDisplay = VivideView.dataToModel(this.input);
    }

    await this.updateWidget();
    this.notifyOutportTargets();
  }
  
  getInputData() {
    return this.input;
  }
  
  
  get viewConfig() {
    return this._viewConfig = this._viewConfig || new Annotations();
  }
  resetViewConfig() {
    this._viewConfig = undefined;
  }
  
  async calculateOutputModel() {
    this.resetViewConfig();
    let script = this.getFirstStep();
    
    this.modelToDisplay = await this.computeModel(this.input.slice(0), script);
  }
  
  async scriptGotUpdated() {
    // #TODO: save script to web-component
    // #TODO: later support multiple profiles
    lively.warn('script updated -> should save');
    await this.calculateOutputModel();
    await this.updateWidget();
    // Update outport views
    this.updateOutportTargets();
  }
  
  // #TODO: extract to a separate ScriptProcessor, or Script itself
  async computeModel(data, script) {
    let vivideLayer = new VivideLayer(data);
    const _modules = {
      transform: [],
      extract: [],
      descent: []
    };
    
    await this.applyScript(script, vivideLayer, _modules);
    while (script.nextStep) {
      script = script.nextStep;
      await this.applyScript(script, vivideLayer, _modules);
      
      // #TODO: this break condition is errornous, e.g. when the last step is not a descent step, but we still have a loop, it will break at that last step nonetheless
      if (script.type == 'descent' || script.lastScript) break;
    }
    
    await this.processData(vivideLayer, _modules);
    
    return vivideLayer;
  }
  async applyScript(step, vivideLayer, _modules) {
    const [fun, config] = await step.getExecutable();
    
    if (step.type == 'descent') {
      vivideLayer.childScript = step.nextStep;
    }
    _modules[step.type].push(fun);
    
    if(config) {
      // #TODO, #ERROR: this adds the config too late
      this.viewConfig.add(config);
    }
  }
  async processData(vivideLayer, _modules) {
    await this.transform(vivideLayer, _modules);
    await this.extract(vivideLayer, _modules);
    await this.descent(vivideLayer, _modules);
  }
  
  async transform(vivideLayer, _modules) {
    let input = vivideLayer._rawData.slice(0);
    let output = [];
    
    for (let module of _modules.transform) {
      await module(input, output);
      input = output.slice(0);
      output = [];
    }

    vivideLayer._rawData = input;
    vivideLayer.makeObjectsFromRawData();
  }
  
  async extract(vivideLayer, _modules) {
    for (let module of _modules.extract) {
      for (let object of vivideLayer._objects) {
        object.properties.add(await module(object.data));
      }
    }
  }
  
  async descent(vivideLayer, _modules) {
    for (let module of _modules.descent) {
      for (let object of vivideLayer._objects) {
        const childData = await module(object.data);
        
        if (!childData) continue;
        
        const childLayer = new VivideLayer(childData);
        childLayer.script = vivideLayer.childScript;
        object.childLayer = childLayer;
      }
    }
  }
  
  /**
   * Smart widget choosing
   */
  getPreferredWidgetType(model) {
    if (this.viewConfig.has('widget')) { 
      return this.viewConfig.get('widget');
    }
    
    // #TODO: this is too dependent on internal structure of the model/VivideObject
    // PROPOSAL: Models should not know about views, therefore they cannot return
    //   a suggested view, but they could return a data type suggestion like:
    //     model.dataType == "data-points" || "list" || "text"
    //   Additionally, this data type could be set manually or via an "intelligent"
    //   algorithm.
    if (model.objects && model.objects.length > 0) {
      // #Question: this model has an objects array, what is the data structure of this model?
      let m = model.objects[0];
      if(m.properties.has('dataPoints') &&
         typeof m.properties.get('dataPoints')[0] === 'number'
      ) {
        return 'boxplot';
      }
    }
    return 'tree';
  }
  findAppropriateWidget(model) {
    const type = this.getPreferredWidgetType(model);
    
    // full type specified
    if(type.includes('-')) {
      return type;
    }
    
    // shorthand notation used
    return `vivide-${type}-widget`;
  }

  async updateWidget() {
    this.innerHTML = '';
    let widget = await lively.create(this.findAppropriateWidget(this.modelToDisplay));
    widget.setAttribute('id', VivideView.widgetId);
    this.appendChild(widget);
    widget.expandChild = this.computeModel.bind(this);
    await widget.display(this.modelToDisplay, this.viewConfig);
  }
  
  // #TODO: move to VivideScript
  async insertStepAfter(stepType, prevStep = null) {
    let newStep = await ScriptStep.newFromTemplate(stepType);
    newStep.updateCallback = this.scriptGotUpdated.bind(this);
    
    if (prevStep) {
      prevStep.insertAfter(newStep);
    } else {
      let firstStep = this.getFirstStep();
      firstStep.insertAsLastStep(newStep);
    }
    
    return newStep;
  }
  
  async createScriptEditor() {
    const viewWindow = lively.findWindow(this);
    const reference = viewWindow && viewWindow.tagName === "LIVELY-WINDOW" ?
        viewWindow : this;
    const pos = lively.getGlobalBounds(reference).topRight();

    const scriptEditor = await lively.openComponentInWindow('vivide-script-editor', pos);

    scriptEditor.setView(this);
    // #TODO: only do setView with this as argument, the following line should not be required
    scriptEditor.setScripts(this.getFirstStep());

    return scriptEditor;
  }
  
  async livelyExample() {
    let exampleData = [
      {name: "object", subclasses:[{name: "morph"},]},
      {name: "list", subclasses:[{name: "linkedlist", subclasses:[{name: "stack"}]}, {name: "arraylist"}]},
      {name: "usercontrol", subclasses:[{name: "textbox"}, {name: "button"}, {name: "label"}]},
    ];
    
    await this.initDefaultScript();
    await this.createScriptEditor();
    await this.newDataFromUpstream(exampleData);
  }
  
  livelyMigrate(other) {
    this.setFirstStep(other.getFirstStep());
    this.newDataFromUpstream(other.input);
  }
  
  livelyHalo() {
    return {
      configureHalo(halo) {
        halo.get('#default-items').style.display = 'none';
        halo.get('#vivide-items').style.display = 'flex';

        // dynamically create outport connection visualizations
        const outportContainer = halo.get('#vivide-outport-connection-items');
        this.outportTargets.forEach(target => {
          const item = document.createElement('lively-halo-vivide-outport-connection-item')
          item.classList.add('halo');
          item.setTarget(target);
          outportContainer.appendChild(item);
        });
        
        const inportContainer = halo.get('#vivide-inport-connection-items');
        this.inportSources.forEach(source => {
          const item = document.createElement('lively-halo-vivide-inport-connection-item')
          item.classList.add('halo');
          item.setSource(source);
          inportContainer.appendChild(item);
        });
      }
    };
  }
}
