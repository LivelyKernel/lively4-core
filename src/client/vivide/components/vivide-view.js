import Morph from 'src/components/widgets/lively-morph.js';
import { uuid, without } from 'utils';

export default class VivideView extends Morph {
  static findViewWithId(id) {
    return document.body.querySelector(`vivide-view[vivide-view-id=${id}]`);
  }
  
  get input() { return this._input || (this._input = []); }
  set input(val) { return this._input = val; }
  
  get id() {
    let id = this.getAttribute('vivide-view-id');
    if(id) {
      return id;
    }
    
    // ensure uuid begins with a letter to match the requirements for a css selector
    let newId = 'vivide-view-' + uuid();
    this.setAttribute('vivide-view-id', newId);
    return newId;
  }
  get outportTargets() {
    let targets = this.getAttribute('outport-target');
    if(targets) {
      return JSON.parse(targets);
    }
    
    return this.outportTargets = [];
  }
  set outportTargets(targets) {
    this.setAttribute('outport-target', JSON.stringify(targets));
    return targets;
  }
  addOutportTarget(target) {
    return this.outportTargets = this.outportTargets.concat(target);
  }
  removeOutportTarget(target) {
    return this.outportTargets = without.call(this.outportTargets, target);
  }
  
  connectTo(target) {
    // #TODO: cycle detection
    this.addOutportTarget(target.id);
  }
  
  notifyOutportTargets() {
    lively.warn('explicitly notify outport targets', this.outportTargets);
    this.outportTargets
      .map(VivideView.findViewWithId)
      .forEach(target => {
        target.newDataFromUpstream(this.displayedData);
      });
  }
  
  selectionChanged(widget) {
    lively.warn('selection changed', 'notify outport targets')
    let data = widget.getSelectedData();
    this.outportTargets
      .map(VivideView.findViewWithId)
      .forEach(target => {
        target.newDataFromUpstream(data);
      });
  }

  async initialize() {
    this.windowTitle = "VivideView";
  }
  
  async setScript(scriptURL) {
    this.scriptURL = scriptURL;
  }
  
  async newDataFromUpstream(data) {
    this.input = data;
    
    if(this.scriptURL) {
      await this.calculateDisplayData();
    } else {
      this.displayedData = this.input;
    }
    
    await this.updateWidget();
    this.notifyOutportTargets();
  }
  
  async calculateDisplayData() {
    let m = await System.import(this.scriptURL.href);

    this.displayedData = [];
    m.default(this.input, this.displayedData)
  }
  async scriptGotUpdated(urlString) {
    lively.warn(`received script updated`, urlString);
    if(this.scriptURL && this.scriptURL.href === urlString) {
      await this.calculateDisplayData();
      await this.updateWidget();
    }
  }
  
  async updateWidget() {
    this.innerHTML = '';
    let list = await lively.create('vivide-list-widget');
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
}
