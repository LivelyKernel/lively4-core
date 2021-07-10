import * as constants from "../utils/pipelineConstants.js"

export default class PipesAndFiltersUtils {
    
    constructor() {

    }
    //prepares buffer to draw elements into pipe in the desired order
    async preparePipeBufferForDraw(pipeBuffer) {

    if (pipeBuffer.length == 1) {
      return pipeBuffer;
    } 
    
    var resultArray = []
    if (pipeBuffer.length == 2) {
      resultArray[0] = pipeBuffer[1]
      resultArray[1] = pipeBuffer[0]
      return resultArray;
    }
    

    if (pipeBuffer.length == 3) {
      resultArray[0] = pipeBuffer[2]
      resultArray[1] = pipeBuffer[1]
      resultArray[2] = pipeBuffer[0]
      return resultArray.concat(pipeBuffer.slice(3))
    }
    
    if (pipeBuffer.length >= 4) {
      resultArray[0] = pipeBuffer[3]
      resultArray[1] = pipeBuffer[2]
      resultArray[2] = pipeBuffer[1]
      resultArray[3] = pipeBuffer[0]
      return resultArray.concat(pipeBuffer.slice(4))
    }
    
    
    return resultArray;
  }
  
  async drawObjects(component) {
    var counter = 4;
    
    component.view.querySelectorAll('*').forEach(n => n.remove());
    component.buffer.forEach(object => {
      var div = object.drawDiv()
      div.classList.remove("grid1");
      div.classList.remove("grid2");
      div.classList.remove("grid3");
      div.classList.remove("grid4");
      div.classList.add("grid" + counter);
      
      counter -= 1;
      if (counter === 0) {
        counter = 4;
      }
      
      component.view.append(div);
    })
  }
  
  async drawVerticalObjects(component) {
    var counter = 4;
    
    component.view.querySelectorAll('*').forEach(n => n.remove());
    component.buffer.forEach(object => {
      var div = object.drawDiv()
      div.classList.remove("grid-vertical1");
      div.classList.remove("grid-vertical2");
      div.classList.remove("grid-vertical3");
      div.classList.remove("grid-vertical4");
      div.classList.add("grid-vertical" + counter);
      
      counter -= 1;
      if (counter === 0) {
        counter = 4;
      }
      
      component.view.append(div);
    })
  }
  
  async drawFilterObject(filterComponent) {
    var counter = 4;
    
    filterComponent.view.querySelectorAll('*').forEach(n => n.remove());
    filterComponent.buffer.forEach(object => {
      var div = object.drawDiv(true)
      filterComponent.view.append(div);
    })
  }
  
  makeElemetAppearActive() {
    
    // 
  }
  
  
    isInView(element) {
      return true;
    //var slide = lively.queryAll(element, ".lively-slide")
    
    
    /*
    // not working finds always the very first slide 
    if(slide != undefined && slide.style.display != "none") {
      console.log(slide.style.display)
      return true;
    }
    
      // needs to be changed once the lively query works
    return true
    */
  }
}