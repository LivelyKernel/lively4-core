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
      
      /*
      if (object.clickListener != null) {
        div.addEventListener("click", object.clickListener(object.type, object.color))
      }
      */
      
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
  
  async drawPassiveFilterObject(filterComponent) {
    var counter = 4;
    
    filterComponent.view.querySelectorAll('*').forEach(n => n.remove());
    filterComponent.bufferInput.forEach(object => {
      var div = object.drawDiv(true)
      filterComponent.view.append(div);
    })
  }
  
  makeElemetAppearActive() {
    
    // 
  }
  
  isInView(element) {
    //return true
    
    if (element === undefined) {
      return false;
    } else {
      var slide = lively.query(element, ".logo").parentElement;
      return (slide != undefined && slide.style.display === "block");
    }
  }
  
  setLabels(labelContainer, labels) {
    let leftView = lively.query(labelContainer, ".label-left span");
    let topView = lively.query(labelContainer, ".label-top span");
    let rightView = lively.query(labelContainer, ".label-right span");
    let bottomView = lively.query(labelContainer, ".label-bottom span");
    leftView.innerText = labels.left;
    topView.innerText = labels.top;
    rightView.innerText = labels.right;
    bottomView.innerText = labels.bottom;
  }
  
  setPipeLabels(labelContainer, labels) {
    let topView = lively.query(labelContainer, ".label-top-pipe span");
    let bottomView = lively.query(labelContainer, ".label-bottom-pipe span");
    topView.innerText = labels.top;
    bottomView.innerText = labels.bottom;
  }
  
  setPipeVerticalLabels(labelContainer, labels) {
    let leftView = lively.query(labelContainer, ".label-left-pipe span");
    let rightView = lively.query(labelContainer, ".label-right-pipe span");
    leftView.innerText = labels.left;
    rightView.innerText = labels.right;
  }
  
  async animateFilter(filter, ms, halfAnimationCallback) {
    let msHalf = ms / 2;
    let top = filter.progress.style.top;
    let left = filter.progress.style.left;
    
    var color = "green"
    if (filter.view.style.border.includes("orange")) {
      color = "orange"
    } 
  
    let transition = "transition: width " + (msHalf / 1000) + "s ease-in-out;";
    filter.progress.style.backgroundColor = color
    filter.progress.setAttribute("style", transition);
    filter.progress.style.width = "100px";
    filter.progress.style.top = top;
    filter.progress.style.left = left;
    halfAnimationCallback()
    filter.progress.style.backgroundColor = color
    await this.sleep(msHalf);
    filter.progress.style.width = "0px";
    filter.progress.style.top = top;
    filter.progress.style.left = left;
    await this.sleep(msHalf);
    filter.progress.style.transition = null;
  }
  
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}