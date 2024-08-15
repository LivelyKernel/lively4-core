import Morph from 'src/components/widgets/lively-morph.js';
export default class LivelyIFrame extends Morph {
  get input() {
    return this.get("#input");
  }

  get frame() {
    return this.get("#frame");
  }

  async initialize() {
    this.windowTitle = "iFrame Browser";
    this.input.onchange = () => this.update();
    lively.html.registerButtons(this)
    
    if (this.getAttribute("src")) {
      this.setURL(this.getAttribute("src"));
    }
  }

  update() {
    const url = this.input.value;
    this.updatePersistence(url);
    this.updateFrame(url);
  }

  updateFrame(url) {
    this.frame.src = url;
  }

  updatePersistence(url) {
    this.setAttribute("src", url);
  }

  getURL() {
    return this.getAttribute("src");
  }

  setURL(url) {
    this.input.value = url;
    this.updatePersistence(url);
    this.updateFrame(url);
  }

  hideMenubar() {
    this.get("#menubar").hidden = true;
  }

  showMenubar() {
    this.get("#menubar").hidden = false;
  }

  onUpdateButton() {
    this.update()
  }

  livelyMigrate(other) {
    this.setURL(other.getURL());
  }

  livelyExample() {
    this.setURL('//lively-kernel.org/')
  }

}
