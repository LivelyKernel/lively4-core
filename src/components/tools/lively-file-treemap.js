"enable aexpr";

import Morph from 'src/components/widgets/lively-morph.js';
import Files from 'src/client/files.js';

export default class LivelyFileTreemap extends Morph  {

  async initialize() {
    this.fileTreemapRenderer = new FileTreemapRenderer();
    this.fileTreemapRenderer.initialize(this.treemapCanvas = this.get("#treemap-canvas"));
    
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
    
    
    
  }
  
}

import {gloperate, Configuration, initialize, Renderer, Visualization} from 'https://lively-kernel.org/lively4/treemap-renderer/dist/treemap-renderer.js';

class FileTreemapRenderer extends gloperate.Initializable {
  
  initialize(element: HTMLCanvasElement | string): boolean {
      this._canvas = initialize(element);
      this._visualization = new Visualization();
      const renderer: Renderer = this._visualization.renderer as Renderer;
      this._canvas.renderer = renderer;

      super.expose();

      return true;
    }

    //TODO: this should be called 
    uninitialize(): void {
      this._canvas.dispose();
      (this._renderer as gloperate.Renderer).uninitialize();
    }
    
    
  
}