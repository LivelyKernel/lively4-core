import Morph from 'src/components/widgets/lively-morph.js';
import { uuid, without, getTempKeyFor, getObjectFor, flatMap, fileEnding } from 'utils';
import boundEval from "src/client/bound-eval.js";
import { createScriptEditorFor, initialScriptsFromTemplate, newScriptFromTemplate } from 'src/client/vivide/vivide.js';
import VivideLayer from 'src/client/vivide/vividelayer.js';
import VivideObject from 'src/client/vivide/vivideobject.js';

export default class VivideView extends Morph {
  static findViewWithId(id) {
    return document.body.querySelector(`vivide-view[vivide-view-id=${id}]`);
  }
  
  static getIdForView(view) {
    return view.id;
  }
  
  static get idAttribute() { return 'vivide-view-id'; }
  
  static get outportAttribute() { return 'outport-target'; }
  
  static get scriptAttribute() { return 'vivide-script-url'; }
  
  static get widgetId() { return 'widget'; }
  
  static get widgetSelector() { return '#' + this.widgetId; }
  
  static modelToData(model) {
    return model.map(m => m.object);
  }
  
  static dataToModel(data) {
    return data.map(d => ({ object: d, properties: [], children: []}));
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
    let data = this.getSelectedData();
    if(data) {
      this.outportTargets.forEach(target => target.newDataFromUpstream(data));
    }
  }
  
  addDragInfoTo(evt) {
    const dt = evt.dataTransfer;

    let data = this.getSelectedData();
    if(data) {
      dt.setData("javascript/object", getTempKeyFor(data));
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
  
  setFirstScript(firstScript) {
    this.firstScript = firstScript;
    this.firstScript.updateCallback = this.scriptGotUpdated.bind(this);
    let script = this.firstScript;
    
    while (script.nextScript != null) {
      script = script.nextScript;
      script.updateCallback = this.scriptGotUpdated.bind(this);
      
      if (script.lastScript) break;
     }
    //this.setJSONAttribute(VivideView.scriptAttribute, this.scripts);

    return this.firstScript;
  }
  
  getFirstScript() {
    //this.getJSONAttribute(VivideView.scriptAttribute);
    
    return this.firstScript;
  }
  
  async newDataFromUpstream(data) {
    this.input = data;
    
    if (this.getFirstScript()) {
      await this.calculateOutputModel();
    } else {
      this.modelToDisplay = VivideView.dataToModel(this.input);
    }

    await this.updateWidget();
    this.notifyOutportTargets();
  }
  
  getInputData() {
    return this.input;
  }
  getModelToDisplay() {
    return this.modelToDisplay;
  }
  
  async calculateOutputModel() {
    this.viewConfig = [];
    let script = this.getFirstScript();
    
    this.modelToDisplay = await this.computeModel(this.input.slice(0), script);
  }
  
  async evalScript(script) {
    let module = await boundEval(script.source);
    return module;
  }
  
  async scriptGotUpdated() {
    await this.calculateOutputModel();
    await this.updateWidget();
  }
  
  async computeModel(data, script) {
    let vivideLayer = new VivideLayer(data);
    
    await this.applyScript(script, vivideLayer);
    while (script.nextScript) {
      script = script.nextScript;
      await this.applyScript(script, vivideLayer);
      
      if (script.type == 'descent' || script.lastScript) break;
    }
    await vivideLayer.processData();
    
    return vivideLayer;
  }
  
  async applyScript(script, vivideLayer) {
    let module = await this.evalScript(script);
    if (script.type == 'transform') {
      vivideLayer.addModule(module, 'transform');
    } else if (script.type == 'extract') {
      vivideLayer.addModule(module, 'extract');
    } else if (script.type == 'descent') {
      vivideLayer.childScript = script.nextScript;
      vivideLayer.addModule(module, 'descent');
    }
    
    this.viewConfig.push(module.value.__vivideStepConfig__);
  }

  findAppropriateWidget(model) {    
    if (this.viewConfig) {
      for (let config of this.viewConfig) {
        if (!config.widget) continue;
        
        return config.widget;
      }
    }
    
    if (model.length > 0) {
      let m = model[0];
      if(m.properties.find(prop => prop.dataPoints instanceof Array &&
                           typeof prop.dataPoints[0] === 'number')
      ) {
        return 'vivide-boxplot-widget';
      }
    }
    return 'vivide-tree-widget';
  }

  async updateWidget() {
    this.innerHTML = '';
    let widget = await lively.create(this.findAppropriateWidget(this.modelToDisplay));
    widget.setAttribute('id', VivideView.widgetId);
    this.appendChild(widget);
    widget.expandChild = this.computeModel.bind(this);
    await widget.display(this.modelToDisplay, this.viewConfig || []);
  }
  
  async insertScript(scriptType, prevScript = null) {
    let newScript = await newScriptFromTemplate(scriptType);
    let script = this.getFirstScript();
    
    if (prevScript) {
      script = prevScript;
      
      if (prevScript.lastScript) {
        prevScript.lastScript = false;
        newScript.lastScript = true;
      }
    } else {
      while (!script.lastScript) {
        script = script.nextScript;
      }
      
      script.lastScript = false;
      newScript.lastScript = true;
    }
    
    newScript.updateCallback = this.scriptGotUpdated.bind(this);
    newScript.nextScript = script.nextScript;
    script.nextScript = newScript;
    
    return newScript;
  }
  
  livelyExample() {
    let exampleData = [
      {name: "object", subclasses:[{name: "morph"},]},
      {name: "list", subclasses:[{name: "linkedlist", subclasses:[{name: "stack"}]}, {name: "arraylist"}]},
      {name: "usercontrol", subclasses:[{name: "textbox"}, {name: "button"}, {name: "label"}]},
    ];
    
    let initialScriptPromise = initialScriptsFromTemplate().then(script => this.setFirstScript(script));
    initialScriptPromise.then(() => {
      createScriptEditorFor(this).then(() => this.newDataFromUpstream(exampleData))
    });
  }
  
  livelyMigrate(other) {
    this.newDataFromUpstream(other.input);
  }
  
  livelyHalo() {
    return {
      configureHalo(halo) {
        halo.get('#default-items').style.display = 'none';
        halo.get('#vivide-items').style.display = 'flex';

        // dynamically create outport connection visualizations
        let outportContainer = halo.get('#vivide-outport-connection-items');
        this.outportTargets.forEach(target => {
          let item = document.createElement('lively-halo-vivide-outport-connection-item')
          item.classList.add('halo');
          item.setTarget(target);
          outportContainer.appendChild(item);
        });
        
        let inportContainer = halo.get('#vivide-inport-connection-items');
        this.inportSources.forEach(source => {
          let item = document.createElement('lively-halo-vivide-inport-connection-item')
          item.classList.add('halo');
          item.setSource(source);
          inportContainer.appendChild(item);
        });
      }
    };
  }
}
