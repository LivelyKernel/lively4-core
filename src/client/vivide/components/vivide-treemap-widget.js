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
  async attachChildrenFromModel(model, treeNode) {
    const getChildLayerOfVivideObject = async (model) => {
      let childLayer = model.childLayer;
      
      if (!childLayer || !childLayer.objects.length) {
        return;
      }

      if (!childLayer.script) {
        return childLayer;
      }
      
      let childData = childLayer.objects.map(c => c.data);
      model.childLayer = await this.expandChild(childData, childLayer.script);
      childLayer = model.childLayer;
      
      return childLayer;
    }
    
    var childLayer = await getChildLayerOfVivideObject(model);

    if(!childLayer || !childLayer.objects || childLayer.objects.length === 0) {
      treeNode.size = 1;
      return;
    }

    return await this.attachAllChildren(childLayer, treeNode);
  }
  async attachAllChildren(vivideLayer, parentNode) {
    for (let child of vivideLayer.objects) {
      await this.attachAChild(child, parentNode);
    }
  }
  async attachAChild(model, parentNode) {
    const label = this.labelForModel(model);
    const childNode = this.createTreeNodeForLabel(label);

    parentNode.children = parentNode.children || [];
    parentNode.children.push(childNode);
    
    return await this.attachChildrenFromModel(model, childNode);
  }
  async display(vivideLayer, config) {
    super.display(vivideLayer, config);
    this.innerHTML = '';
    
    const treeData = this.createTreeNodeForLabel('Top Level');

    await this.attachAllChildren(vivideLayer, treeData);
    
    // console.warn(treeData);
    // const outputWorkspace = document.body.querySelector('#output-dump');
    // if(outputWorkspace) {
    //   outputWorkspace.value = JSON.stringify(treeData, null, 2)
    // }

    this.d3treemap.setTreeData(treeData);
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