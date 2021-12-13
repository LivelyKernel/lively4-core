
import GraphNode from './graph-node.js';
import ILANodeExtension from './ila-node-extension.js'
import {allLayersFor, PartialLayerComposition} from 'src/client/ContextJS/src/Layers.js'
export default class LayeredFunctionNode extends GraphNode {  
  constructor(layeredObject, fnName, graph) {
    super(graph);
    this.nodeOptions.style = "solid";
    this.nodeOptions.colorscheme = "pastel19" 
    this.nodeOptions.fillcolor = 6;
    this.fnName = fnName;
    this.rounded = true;
    this.layeredObject = layeredObject;
    this.htmlLabel = true;
  }
  
  replaceNode(other) {
    other.ins.forEach(edge => edge.to = this);
    this.ins.push(...other.ins);
    other.outs.forEach(edge => edge.from = this);
    this.outs.push(...other.outs);
    this.events.push(...other.events);
    other.dependencies.forEach(dep => this.dependencies.add(dep));
  }
    
  extractFunctions() {
    const composition = new PartialLayerComposition(this.layeredObject, this.fnName);
    const functions = [];
    for(let i = 1; i < composition.partialMethods.length; i++) {
      functions.push({partialMethod: composition.partialMethods[i], layer: composition.layers[i]});
    }
    allLayersFor(this.layeredObject, this.fnName).forEach(l => {
      if(!functions.some(f => f.partialMethod === l.partialMethod && f.layer === l.layer)) {
        functions.push(l);
      }
    });
    functions.push({partialMethod: this.layeredObject[this.fnName].originalFunction});
    
    return functions;
  }
  
  getLocations() {
    const functions = this.extractFunctions();
    return functions.map(({partialMethod}) => partialMethod.location).filter(l => l);    
  }
    
  getInfo() {
    const data = [];
    data.push("layered function: " + this.fnName);
    const functions = this.extractFunctions();
    for(const {partialMethod, layer} of functions) {
      if(layer && !this.graph.layeredFunctionRefined(layer, this.layeredObject, this.fnName)) {
        continue;
      }
      let name = "original";
      let color = "black";
      if(layer) {
        name = layer.name;
        if(!this.graph.layerActive(layer)) {
          color = "gray";
        }
      }
      let content =  partialMethod.code || partialMethod.toString(); //toString();
      content = this.escapeTextForDOTHTMLLabel(content);
      content = content.replaceAll("proceed", "<U><I>proceed</I></U>");
      const line = "<B>" + name + ":</B>\n"  + content;
      data.push({PORT: name.replace(/\s/g, ''), FONT: {COLOR:color}, ISCODE: true, text: line});
    }
    return data;
  }
}