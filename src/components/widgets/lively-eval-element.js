import Morph from 'src/components/widgets/lively-morph.js';
import boundEval from "src/client/bound-eval.js";

export default class LivelyEvalElement extends Morph {
  async initialize() {
    this.update()    
  }
  
  get ref() {
    return this.getAttribute("ref")
  }
  set ref(query) {
    this.setAttribute("ref", query)
    this.update()
  }

  async update() {
    if (!this.ref) return
    var query = this.ref
    var element = lively.query(this,query)
    if (!element)
      return <span style="color:red">element {query} not found</span>
    var src = element.textContent 
    var result  = await boundEval(src);
    debugger
    if (result.error) {
      return <span style="color:red">error: {result.error}</span>
    }
    if (result.value && result.value.then) {
      result = await result.value
    } else {
      result = result.value
    }
    
    if (result instanceof HTMLElement) {
      this.shadowRoot.querySelector("#result").innerHTML = ""
      this.shadowRoot.querySelector("#result").appendChild(result)
    } else if (result !== undefined) {
      this.shadowRoot.querySelector("#result").innerHTML = "" + result 
    } else {
      this.shadowRoot.querySelector("#result").innerHTML = ""
    }
  }
}