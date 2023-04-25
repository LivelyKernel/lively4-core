import Morph from 'src/components/widgets/lively-morph.js';
import { uuid, without, getTempKeyFor, getObjectFor, flatMap } from 'utils';
import VivideObject from 'src/client/vivide/vivideobject.js';
import Script from 'src/client/vivide/vividescript.js';

/**
 * Smart widget choosing
 */
class WidgetChooser {
  static getPreferredWidgetType(forest, viewConfig) {
    if (viewConfig.has('widget')) { 
      return viewConfig.get('widget');
    }
    
    // #TODO: this is too dependent on internal structure of the model/VivideObject
    // PROPOSAL: Models should not know about views, therefore they cannot return
    //   a suggested view, but they could return a data type suggestion like:
    //     model.dataType == "data-points" || "list" || "text"
    //   Additionally, this data type could be set manually or via an "intelligent"
    //   algorithm.
    if (forest && forest.length > 0) {
      // #Question: this model has an objects array, what is the data structure of this model?
      const model = forest[0];
      
      if(model.properties.has('dataPoints') && typeof model.properties.get('dataPoints')[0] === 'number') {
        return 'boxplot';
      } else if (model.properties.has('text')) {
        return 'text';
      }
    }
    return 'tree';
  }
  static findAppropriateWidget(forest, viewConfig) {
    const type = this.getPreferredWidgetType(forest, viewConfig);
    
    // full type specified
    if(type.includes('-')) {
      return type;
    }
    
    // shorthand notation used
    return `vivide-${type}-widget`;
  }
}

export default class VivideView extends Morph {
  static findViewWithId(id, context=document.body) {
    return lively.query(context, `vivide-view[vivide-view-id=${id}]`);
  }
  
  static getIdForView(view) {
    return view.id;
  }
  
  static get idAttribute() { return 'vivide-view-id'; }
  
  static get outportAttribute() { return 'outport-target'; }
  
  static get scriptAttribute() { return 'vivide-script'; }
  
  static get widgetId() { return 'widget'; }
  
  static get widgetSelector() { return '#' + this.widgetId; }
  
  static forestToData(model) {
    return model.map(m => m.object);
  }
  
