export class Todo {
  constructor(name = "", isDone = false) {
    this.name = name;
    this.isDone = isDone;
  }
  
  toString() {
    return `${this.name}${this.isDone ? " (Done)" : ""}`;
  }
}