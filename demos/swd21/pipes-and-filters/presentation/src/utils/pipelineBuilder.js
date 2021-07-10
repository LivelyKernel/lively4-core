export default class PipelineBuilder {
  
  constructor(context) {
    this.context = context;
    this.runAnimation = false;
  }
  
  onlyShowSpecificElements(elementsList) {
    console.log(elementsList)
    var divElement = lively.query(this.context, "div.lively-content")
    var allElements = lively.queryAll(divElement, "*")
    
    allElements.forEach(elem => {
      console.log(elem.id)

      !elementsList.includes(elem.id) ? elem.style.opacity = "0.5" : true;
      
       
    })  
  }
  
  async animatePipelineBuild(elementsList, ms) {
    var buttons = <div></div>;
    var btnStop = <button click={async event => {
        this.runAnimation = false;
      }}>stop</button>;
    var btnStart = <button click={async event => {
        this.runAnimation = !this.runAnimation;
        var divElement = lively.query(this.context, "div.lively-content");
        var allElements = lively.queryAll(divElement, "*");

        while (this.runAnimation /*&& lively.isInBody(this.context)*/) {
          allElements.forEach(async elem => {
            !elementsList.includes(elem.id) ? elem.style.display = "none" : true
            await this.sleep(ms)
          })
        }
      }}>start</button>;
    buttons.append(btnStart);
    buttons.append(btnStop);
    return buttons;
  }
  
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  
}