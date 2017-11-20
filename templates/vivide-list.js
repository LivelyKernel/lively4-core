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
  
  toggleSelection(wrapper) {
    return () => {
      wrapper.selected = wrapper.selected ? false : true;
      this.display()
      for(let i in this.successors) {
        this.successors[i].trigger();
      }
    }
  }
  
  toggleChildren(wrapper) {
    return () => {
      if(wrapper.hasChildren) {
        wrapper.children = [];
        wrapper.hasChildren = false;
      } else {
        wrapper.children = this.childrenGeneration(wrapper.object);
        wrapper.hasChildren = true;
      }
      this.display()
    }
  }
  
  display() {
    this.textContent = this.model.map(elem => this.depiction(elem.object)).join('<br />');
    let root = this.get("#content");
    root.innerHTML = "";
    for(let i in this.model) {
      let listentry = document.createElement("div");
      listentry.id = "listentry" + i;
      listentry.className = "listentry";
      
      let listentryUnfold = document.createElement("div");
      listentryUnfold.id = "listentry-unfold" + i;
      listentryUnfold.className = "listentry-unfold";
      listentryUnfold.addEventListener("click", this.toggleChildren(this.model[i]));
      listentryUnfold.innerHTML = "(v)";
      
      let listentryContent = document.createElement("div");
      listentryContent.id = "listentry-content" + i;
      listentryContent.className = "listentry-content";
      if(this.model[i].selected) { listentryContent.classList.add("selected"); }
      listentryContent.addEventListener("click", this.toggleSelection(this.model[i]));
      listentryContent.innerHTML = this.depiction(this.model[i].object);
      
      listentry.appendChild(listentryUnfold);
      listentry.appendChild(listentryContent);
      root.appendChild(listentry);
      
      if(this.model[i].children) {
        // TODO: refactor this, extract concept
        // IDEA: every entry has to be treated uniformly, children and root elements
        let children = this.model[i].children;
        
        for(let j in children) {
          let listentry = document.createElement("div");
          listentry.id = "listentry" + i + "-" + j;
          listentry.className = "listentry";
      
          let listentryPlaceholder = document.createElement("div");
          listentryPlaceholder.id = "listentry-placeholder" + i + "-" + j;
          listentryPlaceholder.className = "listentry-placeholder";
          listentryPlaceholder.innerHTML = "&nbsp;";
      
          let listentryContent = document.createElement("div");
          listentryContent.id = "listentry-content" + i + "-" + j;
          listentryContent.className = "listentry-content";
          listentryContent.innerHTML = children[j];
      
          listentry.appendChild(listentryPlaceholder);
          listentry.appendChild(listentryContent);
          root.appendChild(listentry);
        }
      }
    }
  }
  
  output() {
    return this.model.filter(elem => { return elem.selected; });
  }
  
  wrap(object) {
    let wrapper = {
      object: object,
      selected: false,
      children: [],
      hasChildren: false,
    }
    return wrapper;
  }
  
  setModel(model) {
    model = this.transformation(model);
    this.model = model.map(elem => this.wrap(elem));
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