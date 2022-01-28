/*globals Interpreter that */

import { ensureJSInterpreter } from 'src/client/preload-gs.js';
ensureJSInterpreter();
import { uuid } from 'utils';

import Morph from 'src/components/widgets/lively-morph.js';

class Battler {
  constructor() {
    this.id = uuid();
  }
}

class GS_Node {}

var enemies = [new Battler(), new Battler(), new Battler()];

export default class InterpreterPlayground extends Morph {
  async initialize() {
    this.windowTitle = "InterpreterPlayground";
    this.registerButtons();

    lively.html.registerKeys(this); // automatically installs handler for some methods

    await this.lcm1.editorLoaded();
    await this.lcm2.editorLoaded();
    await this.lcm3.editorLoaded();

    this.startStepping();
    this.callingAnExternalAPI();
    this.multiInterpreterExample();
  }

  callingAnExternalAPI() {
    const i = new Interpreter(`
livelyNotify('hello external world', 'calling_an_external_api')
livelyNotify(livelyNotify, 'calling_an_external_api')
`, (interpreter, globalObject) => {
      const log = interpreter.createNativeFunction(::lively.notify);
      interpreter.setProperty(globalObject, 'livelyNotify', log);
    })
    i.run()
  }

  multiInterpreterExample() {
    this.i2 = new Interpreter(this.lcm2.value, (interpreter, globalObject)  => {
      var url = interpreter.nativeToPseudo({ path: { to: { loc: String(location) }}});
      interpreter.setProperty(globalObject, 'url', url);

      var wrapper = function alert(text) {
        return window.alert(text);
      };
      interpreter.setProperty(globalObject, 'alert', interpreter.createNativeFunction(wrapper));
    });

    this.i2;
    this.i2.step();
    this.i2.run()
    lively.notify(this.i2.value, 'i2')
  }

  get lcm1() {
    return this.get('#lcm1');
  }
  get cm1() {
    return this.lcm1.editor;
  }

  get lcm2() {
    return this.get('#lcm2');
  }
  get cm2() {
    return this.lcm2.editor;
  }

  get lcm3() {
    return this.get('#lcm3');
  }
  get cm3() {
    return this.lcm3.editor;
  }

  attachedCallback() {}

  detachedCallback() {
    this.stopStepping();
  }

  onKeyDown(evt) {
    lively.notify("Key Down!" + evt.charCode);
  }

  onViewStackButton() {
    this.stopStepping();
    lively.openInspector(this.i1.getStateStack());
  }

  onMinusButton() {
    this.get("#textField").value = parseFloat(this.get("#textField").value) - 1;
  }

  startStepping() {
    this.interval1 = setInterval(() => this.step(), 100);
  }

  stopStepping() {
    clearInterval(this.interval1);
  }

  step() {
    const cm1 = this.cm1;
    this.i1 = this.i1 || new Interpreter(cm1.getValue());
    console.log(this.i1);
    var stack = this.i1.getStateStack();
    if (stack.length) {
      var node = stack[stack.length - 1].node;
      var start = node.start;
      var end = node.end;
      this.get('#value').innerHTML = Object.keys(stack.last.node);
      this.get('#stackType').innerHTML = '';
      this.get('#stackType').append(...stack.map(frame => <span>{frame.node.type}</span>).joinElements(() => ' '));
    } else {
      var start = 0;
      var end = 0;
    }
    cm1.setSelection(cm1.posFromIndex(start), cm1.posFromIndex(end));
    try {
      var ok = this.i1.step();
    } finally {
      if (!ok) {
        this.stopStepping();
      }
    }
  }

  /* Lively-specific API */

  // store something that would be lost
  livelyPrepareSave() {
    this.setAttribute("data-mydata", this.get("#textField").value);
  }

  livelyPreMigrate() {}

  livelyMigrate(other) {}

  /*
    livelyInspect(contentNode, inspector) {
      // overrides how the inspector displays this component
    }
  */

  async livelyExample() {
    // this customizes a default instance to a pretty example
    // this is used by the 
    this.style.backgroundColor = "lightgray";
    this.someJavaScriptProperty = 42;
    this.appendChild(<div>This is my content</div>);
  }

}