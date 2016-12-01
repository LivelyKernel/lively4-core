'use strict';

import Morph from './Morph.js';
import "src/external/pdf.js"

export default class LivelyPDF extends Morph {

  initialize() {
    this.zoom = 7;

    if (this.getAttribute("src")) {
      this.setURL(this.getAttribute("src"));
    }
    
    if (this.getAttribute("overflow")) {
      this.get("#container").style.overflow = this.getAttribute("overflow")
    }
    
    this.addEventListener("keydown", e => this.onKeyDown(e));
    this.setAttribute("tabindex", 0);	
  }

  async setURL(url) {
    this.pdf = await PDFJS.getDocument(url);
    this.gotoPage(1);
  }

  async gotoPage(n) {
    if (n <= 0) return; // do nothing
    if (n > this.pdf.pdfInfo.numPages) return; // do nothing

    this.currentPage = n
  	this.page = await this.pdf.getPage(this.currentPage)
  	this.render()
    return this.page
  }
  
  async nextPage() {
    await this.gotoPage(this.currentPage + 1)
  }
  
  async prevPage() {
    await this.gotoPage(this.currentPage - 1)
  }
  
  get zoomLevels() {
    return [0.25, 0.33, 0.5, 0.67, 0.75, 0.8, 0.9, 1.0, 1.1, 1.25, 1.5, 1.75, 2, 3, 4, 5]
  }
  
  set zoom(n) {
    // ensure bounds...
    n = parseInt(n)
    n = Math.max(0, n)
    n = Math.min(this.zoomLevels.length, n)
    this.scale = this.zoomLevels[n]
    this.zoomLevel = n    
  }
  
  get zoom() {
    return this.zoomLevel
  }
  
  zoomOut() {
    this.zoom -= 1
    return this.render()
  }
  zoomIn() {
    this.zoom += 1
    return this.render()
  }

  render() {
    
    if (!this.page) {
      this.get("#log").textContent = "no page, could not render"
      return// cannot render
    } else {
      this.get("#log").textContent = ""
    }
     
    var viewport = this.page.getViewport(this.scale);

    var canvas = this.get('#canvas');
    var context = canvas.getContext('2d');
    canvas.height = viewport.height;
    canvas.width = viewport.width;
    
    var renderContext = {
      canvasContext: context,
      viewport: viewport
    };
    this.page.render(renderContext);
  }

  onKeyDown(evt) {
    // lively.notify("key " + evt.keyCode)
    if (evt.ctrlKey && evt.keyCode == '187') { // "+"
      this.zoomIn()
    }

    if (evt.ctrlKey && evt.keyCode == '189' ) { // "-"
      this.zoomOut()
    }

    if (evt.keyCode == '38') { 
      // up arrow
  
    }
    else if (evt.keyCode == '40') {
        // down arrow
        
        
    }
    else if (evt.keyCode == '37') {
       // left arrow
       this.prevPage()
    }
    else if (evt.keyCode == '39') {
       // right arrow
       this.nextPage()
    }
    
    evt.stopPropagation()
    evt.preventDefault()
  }


}
