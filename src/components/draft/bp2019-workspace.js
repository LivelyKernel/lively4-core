import Morph from 'src/components/widgets/lively-morph.js';

export default class Bp2019Workspace extends Morph {
  async initialize() {
    this.windowTitle = "Bp2019Workspace";
    
    // delete this.get("#editor").boundEval
    
    this.get("#editor").boundEval = async (s) => {
      return fetch("https://lively-kernel.org/voices2/_vq/", {
          method: "POST", 
          headers: {
          },
          body: s
       }
      ).then(r => r.json())
      
    // return {value: "haha " + s}
    }
  }
}
