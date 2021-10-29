"enable aexpr";

import Morph from 'src/components/widgets/lively-morph.js';
import { AExprRegistry } from 'src/client/reactive/active-expression/ae-registry.js';

export default class AexprTable extends Morph {
  async initialize() {
    this.windowTitle = "Active Expression Monitor";
    this.initializeCallbacks();
    this.initializeHeader();
    this.value = new Array();
    this.populate();
    this.buttonShowEvents.addEventListener('click', () => this.openEventDrops());
    this.filterElement.addEventListener('change', () => this.filterChanged());
    this.update();
  }
  
  initializeCallbacks(){
    AExprRegistry.on('add', (aexpr) => this.addAexpr(aexpr));
    AExprRegistry.on('remove', (aexpr) => this.removeAexpr(aexpr));
    AExprRegistry.on('update', (aexpr) => this.updateAexpr(aexpr));
  }
  
  initializeHeader(){
    let header = <tr class='header'></tr>;
    for(let col in attributes)header.appendChild(<td>{col}</td>)
    this.table.appendChild(header);
  }
  
  update() {
    if(this.detached)return;
    this.rows().forEach(coolDown);
    if(this._filterDirty !== false) {
      this.updateFilter();
      this._filterDirty = false;
    }
    setTimeout(() => {this.update()}, 100);
  }
  
  
  get table() {
    return this.get("#table");
  }
  
  get filterElement() {
    return this.get("#filter");
  }
  
  get buttonShowEvents() {
    return this.get("#buttonShowEvents");
  }

  
  populate() {  
    this._rows = [];
    for(let each of AExprRegistry.allAsArray()) {
      this.addAexpr(each);
    }
  } 
  
  addAexpr(aexpr){
    this.createRow(aexpr);
    this.value.push(aexpr);
    this.filterChanged();
  }
  
  removeAexpr(aexpr){
    let row = this.rowOf(aexpr);
    if(row) {
      let rowIndex = this.rows().indexOf(row);
      this.rows().splice(rowIndex, 1);
      this.table.removeChild(row);
    }
  
    let index = this.value.indexOf(aexpr);
    this.value.splice(index, 1);
    this.filterChanged();
  }
  
  updateAexpr(aexpr){
    let row = this.rowOf(aexpr);
    if(!row)return;
    this.setRow(row, aexpr);
    this.igniteRow(row);
    this.filterChanged();
  }
  
  igniteRow(row){
    row.heat++;
    let newColor = colorForHeat(row.heat);
    row.setAttribute("bgcolor", newColor);
  }
  
  rows() {
    if(!this._rows) {
      this._rows = this.table.childNodes
        .filter(each => each.tagName == 'TR')
        .filter(each => each.getAttribute('class') == 'aeRow');
    }
    return this._rows;
  }
  
  rowOf(aexpr){
    return this.rows().find(each => each.aexpr === aexpr);
  }
  
  createRow(aexpr){
    let htmlRow = <tr class='aeRow'></tr>;
    htmlRow.heat = 0;
    this.setRow(htmlRow, aexpr);
    this.table.appendChild(htmlRow);
    this.rows().push(htmlRow);
  }
  
  setRow(row, aexpr){
    row.aexpr = aexpr;
    while(row.firstChild) {
      row.removeChild(row.firstChild);
    }
    for(let attribute in attributes){
      let value = attributes[attribute](aexpr);
      row.appendChild(<td>{value}</td>);
    }
  }
  
  clearTable() {
    while (this.table.firstChild)this.table.firstChild.remove();
  }
  
  filterChanged() {
    this._filterDirty = true;
  }
  
  updateFilter() {
    let code = this.filterElement.value;
    let numResults = 0;
    let numErrored = 0;
    try {
      if(code && code !== '')this.filter = new Function("each", "return "+code);
      else this.filter = () => true;
      this.rows().forEach(each => {
        let filterIn = false;
        try {
          filterIn = this.filter(each.aexpr);
        } catch(e) {
          filterIn = false;
          numErrored++;
        };
        if(filterIn)numResults++;
        each.style.display = filterIn ? 'table-row' : 'none';
      });
      this.get('#filter-info').textContent = 
        "results/errored/total = "+numResults+"/"+numErrored+"/"+this.rows().length;
    } catch(e) {
      lively.notify('Error parsing '+code+': '+e);
    }
  }
  
  async openEventDrops() {
    let eventDrops = await lively.openComponentInWindow('aexpr-timeline');
    eventDrops.dataFromSource = this.rows()
      .map(each => each.aexpr)
      .filter(each => this.filter(each));
    eventDrops.groupingFunction = each => each.meta().get('id');
    eventDrops.update();
  }
  
  livelyMigrate(other) {
    
  }
  
  async livelyExample() {
  
  }
  
  detachedCallback() {
    this.detached = true;
  }
  

}

/*MD ## Row Utilities MD*/
const attributes = {
  id : ae => ae.meta().get('id'),
  function : deBabelify,
  currentValue : getValueTag,
  callbacks : ae => listify(ae.callbacks),
  dependencies : getDependencies,
  actions : ae => <div>
    <button click={evt => lively.openInspector(ae, undefined, ae)}>inspect</button>
    <button click={() => ae.dispose()}>dispose</button>
  </div>
}
  
function deBabelify(ae) {
  let location = ae.meta().get('location');
  return location && location.source || ae.func.toString();
}

function inspectorLink(object) {
  let link = <a>{object && object.toString()}</a>;
  link.onclick = () => lively.openInspector(object);
  return link;
}
                  

function getValueTag(ae) {
  let {value, isError} = ae.evaluateToCurrentValue();
  return <font color={isError ? "red" : "blue"}>{""+value}</font>;
}

function getDependencies(ae) {
  return ae.supportsDependencies() ? 
      listify(ae.dependencies().all().map(dependencyString))
      : <font color="#551199">{"no dependecy api available"}</font>
}
  
function dependencyString(dependency) {
  let descriptor = dependency.getAsDependencyDescription();
  let type = 'unknown type';
  if(dependency.isMemberDependency()) type = 'member';
  if(dependency.isGlobalDependency()) type = 'global';
  if(dependency.isLocalDependency()) type = 'local';
  return <li>{type}
    {listify(Object.keys(descriptor)
      .map(key => <span>{key+' : '}{inspectorLink(descriptor[key])}</span>), true)}</li>
}

function listify(array, protect) {
  return <ul style="display:block">{...(
      array.map(each => <li style={protect ? "white-space: nowrap" : ""}>{each}</li>)
    )}</ul>
}

function colorForHeat(heat) {
  let others = Math.round(256/(heat+1.02)).toString(16);
  if(others.length == 1)others = "0"+others;
  return "#FF"+others+others;
}

function coolDown(row) {
  let currentHeat = row.heat;
  if(currentHeat <= 0)return;
  row.heat = Math.max(currentHeat * 0.95 - 0.01, 0);
  let newColor = colorForHeat(row.heat);
  row.setAttribute("bgcolor", newColor);
  if(row.heat <= 0) {
    row.heat = 0;
    row.setAttribute("bgcolor", "#FFFFFF");
  }
}