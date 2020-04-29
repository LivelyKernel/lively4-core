export default class InstanceList {
  
  constructor(element, instances, selectionCallback) {
    this._element = element;
    this._instances = instances;
    this._activeInstance = null;
    this._selectionCallback = selectionCallback;
    this.render();
  }
  
  render() {
    /*probe:*/this._element.innerHTML/*{}*/ = "";
    for(let instance of this._instances) {
      /*probe:*/this._element/*{}*/.appendChild(this._renderInstance(instance))
    }
  }
  
  _renderInstance(instance) {
    const listItem = <li>{/*probe:*/instance.name/*{}*/}</li>;
    if(instance === this._activeInstance) {
      listItem.classList.add("active");
    }
    listItem.addEventListener("click", () => {
      this._selectionCallback(instance);
    });
    /*probe:*/return/*{}*/ listItem;
  }
  
  set activeInstance(instance) {
    this._activeInstance = instance;
    this.render();
  }
  
  set instances(instances) {
    this._instances = instances;
    this.render();
  }
  
}/* Context: {"context":{"prescript":"","postscript":""},"customInstances":[]} */