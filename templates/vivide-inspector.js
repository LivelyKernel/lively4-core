import Morph from 'src/components/widgets/lively-morph.js';

export default class VivideInspector extends Morph {
  async initialize() {
  }
  
  inspect(widget) {
    this.get("#model-inspector").inspect(widget.raw_model);
    
    if(widget.transformations) {
      this.fillFunctionsTableMultiple(widget);
      return;
    }
    
    if(widget.transformation) {
      this.fillFunctionsTableSingle(widget.transformation, undefined);
    }
  }
  
  fillFunctionsTableSingle(transformation, depiction) {
    let tr = document.createElement("tr");
    let transformationTd = document.createElement("td");
    let transformationEditor = document.createElement("juicy-ace-editor");
    
    transformationEditor.value = transformation;
    transformationTd.append(transformationEditor);
    tr.append(transformationTd);
    
    if(!depiction) {
      this.get("#functions-table").append(tr);
      return;
    }
    
    let depictionTd = document.createElement("td");
    let depictionEditor = document.createElement("juicy-ace-editor");
    depictionEditor.value = depiction;
    depictionTd.append(depictionEditor);
    tr.append(depictionTd);

    this.get("#functions-table").append(tr);
  }
  
  fillFunctionsTableMultiple(widget) {
    for(let i=0; i<widget.transformations.length; ++i) {
      if(widget.depictions.length > i) {
        this.fillFunctionsTableSingle(widget.transformations[i], widget.depictions[i]);
      } else {
        this.fillFunctionsTableSingle(widget.transformations[i], undefined);
      }
    }
  }
  
  livelyExample() {
  }
}