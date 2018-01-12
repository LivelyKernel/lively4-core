import Morph from 'src/components/widgets/lively-morph.js';

export default class VivideInspector extends Morph {
  async initialize() {
  }
  
  inspect(widget) {
    this.widget = widget;
    this.get("#model-inspector").inspect(widget.raw_model);
    
    if(this.widget.transformations) {
      this.fillFunctionsTableMultiple();
      return;
    }
    
    if(this.widget.transformation) {
      this.fillFunctionsTableSingle(this.widget.transformation);
    }
  }
  
  buildTransformationCell(transformation, number) {
    let transformationTd = document.createElement("td");
    let transformationEditor = document.createElement("juicy-ace-editor");
    
    transformationEditor.value = transformation;
    transformationEditor.doSave = content => {
      if(number === undefined) {
        this.widget.transformation = eval(content);
        this.widget.refresh();
      }
    }
    
    transformationTd.append(number != undefined ? "Transformation #" + number + ":" : "Transformation:");
    transformationTd.append(transformationEditor);
    
    return transformationTd;
  }
  
  buildDepictionCell(depiction, number) {
    let depictionTd = document.createElement("td");
    let depictionEditor = document.createElement("juicy-ace-editor");
    
    depictionEditor.value = depiction;
    depictionEditor.doSave = content => {
      lively.notify(content);
    }
    
    depictionTd.append(number != undefined ? "Depiction #" + number + ":" : "Depiction:");
    depictionTd.append(depictionEditor);
    
    return depictionTd;
  }
  
  fillFunctionsTableSingle(transformation, depiction=undefined, number=undefined) {
    let tr = document.createElement("tr");
    
    tr.append(this.buildTransformationCell(transformation, number));
    
    if(depiction) {
      tr.append(this.buildDepictionCell(depiction, number));
    }

    this.get("#functions-table").append(tr);
  }
  
  fillFunctionsTableMultiple() {
    for(let i=0; i<this.widget.transformations.length; ++i) {
      if(this.widget.depictions.length > i) {
        this.fillFunctionsTableSingle(this.widget.transformations[i], this.widget.depictions[i], i);
      } else {
        this.fillFunctionsTableSingle(this.widget.transformations[i], undefined, i);
      }
    }
  }
  
  livelyExample() {
  }
}