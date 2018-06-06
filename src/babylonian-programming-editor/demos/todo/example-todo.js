import boundEval from 'src/client/bound-eval.js';

import Morph from "src/components/widgets/lively-morph.js";
// import { asdf } from "src/babylonian-programming-editor/demos/todo/todo.js";

export default class ExampleTodo extends Morph {
  initialize() {
    boundEval("for(let i = 0; i < 1000000000; i++) {} console.log('In eval')");
    console.log("After eval");
    
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
}
