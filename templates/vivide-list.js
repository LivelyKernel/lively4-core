import Morph from 'src/components/widgets/lively-morph.js';

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
    
    this.listItemBuilder = new ListItemBuilder(this);
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
    this.show(this.predecessor.output());
  }
  
  pushTransformation(transformation) {
    this.transformations.push(transformation);
  }
  
  getTransformation(index) {
    if(this.transformations.length > index) {
      return this.transformations[index];
    } else {
      return this.defaultTransformation;
    }
  }
  
  setTransformation(index, transformation) {
    if(this.transformations.length > index) {
      this.transformations[index] = transformation;
    } else if(this.transformations.length == index) {
      this.transformations.push(transformation);
    } else {
      throw "Index out of bounds"
    }
  }
  
  clearTransformations() {
    this.transformations = [];
  }
  
  pushDepiction(depiction) {
    this.depictions.push(depiction);
  }
  
  getDepiction(index) {
    if(this.depictions.length > index) {
      return this.depictions[index];
    } else {
      return this.defaultDepiction;
    }
  }
  
  setDepiction(index, depiction) {
    if(this.depictions.length > index) {
      this.depictions[index] = depiction;
    } else if(this.depictions.length == index) {
      this.depictions.push(depiction);
    } else {
      throw "Index out of bounds"
    }
  }
  
  clearDepictions() {
    this.depictions = [];
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
        wrapper.children = this.getTransformation(level+1)(wrapper.object).map(object => this.wrap(object));
        wrapper.hasChildren = true;
      }
      this.display()
    }
  }
  
  display() {
    this.textContent = this.model.map(elem => this.getDepiction(0)(elem.object)).join('<br />');
    this.get("#content").innerHTML = "";
    for(let i in this.model) { this.displayListEntry(0, this.model[i]); }
    this.successors.forEach(successor => successor.trigger());
  }
  
  displayListEntry(level, wrapper) {
    let listentry = this.listItemBuilder.build(level, wrapper);
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
    model = this.getTransformation(0)(model);
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

class ListItemBuilder {
  constructor(caller) {
    this.caller = caller;
  }
  
  build(level, wrapper) {
    let listentry = document.createElement("div");
    listentry.className = "listentry";
    
    let listentryPlaceholder = this.buildListentryPlaceholder(level);
    let listentryUnfold = this.buildListentryUnfold(this.caller, level, wrapper);       
    let listentryContent = this.buildListentryContent(this.caller, level, wrapper);
      
    listentry.appendChild(listentryPlaceholder);
    listentry.appendChild(listentryUnfold);
    listentry.appendChild(listentryContent);
    return listentry;
  }
  
  buildListentryPlaceholder(level) {
    let listentryPlaceholder = document.createElement("div");
    listentryPlaceholder.className = "listentry-placeholder";
    listentryPlaceholder.style.width = (level * 2) + "em";
    listentryPlaceholder.innerHTML = "&nbsp;";
    return listentryPlaceholder;
  }
  
  buildListentryUnfold(caller, level, wrapper) {
    let listentryUnfold = document.createElement("div");
    listentryUnfold.className = "listentry-unfold";
    listentryUnfold.addEventListener("click", caller.toggleChildren(level, wrapper));
    listentryUnfold.innerHTML = "(v)";
    return listentryUnfold;
  }
  
  buildListentryContent(caller, level, wrapper) {
    let listentryContent = document.createElement("div");
    listentryContent.className = "listentry-content";
    if(wrapper.selected) { listentryContent.classList.add("selected"); }
    listentryContent.addEventListener("click", caller.toggleSelection(wrapper));
    listentryContent.innerHTML = caller.getDepiction(level)(wrapper.object);
    return listentryContent;
  }
}