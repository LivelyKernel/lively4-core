import Morph from "src/components/widgets/lively-morph.js";
//import { Todo } from "src/babylonian-programming-editor/demos/todo/todo.js";

export default class ExampleTodo extends Morph {
  initialize() {
    this.windowTitle = "ExampleTodo";
    this.list = this.get("#list");
    
    this.todos = [
      new Todo("Do Something"),
      new Todo("Go shopping"),
      new Todo("Did Something", true),
    ];
    
    this.render();
  }
  
  render() {
    this.list.innerHTML = "";
    for(let todo of this.todos) {
      this.list.appendChild(todo.render());
    }
  }
}


export class Todo {
  constructor(title = "", isDone = false) {
    this.title = title;
    this.isDone = isDone;
  }
  
  toString() {
    return `${this.title}${this.isDone ? " (Done)" : ""}`;
  }
  
  render() {
    const element = document.createElement("li");
    element.classList.add("todo");
    element.textContent = this.title;
    if(this.isDone) {
      element.classList.add("done");
    }
    return element;
  }
}/* Examples: {"probes":[{"location":[34,4,34,10]},{"location":[44,4,44,10]},{"location":[21,6,21,15]}],"sliders":[{"location":[20,4,20,7]}],"examples":[{"location":[33,2,33,10],"id":"79e5-7fc8-30b0","name":"","values":{},"instanceId":"72a6-6655-302e"},{"location":[37,2,37,8],"id":"b68c-51a3-fe43","name":"","values":{},"instanceId":"72a6-6655-302e"},{"location":[18,2,18,8],"id":"a537-e187-71f4","name":"","values":{},"instanceId":""}],"replacements":[],"instances":[{"location":[27,13,27,17],"id":"c021-d5c8-ed82","name":"Show demo","values":{"title":"\"Show demo\"","isDone":""}},{"location":[27,13,27,17],"id":"72a6-6655-302e","name":"Prepare demo","values":{"title":"\"Prepare demo\"","isDone":"true"}}]} */