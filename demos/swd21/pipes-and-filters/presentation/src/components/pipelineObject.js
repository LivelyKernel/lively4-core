import * as constants from "../utils/pipelineConstants.js"

export default class PipelineObject {
  
  constructor(clickListener = null) {
    this.type = this.getRandomType();
    this.color = this.getRandomColor(this.type);
    
    this.clickListener = clickListener;
  }
  
  drawDiv(isLarge = false) {
    var div = <div></div>
    var isLargeSuffix = ""
    if (isLarge) {
      isLargeSuffix = "-large"
    }
    div.setAttribute("class", `${this.type + isLargeSuffix} ${this.color + ((this.type === constants.Type.TRIANGLE) ? isLargeSuffix : "")}`)
    
    if (this.clickListener !== null) {
      div.addEventListener("click", () => {
        this.clickListener(this);
      });
    }
    
    return div
  }
  
  setType(type) {
    this.type = type
  }
  
  setColor(color, type) {
    color = color.split('-').slice(0, 2).join('-');
    this.color = this.getColor(color, type)
  }
  
  getColor(color, type) {
    var suffix = ""
    if (type === constants.Type.TRIANGLE) {
      suffix = "-triangle"
      
    }
    return color + suffix
  }
  
  getRandomType() {
    switch (this.getRandomInt(3)){
      case 0:
        return constants.Type.CIRCLE;
      case 1:
        return constants.Type.SQUARE;
      case 2:
        return constants.Type.TRIANGLE;
    }
  }
  
  getRandomColor(type) {
    var suffix = ""
    if (type === constants.Type.TRIANGLE) {
      suffix = "-triangle"
      
    }
    switch (this.getRandomInt(4)){
      case 0:
        return constants.Color.RED + suffix;
      case 1:
        return constants.Color.BLUE + suffix;
      case 2:
        return constants.Color.YELLOW + suffix;
      case 3:
        return constants.Color.GREEN + suffix;
    }
  }
      
  getRandomInt(max) {
    return Math.floor(Math.random() * max);
  }
  
}