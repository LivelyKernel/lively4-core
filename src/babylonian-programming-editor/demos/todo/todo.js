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
    element.textContent = this.title;
    if(this.isDone) {
      element.classList.add("done");
    }
    return element;
  }
}
