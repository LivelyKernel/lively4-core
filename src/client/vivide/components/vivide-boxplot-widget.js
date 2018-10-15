import VivideWidget from 'src/client/vivide/components/vivide-widget.js';
import MultiSelection from 'src/client/vivide/multiselection.js';
import { uuid, getTempKeyFor, fileName, hintForLabel, listAsDragImage, textualRepresentation } from 'utils';
import Annotations from 'src/client/reactive/utils/annotations.js';

export default class VivideBoxplotWidget extends VivideWidget {
  get multiSelectionConfig() {
    return [this.innerPlot, {
      selector: 'g.selectable-group',
      onSelectionChanged: selection => this.selectionChanged(selection),
      keyCodePrev: 37,
      keyCodeNext: 39
    }];
  }

  getObjectForSelectedNode(group) {
    return group.__vivideObjectAccessor__;
  }

  focus() {
    this.multiSelection.focus();
  }

  get innerPlot() { return this.get('#d3-boxplot'); }

  async initialize() {
    this.windowTitle = "VivideBoxplotWidget";
  }


  display(forest, config) {
    super.display(forest, config);

    let preparedData = forest.map(m => {
      let label = m.properties.get('label') || textualRepresentation(m.object);
      let dataPoints = m.properties.get('dataPoints') || [];

      if(!dataPoints) {
        lively.error('No dataPoints property given for ' + label);
      }

      return {
        label,
        dataPoints,
        __vivideObjectAccessor__: m.object
      }
    })

    this.innerPlot.display(preparedData, config.squash());
    let groups = this.innerPlot.getAllSubmorphs('g.selectable-group');
    groups.forEach(g => this.multiSelection.addItem(g));
    groups.forEach(g => this.addDragEventTo(g));
  }

  livelyExample() {
    this.display([{
      dataPoints: [1,2,1,2,3,4],
      label: "hello"
    }, {
      dataPoints: [2,3,4,5,4,3,4,5,4,3,2,3,4,5],
      label: "world"
    }], new Annotations());
  }
}
