'enable rp19-jsx';


/*MD
## Example:
```
import FooMorph from "https://lively-kernel.org/lively4/lively4-jens/demos/jsx19.js"
customElements.define("foo-morph", FooMorph);

that.innerHTML = "<foo-morph></foo-morph>"
```
// that.innerHTML = ""

MD*/

import ReactiveMorph from 'src/client/reactive/components/rewritten/conduit/rpComponents/reactiveMorph.js';

var model = {
  name: "Foo"
}

export default class FooMorph extends ReactiveMorph {
  
  /* Event handler */
  onRegisterForm(event) {
    event.preventDefault();
  }
  
  // (1) Project on initialize
  render_1() {    
      return <div>{model.name}</div>
    
  }
  
  // (2) with a loop
  render_2() {    
      return <div>
        <div>{model.name + "XXX"}</div>
        <button click={() => model.name = "bar"}>change</button>
      </div>
  }
  
  // (3) with a magic loop ... chanage in input is pushed to model
  render() {   
      // Rewriting ERROR: value={model.name + "XXX"}></input>
      return <div>
        <form id='registerForm'>
          <fieldset>
            <input 
              id='nameInput'
              value={model.name}></input>
          </fieldset>
        </form>
        <div>MODEL: {model.name}</div>
      </div>
  }
  
  
}
