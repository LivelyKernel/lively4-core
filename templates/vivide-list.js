import Morph from './Morph.js';

export default class VivideList extends Morph {
  async initialize() {
    this.windowTitle = "VivideList";
    this.transformation = list => list;
    this.depiction = elem => elem;
    this.predecessor = null;
    this.successors = [];
  }
  
  register(anotherWidget) {
    this.successors.push(anotherWidget);
    anotherWidget.setPredecessor(this);
  }
  
  trigger() {
    this.show(this.predecessor.output());
  }
  
  setPredecessor(anotherWidget) {
    this.predecessor = anotherWidget;
  }
  
  setTransformation(transformationFunction) {
    this.transformation = transformationFunction;
  }
  
  setDepiction(depictionFunction) {
    this.depiction = depictionFunction;
  }
  
  elementSelect(index) {
    return () => {
      this.selection[index] = this.selection[index] ? false : true;
      this.display()
      for(let i in this.successors) {
        this.successors[i].trigger();
      }
    }
  }
  
  display() {
    this.textContent = this.model.map(elem => this.depiction(elem)).join('<br />');
    let root = this.get("#content");
    root.innerHTML = "";
    for(let i in this.model) {
      let listentry = document.createElement("div");
      listentry.id = "listentry" + i;
      listentry.className = "listentry";
      if(this.selection[i]) { listentry.classList.add("selected"); }
      listentry.addEventListener("click", this.elementSelect(i));
      listentry.innerHTML = this.depiction(this.model[i]);
      root.appendChild(listentry);
    }
  }
  
  output() {
    return this.model.filter((elem, index) => { return this.selection[index]; });
  }
  
  setModel(model) {
    this.model = this.transformation(model);
    this.selection = this.model.map(elem => false);
  }
  
  show(model) {
    this.setModel(model);
    this.display();
  }
  
  livelyExample() {
    this.setTransformation((list) => {
      return list.filter(elem => elem.age < 100);
    });
    this.setDepiction(elem => elem.name);
    this.show([
      {name: "John Doe", age: 25},
      {name: "Jane Doe", age: 24},
      {name: "Manfred Mustermann", age: 50},
      {name: "John Wayne", age: 110},
    ]);
  }
}