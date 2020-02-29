"enable aexpr";

import Morph from 'src/components/widgets/lively-morph.js';
import {AExprRegistry} from 'src/client/reactive/active-expression/active-expression.js';

const attributes = {
  id : ae => ae.meta().get('id'),
  function : ae => ae.func,
  //lastValue : ae => ""+ae.lastValue,
  currentValue : getValueTag,
  callbacks : ae => listify(ae.callbacks),
  
  dependencies : ae => ae.supportsDependencies() ? 
      listify(ae.dependencies().all().map(dependencyString))
    : <font color="#551199">{"no dependecy api available"}</font>,
  
  actions : ae => <div>
    <button click={evt => lively.openInspector(ae, undefined, ae)}>inspect</button>
    <button click={() => ae.dispose()}>dispose</button>
  </div>
}
                  

function getValueTag(ae) {
  let {value, isError} = ae.evaluateToCurrentValue();
  return <font color={isError ? "red" : "blue"}>{""+value}</font>;
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

function colorForHeat(heat) {
  let others = Math.round(256/Math.pow(heat+0.1, 1)).toString(16);
  if(others.length == 1)others = "0"+others;
  return "#FF"+others+others;
}

function coolDown(element) {
  let currentcount = parseFloat(element.getAttribute("heat"));
  if(currentcount <= 0)return;
  let step = 0.1;
  currentcount = currentcount * 0.95 - 0.01;
  element.setAttribute("heat", Math.max(currentcount, 0));
  let newColor = colorForHeat(currentcount+1);
  element.setAttribute("bgcolor", newColor);
  if(currentcount <= 0) {
    element.setAttribute('heat', 0);
    element.setAttribute("bgcolor", "#FFFFFF");
  }
}

export default class AexprTable extends Morph {
  async initialize() {
    this.windowTitle = "Active Expression Monitor";
    this.initializeCallbacks();
    this.initializeHeader();
    this.value = new Array();
    this.repopulate();
    this.events = new Map();
    //this.filter.onchange = (x,y,z) => lively.notify(x+" -- "+y+" -- "+z);
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
    this.rows().forEach(coolDown);
    if(this._filterDirty !== false) {
      this.updateFilter();
      this._filterDirty = false;
    }
    setTimeout(() => {this.update()}, 100);
  }
  
  get value() {
    return this._value
  }

  set value(v) {
    this._value = v
    //this.update()
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

  
  repopulate() {  
    this._rows = [];
    let added = AExprRegistry.allAsArray().difference(this.value);
    let removed = this.value.difference(AExprRegistry.allAsArray());
    for(let each of removed)this.removeAexpr(each);
    for(let each of added)this.addAexpr(each);
  } 
  
  addAexpr(aexpr){
    let row = this.createRow(aexpr);
    this.table.appendChild(row);
    this.value.push(aexpr);
    this.rows().push(row);
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
    let currentHeat = parseFloat(row.getAttribute("heat"));
    row.setAttribute("heat", currentHeat+1);
    let newColor = colorForHeat(Math.min(currentHeat+1, 30));
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
    return this.rows().filter(each => each.aexpr === aexpr)[0];
  }
  
  createRow(aexpr){
    let htmlRow = <tr class='aeRow'></tr>;
    htmlRow.setAttribute("heat", 0);
    //htmlRow.cells = {};
    this.setRow(htmlRow, aexpr);
    return htmlRow; 
  }
  
  setRow(row, aexpr){
    row.aexpr = aexpr;
    while(row.firstChild) {
      row.removeChild(row.firstChild);
    }
    for(let attribute in attributes){
      let value = attributes[attribute](aexpr);
      let cell = row.cells[attribute];
      if(!cell) {
        cell = <td>{value}</td>;
        row.appendChild(cell);
        //row.cells[attribute] = cell;
      } else {
        //cell.textContent = {...value};
      }
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
      if(!code || code == '')code = 'true';
      this.filter = new Function("each", "return "+code);
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
      this.get('#filter-info').textContent = "results/errored/total = "+numResults+"/"+numErrored+"/"+this.rows().length;
    } catch(e) {
      lively.notify('Error parsing '+code+': '+e);
    }
  }
  
  async openEventDrops() {
    let eventDrops = await lively.openComponentInWindow('event-drops');
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
  

}

function listify(array, protect) {
  return <ul style="display:block">{...(
      array.map(each => <li style={protect ? "white-space: nowrap" : ""}>{each}</li>)
    )}</ul>
}

function inspectorLink(object) {
  let link = <a>{object && object.toString()}</a>;
  link.onclick = () => lively.openInspector(object);
  return link;
}