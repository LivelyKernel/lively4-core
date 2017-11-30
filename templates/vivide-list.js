import Morph from 'src/components/widgets/lively-morph.js';

// TODO: Refactor display functions to builder pattern
// TODO: Reference functions for infinite trees
// TODO: Testing

export default class VivideList extends Morph {
  async initialize() {
    this.windowTitle = "VivideList";
    
    this.transformations = [];
    this.defaultTransformation = list => [];
    
    this.depictions = [];
    this.defaultDepiction = elem => elem;
    
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
  
  pushTransformation(transformationFunction) {
    this.transformations.push(transformationFunction);
  }
  
  transformationAt(index) {
    if(this.transformations.length > index) {
      return this.transformations[index];
    } else {
      return this.defaultTransformation;
    }
  }
  
  pushDepiction(depictionFunction) {
    this.depictions.push(depictionFunction);
  }
  
  depictionAt(index) {
    if(this.depictions.length > index) {
      return this.depictions[index];
    } else {
      return this.defaultDepiction;
    }
  }
  
  toggleSelection(wrapper) {
    return () => {
      wrapper.selected = wrapper.selected ? false : true;
      this.display()
    }
  }
  
  toggleChildren(level, wrapper) {
    return () => {
      if(wrapper.hasChildren) {
        wrapper.children = [];
        wrapper.hasChildren = false;
      } else {
        wrapper.children = this.transformationAt(level+1)(wrapper.object).map(object => this.wrap(object));
        wrapper.hasChildren = true;
      }
      this.display()
    }
  }
  
  display() {
    this.textContent = this.model.map(elem => this.depictionAt(0)(elem.object)).join('<br />');
    this.get("#content").innerHTML = "";
    for(let i in this.model) { this.displayListEntry(0, this.model[i]); }
    this.successors.forEach(successor => successor.trigger());
  }
  
  displayListEntry(level, wrapper) {
    let listentry = document.createElement("div");
    listentry.className = "listentry";
    
    let listentryPlaceholder = document.createElement("div");
    listentryPlaceholder.className = "listentry-placeholder";
    listentryPlaceholder.style.width = (level * 2) + "em";
    listentryPlaceholder.innerHTML = "&nbsp;";
      
    let listentryUnfold = document.createElement("div");
    listentryUnfold.className = "listentry-unfold";
    listentryUnfold.addEventListener("click", this.toggleChildren(level, wrapper));
    listentryUnfold.innerHTML = "(v)";
      
    let listentryContent = document.createElement("div");
    listentryContent.className = "listentry-content";
    if(wrapper.selected) { listentryContent.classList.add("selected"); }
    listentryContent.addEventListener("click", this.toggleSelection(wrapper));
    listentryContent.innerHTML = this.depictionAt(level)(wrapper.object);
      this.defaultDepiction(wrapper.object);
      
    listentry.appendChild(listentryPlaceholder);
    listentry.appendChild(listentryUnfold);
    listentry.appendChild(listentryContent);
    this.get("#content").appendChild(listentry);
    
    for(let i in wrapper.children) {
      this.displayListEntry(level+1, wrapper.children[i]);
    }
  }
  
  allSelectedChildrenOf(wrapper) {
    if(!wrapper.children) {
      return [];
    }
    let children = wrapper.children.filter(child => child.selected).map(child => child.object);
    for(let i in wrapper.children) {
      children = children.concat(this.allSelectedChildrenOf(wrapper.children[i]))
    }
    return children;
  }
  
  output() {
    let output = [];
    for(let i in this.model) {
      if(this.model[i].selected) {
        output.push(this.model[i].object);
      }
      output = output.concat(this.allSelectedChildrenOf(this.model[i]));
    }
    return output;
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
    model = this.transformationAt(0)(model);
    this.model = model.map(elem => this.wrap(elem));
  }
  
  show(model) {
    this.setModel(model);
    this.display();
  }
  
  livelyExample() {
    this.pushTransformation((list) => {
      return list.filter(person => person.age < 100);
    });
    this.pushDepiction(person => person.name);
    this.pushTransformation(person => person.pets);
    this.pushDepiction(pet => pet.name + " the " + pet.type);
    this.pushTransformation(pet => pet.eats);
    this.pushDepiction(meal => "... eats " + meal);
    this.show([
      {name: "John Doe", age: 25, pets: [
        {type: "Dog", name: "Waldy", eats: ["Pasta", "Pizza"]},
        {type: "Cat", name: "Smokie", eats: ["Socks"]}
      ]},
      {name: "Jane Doe", age: 24, pets: [
        {type: "Bird", name: "Jaques", eats: []}
      ]},
      {name: "Manfred Mustermann", age: 50, pets: [
        {type: "Monster", name: "Georg Musterhund", eats: ["Children"]}
      ]},
      {name: "John Wayne", age: 110, pets: []},
    ]);
  }
}