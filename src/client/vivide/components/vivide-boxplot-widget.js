import Morph from 'src/components/widgets/lively-morph.js';
import MultiSelection from 'src/client/vivide/multiselection.js';
import { uuid, getTempKeyFor, fileName, hintForLabel, asDragImageFor } from 'utils';

function listAsDragImage(labels, evt, offsetX, offsetY) {
  const hints = labels.map(hintForLabel);
  const hintLength = hints.length;
  const maxLength = 5;
  if(hints.length > maxLength) {
    hints.length = maxLength;
    hints.push(hintForLabel(`+ ${hintLength - maxLength} more.`))
  }
  const dragInfo = <div style="width: 151px;">
    {...hints}
  </div>;
  dragInfo::asDragImageFor(evt, -10, 2);
}

export default class VivideBoxplotWidget extends Morph {
  get innerPlot() { return this.get('#d3-boxplot'); }
  get multiSelection() {
    return this._multiSelection = this._multiSelection ||
      new MultiSelection(this.innerPlot, {
        selector: 'g.selectable-group',
        onSelectionChanged: selection => this.selectionChanged(selection),
        keyCodePrev: 37,
        keyCodeNext: 39
      });
  }

  async initialize() {
    this.windowTitle = "VivideBoxplotWidget";
  }

  focus() {}
  
  selectionChanged(selection) {
    lively.success(`selected ${selection.length} item(s)`);
    let viewParent = this.getViewParent();
    if(viewParent) {
      viewParent.selectionChanged();
    }
  }
  
  selectionChanged(selection) {
    lively.warn("SEL CHANGED")
  }
  
  getSelectedData() { return []; }

  display(data, config) {
    this.data = data;
    this.config = config;
    
    let processedData = data.map(d => {
      return [d.label, d.dataPoints];
    });
    
    this.innerPlot.display(processedData, {});
    this.innerPlot.getAllSubmorphs('g.selectable-group').forEach(g => {
      this.multiSelection.addItem(g);
    });
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