# Test

```JavaScript
import Input from 'demos/stefan/gamepad-input/input.js';
var input = new Input('id')
input.initGamepad()
// input.updateGamepad()

const ele = document.body.querySelector('#id')

input.bind(Input.GAMEPAD_KEY.BUTTON_1, 'down');

function frame() {

  input.reportOnGamepad();
  
//   if(input.bindings['down']) {
//     lively.notify('bound')
//   }
//   if(input.pressed('down')) {
//     lively.notify('pressed down')
//   }
//   if(input.state('down')) {
//     lively.notify('STATE down')
//   }
//   if(input.released('down')) {
//     lively.notify('released down')
//   }
  
//   input.clearPressed()
  // requestAnimationFrame(frame)
}

requestAnimationFrame(frame)
```

The Input code currently needs two elements to show its results. Thus, you may copy those two:

<div class="lively-content" style="width: 400px; height: 200px; border: 1px solid black; position: relative; background-color: rgba(40, 40, 80, 0.5);" id="gamepadPrompt">To begin using your gamepad, connect it and press any button!</div>

<div class="lively-content" style="width: 400px; height: 200px; border: 1px solid black; position: relative; background-color: rgba(40, 40, 80, 0.5);" id="gamepadDisplay">id: Surface Dock Extender (Vendor: 045e Product: 0904) Stick 1: 0,0 Stick 2: 0,undefined Stick L: 0,0 Stick R: NaN,NaN Trigger L: undefined Trigger R: undefined </div>