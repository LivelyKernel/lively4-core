"enable aexpr";

import Morph from 'src/components/widgets/lively-morph.js';
import Files from 'src/client/files.js';

export default class LivelyFileTreemap extends Morph  {

  async initialize() {
    this.fileTreemapRenderer = new FileTreemapRenderer();
    this.fileTreemapRenderer.initialize(this.treemapCanvas = this.get("#treemap-canvas"));
    this.fileTreemapRenderer.setData();
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
  
  
  setData(data = undefined) {
    this.config = new Configuration();
    this.config.topology = {edges: [[0, 1], [1, 2], [1, 3], [1, 4], [0, 5]], format: "tupled"};
    this.config.layout = {algorithm: "strip", weight: "bufferView:weights"};
    this.config.buffers = [{identifier: "source-weights", type: "numbers", data: [ 0.0, 0.0, 1.0, 2.0, 1.0 ], encoding: "native"}];
    this.config.bufferViews = [{identifier: "weights", source: "buffer:source-weights", transformations: [{ type: "fill-invalid", value: 0.0, invalidValue: -1.0 }, { type: "propagate-up", operation: "sum" }]}];
    this.config.colors = [
    {
      identifier: "emphasis",
      colorspace: "hex",
      value: "#00b0ff"
    },
    {
      identifier: "auxiliary",
      colorspace: "hex",
      values: [
        "#00aa5e",
        "#71237c"
      ]
    },
    {
      identifier: "inner",
      colorspace: "hex",
      values: [
        "#e8eaee",
        "#eef0f4"
      ]
    },
    {
      identifier: "leaf",
      preset: "Oranges",
      steps: 7
    }];
    this.config.geometry = {parentLayer: {showRoot: false}};
    this.config.labels = {};
    
    this.visualization.config = this.config;
    this.updateView();
  }
}