"enable aexpr";

import Morph from 'src/components/widgets/lively-morph.js';
import Files from "src/client/files.js";

export default class LivelyFileTreemap extends Morph  {

  async initialize() {
    this.updateView();
  }
  
  async ensureData() {
    if (this.data) return
    this.data =  await Files.fileTree("src");
  
  }
  
  async updateView() {
    /*await this.ensureData();
    this.treemap = await (<d3-treemap></d3-treemap>);
    var pane = this.get("#pane");
    pane.innerHTML = "";
    pane.appendChild(this.treemap);
    this.treemap.setTreeData(this.data);*/
    
    this.treemapViewer = await (<lively-iframe></lively-iframe>);
    var treemapViewerPane = this.get("#treemap-viewer-pane");
    treemapViewerPane.innerHTML = "";
    treemapViewerPane.appendChild(this.treemapViewer);
    this.treemapViewer.setURL("https://youtube.com");
  }
  
}