import Morph from './Morph.js';

export default class VivideList extends Morph {
  async initialize() {
    this.windowTitle = "VivideList";
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
      document.getElementById("listentry" + index).style.background = this.selection[index] ? "orange" : "white";
    }
  }
  
  display(array) {
    for(let i in array) {
      let listentry = document.createElement("div");
      listentry.addEventListener("click", this.elementSelect(i));
      listentry.className = "listentry";
      listentry.id = "listentry" + i;
      listentry.innerHTML = array[i];
      this.appendChild(listentry);
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
    this.display(this.depiction(this.model));
  }
  
  livelyExample() {
    this.setTransformation((list) => {
      return list.filter(elem => elem.age < 100);
    });
    this.setDepiction((list) => {
      return list.map(elem => elem.name);
    });
    this.show([
      {name: "John Doe", age: 25},
      {name: "Jane Doe", age: 24},
      {name: "Manfred Mustermann", age: 50},
      {name: "John Wayne", age: 110},
    ]);
  }
}