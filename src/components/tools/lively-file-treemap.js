"enable aexpr";

import Morph from 'src/components/widgets/lively-morph.js';
import Files from 'src/client/files.js';

export default class LivelyFileTreemap extends Morph  {

  async initialize() {
    this.fileTreemapRenderer = new FileTreemapRenderer();
    this.fileTreemapRenderer.initialize(this.treemapCanvas = this.get("#treemap-canvas"));
    this.fileTreemapRenderer.updateView();
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
    
  }
  
}

import {gloperate, Configuration, initialize as initializeCanvas, Renderer, Visualization} from 'https://lively-kernel.org/lively4/treemap-renderer/dist/treemap-renderer.js';

class FileTreemapRenderer extends gloperate.Initializable {
  
  initialize(htmlCanvasElement) {
    this.canvas = initializeCanvas(htmlCanvasElement);
    this.visualization = new Visualization();
    const renderer = this.visualization.renderer;
    this.canvas.renderer = renderer;

    return true;
  }

  //TODO: this should be called 
  uninitialize() {
    this.canvas.dispose();
    (this.renderer).uninitialize();
  }
  
  
  updateView() {
    this.visualization.update()
  }
  
  
  setData(data) {
    this.config = new Configuration();
    this.config.topology = {};
    this.config.layout = {};
    this.config.buffers = [];
    this.config.bufferViews = [];
    this.config.colors = [];
    this.config.geometry = {};
    this.config.labels = {};
    
    this.visualization.config = this.config;
    this.updateView();
  }
}