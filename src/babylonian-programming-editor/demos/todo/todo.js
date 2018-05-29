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
}/* Examples: {"probes":[{"location":[8,4,8,10]},{"location":[17,4,17,10]}],"sliders":[],"examples":[{"location":[7,2,7,10],"id":"5c10-222a-cf50","name":"","values":{},"instanceId":"8c37-133b-77ff"},{"location":[7,2,7,10],"id":"b429-b152-ca69","name":"","values":{},"instanceId":"bf84-9459-a50b"},{"location":[11,2,11,8],"id":"8ae2-db44-b79f","name":"","values":{},"instanceId":"8c37-133b-77ff"}],"replacements":[],"instances":[{"location":[1,13,1,17],"id":"8c37-133b-77ff","name":"Demo","values":{"title":"\"Show demo\"","isDone":""}},{"location":[1,13,1,17],"id":"bf84-9459-a50b","name":"Done","values":{"title":"\"Prepare demo\"","isDone":"true"}}]} */