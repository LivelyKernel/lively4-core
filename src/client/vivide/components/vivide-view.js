import Morph from 'src/components/widgets/lively-morph.js';

export default class VivideView extends Morph {
  async initialize() {
    this.windowTitle = "VivideView";
    
  }
  
  async setScript(scriptURL) {
    this.scriptURL = scriptURL;
  }
  
  async newDataFromUpstream(data) {
    this.input = data;
    
    if(this.scriptURL) {
      await this.calculateDisplayData();
    } else {
      this.displayedData = this.input;
    }
    
    await this.updateWidget();
  }
  
  async calculateDisplayData() {
    let m = await System.import(this.scriptURL.href);

    this.displayedData = [];
    m.default(this.input, this.displayedData)
  }
  async scriptGotUpdated(urlString) {
    lively.warn(`received script updated`, urlString);
    if(this.scriptURL && this.scriptURL.href === urlString) {
      await this.calculateDisplayData();
      await this.updateWidget();
    }
  }
  
  async updateWidget() {
    let container = this.get('#container');
    container.innerHTML = '';
    let list = await lively.create('vivide-list-widget');
    container.appendChild(list);
    list.display(this.displayedData, {});
  }
}
