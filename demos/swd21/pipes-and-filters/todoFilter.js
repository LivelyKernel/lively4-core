import BufferPipeMock from "./bufferPipe.js"
import Filter2 from "./filter2.js"

export default class TodoFilter {
  
  constructor() {
    
  }
  
  // url = data source
  async render(url) {
    var source = await fetch(url).then(r => r.text())
    
    var filteredContent = <div>Open: {
        //filter1(filter2(filter3(..source)))
        ...source
        .split("\n")
        .filter(this.filterXY)
        .filter(item => item.match(/^- \[[ ]\] /))
        .length
      } | TODO: {
        ...source
        .split("\n")
        .filter(this.filterXY)
        .filter(item => item.match(/^- \[[x]\] /))
        .length
      }
    </div>;
    var someMockPipe = new BufferPipeMock();
    
    someMockPipe.push(filteredContent);
    
    var filter2 = new Filter2()
    
    return someMockPipe.pull()
  
  }
  
  filterXY() {
    return line => line.match(/^- \[[ x]\] /)
  }
  
}