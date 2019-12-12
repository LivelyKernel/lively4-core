"enable aexpr";

import Morph from 'src/components/widgets/lively-morph.js';
import {AExprRegistry} from 'src/client/reactive/active-expression/active-expression.js';

const attributes = {
  id : ae => ae.meta().get('id'),
  function : ae => ae.func,
  //lastValue : ae => ""+ae.lastValue,
  currentValue : getValueTag,
  callbacks : ae => ae.callbacks,
  dependencies : ae => ae.supportsDependencies() ? ae.dependencies().all()
    .map(dependencyString)
    .joinElements(()=><br/>) : <font color="red">{"no dependecy api available"}</font>,
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
  return dependency._type +
    Object.keys(descriptor)
      .map(key => '\t'+key+' : '+descriptor[key])
      .join('\n')
}

function colorForHeat(heat) {
  let others = Math.round(256/Math.pow(heat+0.1, 1)).toString(16);
  if(others.length == 1)others = "0"+others;
  return "#FF"+others+others;
}

function coolDown(element) {
  let currentcount = parseFloat(element.getAttribute("heat"));
  let step = 0.1;
  currentcount = currentcount - step;
  element.setAttribute("heat", Math.max(currentcount, 0));
  let newColor = colorForHeat(currentcount+1);
  element.setAttribute("bgcolor", newColor);
  if(currentcount > 0){
    setTimeout(() => {coolDown(element)}, 100);
  } else {
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
  }
  
  initializeCallbacks(){
    AExprRegistry.on('add', (aexpr) => this.addAexpr(aexpr));
    AExprRegistry.on('remove', (aexpr) => this.removeAexpr(aexpr));
    AExprRegistry.on('update', (aexpr) => this.updateAexpr(aexpr));
  }
  
  initializeHeader(){
    let header = <tr></tr>;
    for(let col in attributes)header.appendChild(<td>{col}</td>)
    this.table.appendChild(header);
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

  
  repopulate() {  
    let added = AExprRegistry.allAsArray().difference(this.value);
    let removed = this.value.difference(AExprRegistry.allAsArray());
    for(let each of removed)this.removeAexpr(each);
    for(let each of added)this.addAexpr(each);
  }
  
  addAexpr(aexpr){
      let row = this.createRow(aexpr);
      this.table.appendChild(row);
      this.value.push(aexpr);
  }
  
  removeAexpr(aexpr){
    this.table.removeChild(this.rowOf(aexpr));
    let index = this.value.indexOf(aexpr);
    this.value.splice(index, 1);
  }
  
  updateAexpr(aexpr){
    let row = this.rowOf(aexpr);
    this.setRow(row, aexpr);
    this.igniteRow(row);
  }
  
  igniteRow(row){
    let currentHeat = parseFloat(row.getAttribute("heat"));
    row.setAttribute("heat", currentHeat+1);
    let newColor = colorForHeat(currentHeat+1);
    row.setAttribute("bgcolor", newColor);
    if(currentHeat == 0)coolDown(row);
  }
  
  rowOf(aexpr){
    let index = this.value.indexOf(aexpr);
    return this.table.childNodes.filter(each => each.tagName == 'TR')[index+1];
  }
  
  createRow(aexpr){
    let htmlRow = <tr></tr>;
    htmlRow.setAttribute("heat", 0);
    this.setRow(htmlRow, aexpr);
    return htmlRow;
  }
  
  setRow(row, aexpr){
    while(row.firstChild) {
      row.removeChild(row.firstChild);
    }
    for(let attribute in attributes){
      let value = attributes[attribute](aexpr);
      row.appendChild(<td>{...value}</td>);
    }
  }
  
  clearTable() {
    while (this.table.firstChild)this.table.firstChild.remove();
  }
  
  livelyMigrate(other) {
    
  }
  
  async livelyExample() {
    
  }
  
  
}