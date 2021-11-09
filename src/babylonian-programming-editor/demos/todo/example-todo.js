import Morph from "src/components/widgets/lively-morph.js";
import { Todo } from "src/babylonian-programming-editor/demos/todo/todo.js";

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
/* Context: {"context":{"prescript":"","postscript":""},"customInstances":[{"id":"a3a8_45a6_041c","name":"example-todo","code":"return document.createElement(\"example-todo\");"}]} */