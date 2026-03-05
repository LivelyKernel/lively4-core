import Morph from 'src/components/widgets/lively-morph.js';
import { Panning, Zooming } from 'src/client/html.js';
import ContextMenu from 'src/client/contextmenu.js'

export default class LivelyArchitectureViewer extends Morph {
  async initialize() {
    this.windowTitle = "Architecture Viewer";
    this._pane = this.get('#pane');
    this._diagram = this._diagram || await this.ensureDiagram();
    this.enablePanAndZoom();
    
    this.addEventListener('contextmenu',  evt => this.onContextMenu(evt), false);
  }
  
  async ensureDiagram() {
    let diagram = this.querySelector('lively-class-diagram');
    if (!diagram) {
      diagram = await lively.create('lively-class-diagram');
      this.appendChild(diagram);
    }
    return diagram;
  }
  
  enablePanAndZoom() {
    if (!this._diagram || !this._pane) return;
    
    this._panning = new Panning(this._pane);
    this._zooming = new Zooming(this._diagram, {
      listenOn: this,
      minZoom: 0.1,
      maxZoom: 10.0,
      zoomStep: 0.4
    });
  }
  
  async fromDiagram(sourceDiagram) {
    if (!sourceDiagram || !this._diagram) return;
    
    this._diagram._mermaidSource = [...(sourceDiagram._mermaidSource || [])];
    this._diagram._modules = new Set(sourceDiagram._modules || []);
    this._diagram._classUrls = new Map(sourceDiagram._classUrls || []);
    this._diagram._methodData = new Map(sourceDiagram._methodData || []);
    this._diagram._operations = [...(sourceDiagram._operations || [])];
    this._diagram._collapsedClasses = new Set(sourceDiagram._collapsedClasses || []);
    this._diagram._look = sourceDiagram._look || 'handDrawn';
    
    if (sourceDiagram._mermaid) {
      this._diagram._mermaid = sourceDiagram._mermaid;
    }
    
    await this._diagram.render();
  }
  
  async addModule(url) {
    if (this._diagram) await this._diagram.addModule(url);
  }
  
  async addPath(path) {
    if (this._diagram) await this._diagram.addPath(path);
  }
  
  async addURL(url) {
    if (this._diagram) await this._diagram.addURL(url);
  }
  
  appendMermaid(source) {
    if (this._diagram) this._diagram.appendMermaid(source);
  }
  
  clear() {
    if (this._diagram) this._diagram.clear();
    this.resetView();
  }
  
  resetView() {
    if (this._zooming) this._zooming.resetZoom();
    if (this._pane) {
      this._pane.scrollLeft = 0;
      this._pane.scrollTop = 0;
    }
  }
  
  get diagram() {
    return this._diagram;
  }
  
  onContextMenu(evt) {
    let menuItems = [
      ["Do nothing", () => lively.notify("nothing")]
    ];

    const menu = new ContextMenu(this, menuItems);
    menu.openIn(document.body, evt, this);
  }
  
  disconnectedCallback() {
    if (this._panning?.destroy) this._panning.destroy();
    if (this._zooming?.destroy) this._zooming.destroy();
    lively.removeEventListener("ArchitectureViewerContextMenu", this);
  }
  
  livelyMigrate(other) {
    this._pane = this.get('#pane');
    this._diagram = this.querySelector('lively-class-diagram');
    this._panning = other._panning;
    this._zooming = other._zooming;
  }
  
  async livelyExample() {
    await this.ensureDiagram();
    await this.addPath('src/components/literature/');
  }
}
