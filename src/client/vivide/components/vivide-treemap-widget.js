"enable aexpr";
import VivideWidget from 'src/client/vivide/components/vivide-widget.js';
import { debounce, uuid, getTempKeyFor, fileName, hintForLabel, listAsDragImage, textualRepresentation, wait } from 'utils';

export default class VivideTreemapWidget extends VivideWidget {

  get tree() { return this.get('#tree'); }
  get d3treemap() { return this.get('#d3-treemap'); }
  
  async initialize() {
    this.windowTitle = "VivideTreeWidget";

    this.addEventListener('extent-changed', debounce.call(evt => { this.onExtentChanged(evt); }, 500));
  }
  onExtentChanged(evt) {
    this.d3treemap && this.d3treemap.updateViz && this.d3treemap.updateViz();
  }

  createTreeNodeForLabel(label) {
    return ({
      name: label
    });
  }
  labelForModel(model) {
    return model.properties.get('label') || textualRepresentation(model.object);
  }
  async attachChildrenFromModel(model, treeNode) {
    const childForest = await model.getChildren();

    if(!childForest || childForest.length === 0) {
      treeNode.size = 1;
      return;
    }

    return await this.attachAllChildren(childForest, treeNode);
  }
  async attachAllChildren(forest, parentNode) {
    for (let child of forest) {
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
  async display(forest, config) {
    super.display(forest, config);
    this.innerHTML = '';
    
    const treeData = this.createTreeNodeForLabel('Top Level');

    await this.attachAllChildren(forest, treeData);
    
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
}