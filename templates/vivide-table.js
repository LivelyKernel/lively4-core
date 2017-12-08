import Morph from 'src/components/widgets/lively-morph.js'; 

export default class VivideTable extends Morph {
  initialize() {
    this.windowTitle = "VivideTable";
    this.livelyTable = this.get('#lively-table');
    
    this.addEventListener("selection-changed", (evt) => {
      if(evt.detail.table != this.livelyTable) return;
      this.successors.forEach(successor => successor.trigger());
    });
    
    this.model = [];
    this.transformation = list => [];
    
    this.predecessor = null;
    this.successors = [];
  }
  
  livelyExample() {
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
  
  pushTransformation(transformation) {
    this.transformation = transformation;
  }
  
  show(model) {
    this.model = this.transformation(model);
    this.livelyTable.setFromJSO(this.model);
    this.successors.forEach(successor => successor.trigger());
  }
}