  // unused?
  static dataToForest(data) {
    return data.map(d => new VivideObject(d));
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
        let view = VivideView.findViewWithId(id, lively.findWorldContext(this)) ;
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
  
  transmitDataToOutportTargets(dataToTransmit) {
    this.outportTargets.forEach(target => target.newDataFromUpstream(dataToTransmit));
  }
  reallyNotifyOutportTargets(stuffToTransmit) {
    this.transmitDataToOutportTargets(VivideView.forestToData(stuffToTransmit));
  }
  notifyOutportTargets() {
    // lively.warn('VIEW::NOTIFY2', this.forestToDisplay[0])
    this.reallyNotifyOutportTargets(this.forestToDisplay);
  }
  
  updateOutportTargets() {
    const dataToTransmit = this.getDataToTransmit();
    if(dataToTransmit) {
      // lively.warn('VIEW::UPDATE', dataToTransmit[0])
      this.transmitDataToOutportTargets(dataToTransmit);
    }
  }
  
  getDataToTransmit() {
      // lively.warn('display all data')
    if(this.widget && this.widget.multiSelectionEnabled) {
      return this.getSelectedData();
    } else if (this.widget && this.widget.localName === 'vivide-text-widget') {
      return this.getSelectedData();
    } else {
      // use all data
      return VivideObject.forestToData(this.forestToDisplay);
    }
  }
  
  getSelectedData() {
    const widget = this.widget;
    if(widget) {
      return widget.getSelectedData();
    }
    return undefined;
  }

  selectionChanged() {
    this.updateOutportTargets();
  }
  
  addDragInfoTo(evt) {
    const dt = evt.dataTransfer;
    // #TODO: An improved fix would be to change what is returned by the widget selection
    let selection = this.getDataToTransmit();
    if(selection) {
      // lively.warn('VivideView::addDragInfoTo', selection[0])
      dt.setData("javascript/object", getTempKeyFor(selection));
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

    // restore data... 
    
    // not migrating, but initializing from source
    if (!this.myCurrentScript) {
      var scriptJSON = this.getAttribute("vivide-script")
      if (scriptJSON) {
        this.myCurrentScript = await Script.fromJSON(scriptJSON, this)
      } else {
        //This got commented because it is not reliable. It will often overwrite or take longer to setup and overwrite later on
        // await this.initDefaultScript();
      }

      var dataJSON = this.getAttribute("vivide-data")
      if (dataJSON) {
        // await this.createScriptEditor();
        var data = JSON.parse(dataJSON)
        this.newDataFromUpstream(data)
      }      
    }
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
  set myCurrentScript(script) {
    this._myCurrentScript = script;
    this.setAttribute(VivideView.scriptAttribute, script.toJSON());
  }

  async initDefaultScript() {
    const script = await Script.createDefaultScript(this);
    this.myCurrentScript = script;
    return script;
    // this.setJSONAttribute(VivideView.scriptAttribute, this.myCurrentScript.toJSON());
  }
  
  async newDataFromUpstream(data) {
    this.input = data;
    
    await this.calculateOutputModel();
    await this.updateWidget();
    this.updateOutportTargets();
  }
  
  getInputData() {
    return this.input;
  }
  
  async calculateOutputModel() {
    const firstStep = this.myCurrentScript.getInitialStep();
    const data = this.input.slice(0);
    
    this.forestToDisplay = await firstStep.processData(data);
  }
  
  // #TODO: nearly a duplicate with newDataFromUpstream; remove duplication
  async scriptGotUpdated() {
    // #TODO: save script to web-component
    // #TODO: later support multiple profiles
    lively.notify('VivideView::scriptGotUpdated');
    await this.calculateOutputModel();
    await this.updateWidget();
    // Update outport views
    // #TODO: nearly a duplicate with notifyOutportTargets, remove duplication
    this.updateOutportTargets();
  }
  
  async updateWidget() {
    this.innerHTML = '';

    const viewConfig = await this.myCurrentScript.getViewConfig();
    const chosenWidgetType = WidgetChooser.findAppropriateWidget(this.forestToDisplay, viewConfig);

    const widget = await lively.create(chosenWidgetType);
    widget.setView(this);
    widget.setAttribute('id', VivideView.widgetId);
    this.appendChild(widget);
    await widget.display(this.forestToDisplay, viewConfig);
  }
  
  async createScriptEditor() {
    const viewWindow = lively.findWindow(this);
    const reference = viewWindow && viewWindow.tagName === "LIVELY-WINDOW" ?
        viewWindow : this;
    const pos = lively.getClientBounds(reference).topRight();

    const scriptEditor = await lively.openComponentInWindow('vivide-script-editor', pos);
    scriptEditor.setView(this);
    // #TODO: only do setView with this as argument, the following line should not be required
    await scriptEditor.setScript(this.myCurrentScript);

    return scriptEditor;
  }
  
  livelyPrepareSave() {
    this.setAttribute("vivide-script", this.myCurrentScript.toJSON());

    try {
      var json = JSON.stringify(this.getInputData())
      this.setAttribute("vivide-data", json)
    } catch(e) {
      console.warn("could not persist vivide data", this.getInputData() )
    }
  }
  
  async livelyExample() {
    const exampleData = [
      {
        name: "object",
        subclasses:[
          {name: "morph"}
        ]},
      {
        name: "list",
        subclasses:[
          {
            name: "linkedlist",
            subclasses:[
              {name: "stack"}
            ]},
          {
            name: "arraylist"
          }]
      },
      {
        name: "usercontrol",
        subclasses:[
          {name: "textbox"},
          {name: "button"},
          {name: "label"}
        ]},
    ];
    
    await this.initDefaultScript();
    await this.createScriptEditor();
    await this.newDataFromUpstream(exampleData);
  }
  
  livelyMigrate(other) {
    lively.notify('VivideView::migrate')
    this.myCurrentScript = other.myCurrentScript;
    this.myCurrentScript.setView(this);

    this.newDataFromUpstream(other.input);
  }
  
  livelyInspect(contentNode, inspector) {
    if (this.myCurrentScript) {
      contentNode.appendChild(inspector.display(this.myCurrentScript, false, "#script", this));
    }
    if (this.input) {
      contentNode.appendChild(inspector.display(this.input, false, "#input", this));
    }
    
    var outportTargets = this.outportTargets
    if (outportTargets) {
      contentNode.appendChild(inspector.display(outportTargets, false, "#outportTargets", this));
    }
    
    
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
