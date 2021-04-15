
import Morph from 'src/components/widgets/lively-morph.js';

export default class ExternalResource extends Morph {
  async initialize() {
 
    this.updateView()
    this.registerButtons()
  }
  
  
  get src() {
    return this.getAttribute("src")
  }

  set src(url) {
    this.setAttribute("src", url)
    this.updateView()
  }

  get importURL() {
    return this.getAttribute("import-url")
  }

  set importURL(url) {
    this.setAttribute("import-url", url)
    this.updateView()
  }

  async onImport() {
    if (!this.src) throw new Error('src url missing')
    if(!this.importURL) throw new Error('import url missing')
    await lively.files.copyURLtoURL(this.src, this.importURL)
    lively.notify("imported", this.importURL, undefined, () => {
      lively.openBrowser(this.importURL)
    })
    this.get("#open").hidden = false
  }
  
  async onOpen() {
    lively.openBrowser(this.importURL)
  }
  
  async updateView() {
    var frame = this.get('lively-iframe')
    frame.setURL(this.src) 
    frame.hideMenubar()
    if (this.importURL == null) {
      this.get("#import").hidden = true
    } else {
      this.get("#import").hidden = false
    }      
    this.get("#open").hidden = true
    if (this.importURL && await lively.files.existFile(this.importURL)) {
      this.get("#open").hidden = false  
    }

  }
  
 
  async livelyExample() {
    this.importURL = "http://localhost:9005/Dropbox/Thesis/Literature/_misc/LatozaTest.pdf"
    this.src = "https://www.st.cs.uni-saarland.de/edu/empirical-se/2006/PDFs/latoza06.pdf"
  }
  
  
}