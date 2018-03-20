import Morph from 'src/components/widgets/lively-morph.js';
import { uuid, without, getTempKeyFor, getObjectFor, flatMap, fileEnding } from 'utils';

Array.from(document.body.querySelectorAll("*"))
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
  
  // static modelToData(model) {
  //   return model.map(m => m.object);
  // }
  // static dataToModel(data) {
  //   return data.map(d => ({ object: d }));
  // }

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
    let ids = this.getAttribute(VivideView.outportAttribute);
    if(ids) {
      return flatMap.call(JSON.parse(ids), id => {
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
    this.setAttribute(VivideView.outportAttribute, JSON.stringify(targets.map(VivideView.getIdForView)));
    
    return targets;
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
    lively.warn('explicitly notify outport targets', this.outportTargets);
    this.outportTargets
      .forEach(target => {
        target.newDataFromUpstream(this.displayedData);
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
      lively.success('selection changed', 'notify outport targets');
      this.outportTargets.forEach(target => target.newDataFromUpstream(data));
    } else {
      lively.error('selection changed, but no widget to retrieve data from');
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
    
    this.addEventListener('dragenter', evt => this.dragenter(evt), false);
    this.addEventListener('dragover', evt => this.dragover(evt), false);
    this.addEventListener('dragleave', evt => this.dragleave(evt), false);
    this.addEventListener('drop', evt => this.drop(evt), false);

    this.input = [];
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
    if(dt.types.includes("javascript/object")) {
      lively.success('drop data');

      const data = getObjectFor(dt.getData("javascript/object"));
      this.newDataFromUpstream(data);
      
      shouldPreventPropagation = true;
    }
    
    if(dt.types.includes("vivide") && dt.types.includes("vivide/source-view")) {
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
  
  setScriptURLString(scriptURLString) {
    this.setAttribute(VivideView.scriptAttribute, scriptURLString);
    return scriptURLString;
  }
  getScriptURLString() {
    return this.getAttribute(VivideView.scriptAttribute);
  }
  
  async newDataFromUpstream(data) {
    this.input = data;
    
    if(this.getScriptURLString()) {
      await this.calculateDisplayData();
    } else {
      this.displayedData = this.input;
    }
    
    await this.updateWidget();
    this.notifyOutportTargets();
  }
  
  async calculateDisplayData() {
    let scriptDescription = await fetch(this.getScriptURLString()).then(r => r.json());
    
    let stepURLs = scriptDescription[0].transform
    let transforms = await Promise.all(stepURLs.map(url => System.import(url)))

    this.displayedData = transforms.reduce((data, transform) => {
      let output = [];
      transform.default(data, output);
      return output;
    }, this.input);
  }
  async scriptGotUpdated(urlString) {
    lively.notify(`received script updated`, urlString);
    let ownScriptURLString = this.getScriptURLString();
    if(ownScriptURLString === urlString) {
      await this.calculateDisplayData();
      await this.updateWidget();
    }
  }
  
  async updateWidget() {
    this.innerHTML = '';
    let list = await lively.create('vivide-list-widget');
    list.setAttribute('id', VivideView.widgetId);
    this.appendChild(list);
    list.display(this.displayedData, {});
  }
  
  livelyExample() {
    let exampleData = [
      function foo() { return 1; },
      function bar() { return 2; },
      function baz() { return 3; },
    ];
    
    this.newDataFromUpstream(exampleData);
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
