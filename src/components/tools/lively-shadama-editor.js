import Morph from 'src/components/widgets/lively-morph.js';

export default class LivelyShadamaEditor extends Morph {
  async initialize() {
    this.windowTitle = "LivelyShadamaEditor";
    this.registerButtons()

    lively.html.registerKeys(this); // automatically installs handler for some methods
    
    this.loaded = this.loadShadama()
    
    if (this.getURL()) {
       this.updateShadama() 
    }
    
  }
  
  
  // this method is autmatically registered through the ``registerKeys`` method
  onKeyDown(evt) {
    if (evt.ctrlKey && evt.key == "s") {
      evt.stopPropagation()
      evt.preventDefault()      
      lively.notify("only update")
    }
  }
  async loadShadama() {
      var baseURL = "https://lively-kernel.org/lively4/shadama/"
  
      window.ohm = (await System.import(baseURL + "thirdparty/ohm.min.js")).default
      await lively.loadJavaScriptThroughDOM("shadamaPapa", baseURL + "thirdparty/papaparse.min.js")
      await lively.loadJavaScriptThroughDOM("shadamaShadama", baseURL + "shadama.js")
      await lively.loadJavaScriptThroughDOM("shadamaTest", baseURL +  "shadama-tests.js")
    
      var editor = await this.get("#code").awaitEditor()
      this.shadama = ShadamaFactory(null, 2, this.shadowRoot, undefined, true, this.shadowRoot, baseURL, editor);
  }
  
  detachedCallback() {
    if (this.shadama) {
      this.shadama.stopped = true // stop animation
    } 
    
  }
  
  
  async updateShadama() {
    await this.loaded
    var livelyEditor = this.get("#code")
    livelyEditor.setURL(this.getURL())
    await livelyEditor.loadFile()
    this.shadama.updateCode()
  }
  
  getURL(url) {
    return this.getAttribute("src")
  }
  
  async setURL(url) {
    this.setAttribute("src", url)
    await this.updateShadama()
  }
  
  
  saveFile() {
    lively.warn("#TODO implement save")
  }

  
  async livelyExample() {
    this.setURL("https://lively-kernel.org/lively4/shadama/examples/1-Fill.shadama")
  }
  
  
}