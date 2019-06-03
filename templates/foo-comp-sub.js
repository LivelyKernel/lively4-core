import Morph from 'src/components/widgets/lively-morph.js';

import * as x from "src/external/xterm.js/xterm.js" // slow down loading of this module...

export default class FooCompSub extends Morph {
  async initialize() {
    console.log("REGISTER foo comp sub")
  }
  
  bar() {
    return "hello"  
    

      
  }
  
}