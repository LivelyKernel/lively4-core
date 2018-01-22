import Morph from 'src/components/widgets/lively-morph.js'; 

export default class VivideTable extends Morph {
  initialize() {
    this.windowTitle = "VivideTable";
    this.livelyTable = this.get('#lively-table');
    
    this.addEventListener("selection-changed", (evt) => {
      if(evt.detail.table != this.livelyTable) return;
      this.successors.forEach(successor => successor.trigger());
    });
    
    this.get("#open-workspace").addEventListener("click", () => {this.openWorkspaceOn(this)});
    this.get("#open-inspector").addEventListener("click", () => {this.openInspectorOn(this)});
    
    this.raw_model = [];
    this.transformation = list => [];
    
    this.predecessor = null;
    this.successors = [];
  }
  
  livelyExample() {
    this.setTransformation(list => list);
    this.show([
      {name: "Hans", age: "25"},
      {name: "Peter", age: "35"}
    ]);
  }
  
  register(anotherWidget) {
    this.successors.push(anotherWidget);
    anotherWidget.setPredecessor(this);
  }
  
  trigger() {
    this.show(this.predecessor.output());
  }
  
  output() {
    return this.livelyTable.getSelectionAsJSO();
  }
  
  setPredecessor(anotherWidget) {
    this.predecessor = anotherWidget;
    this.show(this.predecessor.output());
  }
  
  setTransformation(transformation) {
    this.transformation = transformation;
    this.update();
  }
  
  show(model) {
    this.raw_model = model;
    this.update();
  }
  
  update() {
    this.livelyTable.setFromJSO(this.transformation(this.raw_model));
    this.successors.forEach(successor => successor.trigger());
  }
  
  openWorkspaceOn(widget) {
    lively.openWorkspace();
    window.that = widget;
  }
  
  openInspectorOn(widget) {
    lively.openComponentInWindow("vivide-inspector").then(
      inspector => inspector.inspect(widget));
  }
}