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
}