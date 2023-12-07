import Morph from 'src/components/widgets/lively-morph.js';

export default class LivelyShadamaEditor extends Morph {
  async initialize() {
    this.windowTitle = "LivelyShadamaEditor";
    this.registerButtons()

    lively.html.registerKeys(this); // automatically installs handler for some methods
    
    await this.livelyEditor.awaitEditor()
    
    this.livelyEditor.addEventListener("loaded-file", evt => this.onFileLoaded(evt))
    this.loaded = this.loadShadama()
    if (this.getURL()) {
       this.updateShadama() 
    }
  }
  
  onFullscreen() {
     this.shadama.goFullScreen()
  }

  // this method is autmatically registered through the ``registerKeys`` method
  onKeyDown(evt) {
    if (evt.ctrlKey && evt.key == "s") {
      evt.stopPropagation()
      evt.preventDefault()
      
      this.livelyEditor.saveFile()
    }
  }
  
  async onFileLoaded(evt) {
    var cm = await this.livelyEditor.awaitEditor()
    cm.setOption("mode", "text/shadama");
    if (!this.shadama) return // not finished initialization yet... hope it comes again! 
    this.shadama.initEnv(() => {
      this.shadama.setRootURL(this.getURL())
      this.shadama.updateCode()
    })
  }
  
  
  async loadShadama() {
      var baseURL = "https://lively-kernel.org/lively4/shadama/"
  
      window.ohm = (await System.import(baseURL + "thirdparty/ohm.min.js")).default
      await lively.loadJavaScriptThroughDOM("shadamaPapa", baseURL + "thirdparty/papaparse.min.js")
      await lively.loadJavaScriptThroughDOM("shadamaShadama", baseURL + "shadama.js") /* globals ShadamaFactory */
      await lively.loadJavaScriptThroughDOM("shadamaTest", baseURL +  "shadama-tests.js")
      var editor = await this.get("#code").awaitEditor()
      var rootURL = this.getURL() || baseURL
      this.shadama = ShadamaFactory(null, 2, this.shadowRoot, undefined, true, this.shadowRoot, rootURL, editor);
  }
  
  disconnectedCallback() {
    if (this.shadama) {
      this.shadama.stopped = true // stop animation
    } 
    
  }
  
  get livelyEditor() {
    return this.get("#code")
  }
  
  
  async updateShadama() {
    await this.loaded
    this.livelyEditor.setURL(this.getURL())
    await this.livelyEditor.loadFile()
  }
  
  getURL() {
    return this.getAttribute("src")
  }
  
  async setURL(url) {
    this.setAttribute("src", url)
    await this.updateShadama()
  }

  /*MD # Editor API MD*/
  saveFile() {
    lively.warn("#TODO implement save")
  }

  awaitEditor() {
    return this.livelyEditor.awaitEditor()
  }
  
  hideToolbar() {
    return this.livelyEditor.hideToolbar()
  }
  
  livelyCodeMirror() {
    return this.livelyEditor.livelyCodeMirror()
  }
  
  toggleVersions() {
    return this.livelyEditor.toggleVersions()
  }
  
  setText(t) {
    return this.livelyEditor.setText(t)
  }
  
  getText() {
    return this.livelyEditor.getText()
  }
  
  
  

  async livelyExample() {
    // this.setURL("https://lively-kernel.org/lively4/shadama/examples/1-Fill.shadama")
    this.setURL("https://lively-kernel.org/lively4/shadama/examples/9-Mandelbrot.shadama")
  }
  
  
}