import Morph from './Morph.js';

const debuggerGitHubURL = 'https://github.com/LivelyKernel/lively4-chrome-debugger';

export default class Debugger extends Morph {

  initialize() {
    this.windowTitle = 'Debugger';
    this.pid = null;
    this.logType = 'stdout';
    this.services = [];
    this.debuggerTargets = this.getSubmorph('#debugger-targets');
    this.targetSelection = document.createElement('select');
    this.debuggerTargets.appendChild(this.targetSelection);
  
    this.debugButton = this.getSubmorph('#debugButton');
    this.debugButton.addEventListener('click', this.debugButtonClick.bind(this));
    this.stopButton = this.getSubmorph('#stopButton');
    this.stopButton.addEventListener('click', this.stopButtonClick.bind(this));
    this.pauseButton = this.getSubmorph('#pauseButton');
    this.pauseButton.addEventListener('click', this.pauseButtonClick.bind(this));
    this.playButton = this.getSubmorph('#playButton');
    this.playButton.addEventListener('click', this.playButtonClick.bind(this));
    this.stepOverButton = this.getSubmorph('#stepOverButton');
    this.stepOverButton.addEventListener('click', this.stepOverButtonClick.bind(this));
    this.stepIntoButton = this.getSubmorph('#stepIntoButton');
    this.stepIntoButton.addEventListener('click', this.stepIntoButtonClick.bind(this));
    this.stepOutButton = this.getSubmorph('#stepOutButton');
    this.stepOutButton.addEventListener('click', this.stepOutButtonClick.bind(this));
    
    this.codeEditor = this.getSubmorph('#codeEditor').editor;
    this.codeEditor.getSession().setMode("ace/mode/javascript");
    this.details = this.getSubmorph('#details');
    
    if (lively4ChromeDebugger) {
      lively4ChromeDebugger.getDebuggingTargets().then((targets) =>
        targets.forEach((ea) => {
          var option = document.createElement('option');
          option.text = ea.title;
          option.value = ea.id;
          this.targetSelection.appendChild(option);
        }
      ));
    } else {
      if (window.confirm('Lively4 Debugger Extension not found. Do you want to install it?')) {
        window.open(debuggerGitHubURL, '_blank').focus();
      }
    }
  }

  attachDebugger() {
    lively4ChromeDebugger.debuggerAttach(this.selectedTargetId());
  }

  detachDebugger() {
    lively4ChromeDebugger.debuggerDetach(this.selectedTargetId());
  }

  sendCommandToDebugger(method, args) {
    lively4ChromeDebugger.debuggerSendCommand(this.selectedTargetId(), method, args);
  }
  
  selectedTargetId() {
    return this.targetSelection.options[this.targetSelection.selectedIndex].value;
  }
  
  setDisabledAllDebugButton(bool) {
    this.pauseButton.disabled = bool;
    this.stepOverButton.disabled = bool;
    this.stepIntoButton.disabled = bool;
    this.stepOutButton.disabled = bool;
    this.targetSelection.disabled = !bool;
  }

  /*
  * Event handlers
  */

  debugButtonClick(evt) {
    this.detachDebugger(); // detach any old debugger
    this.attachDebugger();
    this.sendCommandToDebugger('enable');
    this.debugButton.classList.add('hide');
    this.stopButton.classList.remove('hide');
    this.setDisabledAllDebugButton(false);
  }
  
  stopButtonClick(evt) {
    this.detachDebugger();
    this.stopButton.classList.add('hide');
    this.debugButton.classList.remove('hide');
    this.setDisabledAllDebugButton(true);
  }

  pauseButtonClick(evt) {
    this.sendCommandToDebugger('pause');
    this.pauseButton.classList.add('hide');
    this.playButton.classList.remove('hide');
  }
  
  playButtonClick(evt) {
    this.sendCommandToDebugger('resume');
    this.playButton.classList.add('hide');
    this.pauseButton.classList.remove('hide');
  }

  stepOverButtonClick(evt) {
    this.sendCommandToDebugger('stepOver');
  }
  
  stepIntoButtonClick(evt) {
    this.sendCommandToDebugger('stepInto');
  }
  
  stepOutButtonClick(evt) {
    this.sendCommandToDebugger('stepOut');
  }
}
