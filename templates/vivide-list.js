import Morph from './Morph.js';

export default class VivideList extends Morph {
  async initialize() {
    this.windowTitle = "VivideList";
    this.transformation = list => list;
    this.depiction = elem => elem;
    this.childrenGeneration = elem => [];
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
  
  setChildrenGeneration(generationFunction) {
    this.childrenGeneration = generationFunction;
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
  
  toggleChildren(index) {
    return () => {
      this.showChildren[index] = this.showChildren[index] ? false : true;
      this.display()
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
      
      let listentryUnfold = document.createElement("div");
      listentryUnfold.id = "listentry-unfold" + i;
      listentryUnfold.className = "listentry-unfold";
      listentryUnfold.addEventListener("click", this.toggleChildren(i));
      listentryUnfold.innerHTML = "(v)";
      
      let listentryContent = document.createElement("div");
      listentryContent.id = "listentry-content" + i;
      listentryContent.className = "listentry-content";
      if(this.selection[i]) { listentryContent.classList.add("selected"); }
      listentryContent.addEventListener("click", this.elementSelect(i));
      listentryContent.innerHTML = this.depiction(this.model[i]);
      
      listentry.appendChild(listentryUnfold);
      listentry.appendChild(listentryContent);
      root.appendChild(listentry);
      
      if(this.showChildren[i]) {
        // TODO: refactor this, extract concept
        // IDEA: every entry has to be treated uniformly, children and root elements
        let children = this.childrenGeneration(this.model[i]);
        
        for(let i in children) {
          let listentry = document.createElement("div");
          listentry.id = "listentry" + i;
          listentry.className = "listentry";
      
          let listentryUnfold = document.createElement("div");
          listentryUnfold.id = "listentry-unfold" + i;
          listentryUnfold.className = "listentry-unfold";
          // listentryUnfold.addEventListener("click", this.toggleChildren(i));
          listentryUnfold.innerHTML = "(v)";
      
          let listentryContent = document.createElement("div");
          listentryContent.id = "listentry-content" + i;
          listentryContent.className = "listentry-content";
          if(this.selection[i]) { listentryContent.classList.add("selected"); }
          // listentryContent.addEventListener("click", this.elementSelect(i));
          listentryContent.innerHTML = "&nbsp;&nbsp;&nbsp;&nbsp;" + children[i];
      
          listentry.appendChild(listentryUnfold);
          listentry.appendChild(listentryContent);
          root.appendChild(listentry);
        }
      }
    }
  }
  
  output() {
    return this.model.filter((elem, index) => { return this.selection[index]; });
  }
  
  setModel(model) {
    this.model = this.transformation(model);
    this.selection = this.model.map(elem => false);
    this.showChildren = this.model.map(elem => false);
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
    this.setChildrenGeneration(elem => elem.pets);
    this.show([
      {name: "John Doe", age: 25, pets: ["Waldy", "Smokie"]},
      {name: "Jane Doe", age: 24, pets: ["Jaques-the-Bird"]},
      {name: "Manfred Mustermann", age: 50, pets: ["Georg-Musterhund"]},
      {name: "John Wayne", age: 110, pets: []},
    ]);
  }
}