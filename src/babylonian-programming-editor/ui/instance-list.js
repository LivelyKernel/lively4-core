export default class InstanceList {
  
  constructor(element, instances, selectionCallback) {
    this._element = element;
    this._instances = instances;
    this._activeInstance = null;
    this._selectionCallback = selectionCallback;
    this.render();
  }
  
  render() {
    this._element.innerHTML = "";
    for(let instance of this._instances) {
      this._element.appendChild(this._renderInstance(instance))
    }
  }
  
  _renderInstance(instance) {
    const listItem = <li>{instance.name}</li>;
    if(instance === this._activeInstance) {
      listItem.classList.add("active");
    }
    listItem.addEventListener("click", () => {
      this._selectionCallback(instance);
    });
    return listItem;
  }
  
  set activeInstance(instance) {
    this._activeInstance = instance;
    this.render();
  }
  
}