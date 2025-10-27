"enable aexpr";

//import Morph from 'src/components/widgets/lively-morph.js';
import LivelyD3Treemap from 'src/components/d3/d3-treemap.js';
import Files from "src/client/files.js";

export default class LivelyFileTreemap extends LivelyD3Treemap {

  async initialize() {
    const fileData = await Files.fileTree("src");
    this.setTreeData(fileData);
    //super.windowTitle = "LivelyFileTreemap";
    //super.updateViz();

  }
  
  async livelyExample() {
    lively.notify("setting example prevented");
  }
  
}