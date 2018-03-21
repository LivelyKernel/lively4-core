import Morph from 'src/components/widgets/lively-morph.js';
import MultiSelection from 'src/client/vivide/multiselection.js';
import { uuid, getTempKeyFor, fileName, hintForLabel, asDragImageFor } from 'utils';

export default class VivideBoxplotWidget extends Morph {
  get innerPlot() { return this.get('#d3-boxplot'); }

  async initialize() {
    this.windowTitle = "VivideBoxplotWidget";
  }

  focus() {}
  
  selectionChanged(selection) {}
  
  getSelectedData() { return []; }

  display(data, config) {
    this.data = data;
    this.config = config;
    
    let processedData = data.map(d => {
      return [d.label, d.dataPoints];
    });
    
    this.innerPlot.display(processedData, {});
  }
  
  livelyExample() {
    this.display([{
      dataPoints: [1,2,1,2,3,4],
      label: "hello"
    }, {
      dataPoints: [2,3,4,5,4,3,4,5,4,3,2,3,4,5],
      label: "world"
    }], {});
  }
  
  livelyMigrate(other) {
    this.display(other.data, other.config);
  }
}