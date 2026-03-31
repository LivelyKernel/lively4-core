

import Morph from 'src/components/widgets/lively-morph.js';

export default class MyTest extends Morph {
  async initialize() {
 
  }

  async livelyExample() {
    this.appendChild(<div contenteditable="true">This isa test.</div>)
  }
}