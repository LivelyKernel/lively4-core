"enable aexpr";
import { debounce } from "utils";

import Morph from 'src/components/widgets/lively-morph.js';
import VivideMultiSelectionWidget from 'src/client/vivide/components/vivide-multi-selection-widget.js';
import MultiSelection from 'src/client/vivide/multiselection.js';
import { uuid, getTempKeyFor, fileName, hintForLabel, listAsDragImage, textualRepresentation, wait } from 'utils';

export default class VivideTreemapWidget extends VivideMultiSelectionWidget {
  get multiSelectionConfig() {
    return [this, {
      onSelectionChanged: selection => this.selectionChanged(selection)
    }];
  }
  
  get tree() { return this.get('#tree'); }
  get d3treemap() { return this.get('#d3-treemap'); }
  
  async initialize() {
    this.windowTitle = "VivideTreeWidget";
    // Callback set in the view
    this.expandChild = null;
    this.addEventListener('extent-changed', ((evt) => { this.onExtentChanged(evt); })::debounce(500));
  }
  onExtentChanged(evt) {
    this.d3treemap && this.d3treemap.updateViz && this.d3treemap.updateViz();
  }
  dataForDOMNode(treeItem) {
    return this.dataByTreeItem.get(treeItem);
  }

  createTreeNodeForLabel(label) {
    return ({
      name: label
    });
  }
  labelForModel(model) {
    const label = model.properties
      .map(prop => prop.label)
      .find(label => label) || textualRepresentation(model.object);
    return label;
  }
  async attachChildren(model, treeNode) {
    const getChildrenOfVivideObject = async (model) => {
      let childLayer = model.childLayer;
      
      if (!childLayer || !childLayer.objects.length) {
        return;
      }

      if (!childLayer.script) {
        return;
      }
      
      let childData = childLayer.objects.map(c => c.data);
      model.childLayer = await this.expandChild(childData, childLayer.script);
      childLayer = model.childLayer;
      
      return childLayer;
    }
    
    var childLayer = await getChildrenOfVivideObject(model);

    if(!childLayer || !childLayer.objects || childLayer.objects.length === 0) {
      treeNode.size = 1;
      return;
    }

    treeNode.children = treeNode.children || [];
    for (let child of childLayer.objects) {

      const label = this.labelForModel(child);
      const childNode = this.createTreeNodeForLabel(label);
      treeNode.children.push(childNode);
      await this.attachChildren(child, childNode);
    }
  }
  async display(vivideLayer, config) {
    super.display(vivideLayer, config);
    this.innerHTML = '';
    
    this.treeData = this.createTreeNodeForLabel('Top Level');

    for(var m of vivideLayer.objects) {
      await this.attachChildren(m, this.treeData);
    }
    
    console.warn(this.treeData);
    const outputWorkspace = document.body.querySelector('#output-dump');
    if(outputWorkspace) {
      outputWorkspace.value = JSON.stringify(this.treeData, null, 2)
    }

    let widget = this.d3treemap;
    widget.setTreeData(this.treeData);
  }
  
  livelyExample() {
    // Displaying a vivide tree widget is only meaningful in a vivide view
  }
  
  livelyMigrate(other) {
    lively.warn('MIGRATE')
    this.expandChild = other.expandChild;
    super.display(other);
  }
}