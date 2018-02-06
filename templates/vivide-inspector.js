import Morph from 'src/components/widgets/lively-morph.js';

export default class VivideInspector extends Morph {
  async initialize() {
    this.windowTitle = "VivideInspector";
  }
  
  async inspect(widget) {
    this.widget = widget;
    this.get("#model-inspector").inspect(widget.raw_model);
    
    if(this.widget.transformations) {
       await this.fillFunctionsTableMultiple();
      return;
    }
    
    if(this.widget.transformation) {
      await this.fillFunctionsTableSingle(this.widget.transformation, this.widget.depiction);
    }
  }
  
  async buildTransformationCell(transformation, number) {
    let transformationDiv = document.createElement("div");
    transformationDiv.classList.add("transformation");
    let transformationEditor = await lively.create("lively-code-mirror");
    
    transformationEditor.value = transformation.toString().replace(/  +/g, '');
    transformationEditor.doSave = content => {
      if(number === undefined) {
        this.widget.setTransformation(eval(content));
      } else {
        this.widget.setTransformation(number, eval(content));
      }
    }
    
    transformationDiv.append(number != undefined ? "Transformation #" + number + ":" : "Transformation:");
    transformationDiv.append(transformationEditor);
    
    return transformationDiv;
  }
  
   async buildDepictionCell(depiction, number) {
    let depictionDiv = document.createElement("div");
    depictionDiv.classList.add("depiction");
    let depictionEditor = await lively.create("lively-code-mirror");
    
    depictionEditor.value = depiction.toString().replace(/  +/g, '');
    depictionEditor.doSave = content => {
      if(number === undefined) {
        this.widget.setDepiction(eval(content));
      } else {
        this.widget.setDepiction(number, eval(content));
      }
    }
    
    depictionDiv.append(number != undefined ? "Projection #" + number + ":" : "Projection:");
    depictionDiv.append(depictionEditor);
    
    return depictionDiv;
  }
  
  async fillFunctionsTableSingle(transformation, depiction, number=undefined) {
    this.get("#functions").append(
      await this.buildTransformationCell(transformation, number)
    );
    
    if(depiction) {
      this.get("#functions").append(
        await this.buildDepictionCell(depiction, number)
      );
    }
  }
  
  async fillFunctionsTableMultiple() {
    for(let i=0; i<this.widget.transformations.length; ++i) {
      await this.fillFunctionsTableSingle(this.widget.getTransformation(i), this.widget.getDepiction(i), i);
    }
  }
  
  livelyExample() {
  }
}