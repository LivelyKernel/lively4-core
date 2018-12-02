"enable aexpr";

import Morph from 'src/components/widgets/lively-morph.js';

export default class GithubExplorer extends Morph {
  async initialize() {
    this.windowTitle = "Github Explorer";
    this.registerButtons()

    lively.html.registerKeys(this); // automatically installs handler for some methods

    //lively.addEventListener("template", this, "dblclick", evt => this.onDblClick(evt));

    this.fetchModels();
  }

  // this method is autmatically registered through the ``registerKeys`` method
  onKeyDown(evt) {
    lively.notify("Key Down!" + evt.charCode)
  }

  // this method is automatically registered as handler through ``registerButtons``
  onFirstButton() {
    lively.notify("hello")
  }

  /* Lively-specific API */

  livelyPreMigrate() {
    // is called on the old object before the migration
  }

  livelyMigrate(other) {
    // whenever a component is replaced with a newer version during development
    // this method is called on the new object during migration, but before initialization
    this.someJavaScriptProperty = other.someJavaScriptProperty
  }

  livelyInspect(contentNode, inspector) {
    // do nothing
  }

  livelyPrepareSave() {

  }

  async fetchModels() {
    const res = await fetch('https://lively-kernel.org/lively4S2/_github/models');
    const json = await res.json();
    this.createModelsMenu(json);
  }

  createModelsMenu(models) {
    models.forEach(el => {
      const li = document.createElement("li");
      li.appendChild(document.createTextNode(el));
      li.id = el;
      
      lively.addEventListener(
        el,
        li,
        "click",
        e => this.onModelClick(e, el)
      );
      
      this.get('#models').appendChild(li);
    })
  }
  
  async onModelClick(e, model) {
    const res = await fetch(`https://lively-kernel.org/lively4S2/_github/models/${model}`);
    const json = await res.json();
    this.createDataPreview(json);
  }

  createDataPreview(json) {
    const fieldNames = Object.keys(json[0]);
    console.log(fieldNames);
    this.get('#datapreview').innerHTML = '';
    const tr = this.get('#datapreview').insertRow(-1);
    
    fieldNames.forEach(name => {
      const th = document.createElement("th");
      th.innerHTML = name;
      tr.appendChild(th);
    });
    
    json.slice(1,100).forEach(row => {
      const tr = this.get('#datapreview').insertRow(-1);
      
      fieldNames.forEach(name => {
        const td = document.createElement("td");
        td.innerHTML = row[name];
        tr.appendChild(td);
      });
    });
    
  }

  async livelyExample() {
    // this customizes a default instance to a pretty example
    // this is used by the 
    this.someJavaScriptProperty = 42
  }


}
