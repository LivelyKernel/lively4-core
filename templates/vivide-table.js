import Morph from 'src/components/widgets/lively-morph.js'; 

export default class VivideTable extends Morph {
  initialize() {
    this.windowTitle = "VivideTable"
  }
  
  livelyExample() {
    this.get('#lively-table').livelyExample();
  }
}