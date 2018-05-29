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
}/* Examples: {"probes":[{"location":[35,4,35,10]},{"location":[45,4,45,10]}],"sliders":[],"examples":[{"location":[34,2,34,10],"id":"79e5-7fc8-30b0","name":"","values":{},"instanceId":"72a6-6655-302e"},{"location":[38,2,38,8],"id":"b68c-51a3-fe43","name":"","values":{},"instanceId":"72a6-6655-302e"}],"replacements":[],"instances":[{"location":[28,13,28,17],"id":"c021-d5c8-ed82","name":"Show demo","values":{"title":"\"Show demo\"","isDone":""}},{"location":[28,13,28,17],"id":"72a6-6655-302e","name":"Prepare demo","values":{"title":"\"Prepare demo\"","isDone":"true"}}]} */