import Morph from './Morph.js';

const debuggerGitHubURL = 'https://github.com/LivelyKernel/lively4-chrome-debugger';

export default class Debugger extends Morph {

  initialize() {
    this.windowTitle = 'Debugger';
    this.lastDebuggerPausedResult = null;
    this.currentCallFrame = null;
    this.scopeList = document.createElement('ul');
    this.breakPoints = {}; // mapping: scriptId => {lineNumber => breakpointId}

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
    this.restartFrameButton = this.getSubmorph('#restartFrameButton');
    this.restartFrameButton.addEventListener('click', this.restartFrameButtonClick.bind(this));
    
    this.codeEditor = this.getSubmorph('#codeEditor').editor;
    this.codeEditor.getSession().setMode("ace/mode/javascript");
    this.debuggerWorkspace = this.getSubmorph('#debuggerWorkspace').editor;
    this.details = this.getSubmorph('#details');
    
    this.initializeTargets();
    this.initializeCodeEditor();
    this.initializeDebuggerWorkspace();
  }
  
  initializeTargets() {
    if (!lively4ChromeDebugger) {
      if (window.confirm('Lively4 Debugger Extension not found. Do you want to install it?')) {
        window.open(debuggerGitHubURL, '_blank').focus();
        return;
      }
    }
    lively4ChromeDebugger.getDebuggingTargets().then((targets) =>
      targets.forEach((ea) => {
        // hide background page which is used to talk to the debugger
        if (ea.extensionId != 'igllpbjcbjlfjelmiphlkafgbmijgddg') {
          var option = document.createElement('option');
          if (ea.type == 'worker') {
            option.text = `Worker at ${ea.url}`;
          } else {
            option.text = ea.title;
          }
          option.value = ea.id;
          this.targetSelection.appendChild(option);
        }
      }
    ));
  }
  
  initializeCodeEditor() {
    this.codeEditor.commands.addCommand({
      name: "saveIt",
      bindKey: {win: "Ctrl-S", mac: "Command-S"},
      exec: (editor) => {
        if (!this._ensureCurrentCallFrame()) return;
        this.sendCommandToDebugger('Debugger.setScriptSource', {
          scriptId: this.currentCallFrame.location.scriptId,
          scriptSource: editor.getValue()
        }).then((res) => {
          console.log('Debugger.setScriptSource', res);
        });
      }
    });
    this.codeEditor.on("guttermousedown", function(e) {
      if (!this._ensureCurrentCallFrame()) return;
      var scriptId = this.currentCallFrame.location.scriptId;
      var lineNumber = e.getDocumentPosition().row;
      var method, params;
      if (lineNumber in this.codeEditor.getSession().getBreakpoints()) {
        method = 'Debugger.removeBreakpoint';
        if (!(scriptId in this.breakPoints) || !(lineNumber in this.breakPoints[scriptId])) {
          alert(`Cannot find breakpointId for line #${lineNumber}`);
          debugger;
          return;
        }
        var breakPointId = this.breakPoints[scriptId][lineNumber];
        delete this.breakPoints[scriptId][lineNumber];
        params = { breakpointId: breakPointId };
      } else {
        method = 'Debugger.setBreakpoint';
        params = {
          location: {
            scriptId: scriptId,
            lineNumber: lineNumber + 1 // ace rows start at 0
          }
        };
      }
      this.sendCommandToDebugger(method, params).then((res) => {
        if (!res) return; // command failed on background page
        if (res.actualLocation) {
          if (scriptId != res.actualLocation.scriptId) {
            alert('Breakpoint set in a different script.');
            debugger;
            return;
          }
          var actualLineNumber = res.actualLocation.lineNumber;
          if (!(scriptId in this.breakPoints)) {
            this.breakPoints[scriptId] = {};
          }
          this.breakPoints[scriptId][actualLineNumber - 1] = res.breakpointId;
          this.codeEditor.getSession().setBreakpoint(actualLineNumber - 1);
        } else {
          this.codeEditor.getSession().clearBreakpoint(lineNumber);
        }
      });
    }.bind(this));
  }
  
  _ensureCurrentCallFrame() {
    if (!this.currentCallFrame) {
      alert('No call frame to operate on. Has the debugger paused?');
      debugger;
      return false;
    }
    return true;
  }
  
  _evaluateOnCallFrame(editor, cb) {
    let expression = editor.currentSelectionOrLine()
    if (!this._ensureCurrentCallFrame()) return;
    this.sendCommandToDebugger('Debugger.evaluateOnCallFrame', {
      callFrameId: this.currentCallFrame.callFrameId,
      expression: expression
    }).then(cb);
  }
  
  _printResult(editor, result) {
    var fromSel =  editor.getSelectionRange().end;
    editor.selection.moveCursorToPosition(fromSel);
    editor.selection.clearSelection(); // don't replace existing selection
    editor.insert(JSON.stringify(result));
    var toSel =  editor.getSelectionRange().start;
    editor.selection.moveCursorToPosition(fromSel);
    editor.selection.selectToPosition(toSel);
  }
  
  initializeDebuggerWorkspace() {
    this.debuggerWorkspace.currentSelectionOrLine = function() {
        let text,
            sel =  this.getSelectionRange();
        if (sel.start.row == sel.end.row && sel.start.column == sel.end.column) {
            var currline = this.getSelectionRange().start.row;
            text = this.session.getLine(currline);
        } else {
            text = this.getCopyText()
        };
        return text
    }
    this.debuggerWorkspace.commands.addCommand({
      name: "doIt",
      bindKey: {win: "Ctrl-D", mac: "Command-D"},
      exec: (editor) => {
        this._evaluateOnCallFrame(editor);
      }
    });

    this.debuggerWorkspace.commands.addCommand({
      name: "printIt",
      bindKey: {win: "Ctrl-P", mac: "Command-P"},
      exec: (editor) => {
        this._evaluateOnCallFrame(editor, (res) => {
          if (res.exceptionsDetails) {
            this._printResult(editor, res.exceptionsDetails);
          } else {
            this._printResult(editor, res.result.value || res.result);
          }
        });
      }
    });
  }
  
  updateCodeEditor(pausedResult) {
    if (!this._ensureCurrentCallFrame()) return;
    this.sendCommandToDebugger('Debugger.getScriptSource', {
      scriptId: this.currentCallFrame.location.scriptId
    }).then((res) => {
      if (res && res.scriptSource) {
        this.codeEditor.setValue(res.scriptSource);
        this.codeEditor.gotoLine(this.currentCallFrame.location.lineNumber + 1);
        this.codeEditor.getSession().clearBreakpoints();
        if (pausedResult) {
          // restore breakpoints from pausedResult.hitBreakpoints
          if (pausedResult.hitBreakpoints.length > 0) {
            for (var i = 0; i < pausedResult.hitBreakpoints.length; i++) {
              var breakpointId = pausedResult.hitBreakpoints[i];
              var parts = breakpointId.split(':');
              if (parts[0] != this.currentCallFrame.location.scriptId) {
                break; // break because all breakpoints belong to the same scriptId
              }
              var lineNumber = parseInt(parts[1]);
              this.codeEditor.getSession().setBreakpoint(lineNumber - 1);
            }
          }
        }
      } else {
        alert(`Failed to getScriptSource for ${this.currentCallFrame.location.scriptId}`)
      }
    });
  }
  
  dispatchDebuggerPaused(result) {
    // Update buttons
    this.pauseButton.classList.add('hide');
    this.playButton.classList.remove('hide');
    
    this.lastDebuggerPausedResult = result;
    this.currentCallFrame = result.callFrames[0];
    var callFrameList = document.createElement('ul');
    var callFrames = this.lastDebuggerPausedResult.callFrames;
    var callFrameClickHandler = (e) => {
      var callFrameIndex = e.target.getAttribute('data-call-frame-index');
      var callFrame = callFrames[callFrameIndex];
      this.currentCallFrame = callFrame;
      this.updateCodeEditor();
      this.updateScopeList();
      e.stopPropagation();
    };
    for (var i = 0; i < callFrames.length; i++) {
      var callFrame = callFrames[i];
      var li = document.createElement('li');
      li.setAttribute('data-call-frame-index', i);
      li.innerHTML = callFrame.functionName || '<i>unknown</i>';
      li.addEventListener('click', callFrameClickHandler.bind(this));
      callFrameList.appendChild(li);
    }
    this.updateCodeEditor(result);
  
    this.details.innerHTML = '';
    var callFrameListTitle = document.createElement('b');
    callFrameListTitle.innerHTML = 'Call Frames';
    this.details.appendChild(callFrameListTitle);
    this.details.appendChild(callFrameList);
    
    var scopeListTitle = document.createElement('b');
    scopeListTitle.innerHTML = 'Scope';
    this.details.appendChild(scopeListTitle);
    this.details.appendChild(this.scopeList);
    this.updateScopeList();
  }
  
  updateScopeList() {
    var scopeChain = this.currentCallFrame.scopeChain;
    this.scopeList.innerHTML = '';
    var summaryClickHandler = (e) => {
      var selectedSummary = e.target;
      var selectedDetails = selectedSummary.parentElement;
      if (selectedDetails.hasAttribute('open')) return;
      var objectId = e.target.getAttribute('data-object-id');
      this.appendPropertyList(selectedSummary, objectId);
    };
    for (var i = 0; i < scopeChain.length; i++) {
      var scope = scopeChain[i];
      var obj = scope.object;
      var details = document.createElement('details');
      var summary = document.createElement('summary');
      summary.setAttribute('data-object-id', obj.objectId);
      summary.addEventListener('click', summaryClickHandler.bind(this));
      var text = scope.type;
      if (scope.name) {
        text = `${scope.type}: ${scope.name}`;
      }
      summary.innerHTML = text;
      details.appendChild(summary);
      var li = document.createElement('li');
      li.appendChild(details);
      this.scopeList.appendChild(li);
    }
  }
  
  appendPropertyList(parentSummary, objectId) {
    this.sendCommandToDebugger('Runtime.getProperties', {objectId: objectId})
      .then((res) => {
        var parentDetails = parentSummary.parentElement;
        var propList = document.createElement('ul');
        var itemClickHandler = (e) => {
          var currentSummary = e.target;
          var currentDetails = currentSummary.parentElement;
          if (currentDetails.hasAttribute('open')) return;
          var objectId = currentSummary.getAttribute('data-object-id');
          this.appendPropertyList(currentSummary, objectId);
        };
        for (var j = 0; j < res.result.length; j++) {
          var property = res.result[j];
          var li = document.createElement('li');
          if (!property.value) {
            li.innerHTML = `${property.name}`;
          } else if (property.value.value) {
            li.innerHTML = `${property.name}: ${property.value.value}`;
          } else {
            var propDetails = document.createElement('details');
            var propSummary = document.createElement('summary');
            propSummary.setAttribute('data-object-id', property.value.objectId);
            propSummary.innerHTML = `${property.name} [${property.value.type}]`;
            propSummary.addEventListener('click', itemClickHandler.bind(this));
            propDetails.appendChild(propSummary);
            li.append(propDetails);
          }
          propList.appendChild(li);
          parentDetails.innerHTML = '';
          parentDetails.appendChild(parentSummary);
          parentDetails.appendChild(propList);
        }
      }
    );
  }

  attachDebugger() {
    return lively4ChromeDebugger.debuggerAttach(this.selectedTargetId());
  }

  detachDebugger() {
    return lively4ChromeDebugger.debuggerDetach(this.selectedTargetId());
  }

  sendCommandToDebugger(method, args) {
    return lively4ChromeDebugger.debuggerSendCommand(this.selectedTargetId(), method, args);
  }
  
  selectedTargetId() {
    return this.targetSelection.options[this.targetSelection.selectedIndex].value;
  }
  
  setDisabledAllDebugButton(bool) {
    this.pauseButton.disabled = bool;
    this.stepOverButton.disabled = bool;
    this.stepIntoButton.disabled = bool;
    this.stepOutButton.disabled = bool;
    this.restartFrameButton.disabled = bool;
    this.targetSelection.disabled = !bool;
  }

  /*
  * Event handlers
  */

  debugButtonClick(evt) {
    this.detachDebugger(); // detach any old debugger
    this.attachDebugger();
    this.sendCommandToDebugger('Debugger.enable');
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
    this.sendCommandToDebugger('Debugger.pause');
  }
  
  playButtonClick(evt) {
    this.sendCommandToDebugger('Debugger.resume');
    this.playButton.classList.add('hide');
    this.pauseButton.classList.remove('hide');
  }

  stepOverButtonClick(evt) {
    this.sendCommandToDebugger('Debugger.stepOver');
  }
  
  stepIntoButtonClick(evt) {
    this.sendCommandToDebugger('Debugger.stepInto');
  }
  
  stepOutButtonClick(evt) {
    this.sendCommandToDebugger('Debugger.stepOut');
  }
  
  restartFrameButtonClick(evt) {
    if (!this._ensureCurrentCallFrame()) return;
    this.sendCommandToDebugger('Debugger.restartFrame', {
      callFrameId: this.currentCallFrame.callFrameId
    }).then((res) => {
      if (!res) {
        alert('Failed to restart frame.');
      } else if (res.callFrames && res.callFrames.length > 0){
        this.currentCallFrame = res.callFrames[0];
        this.updateCodeEditor();
      } else {
        console.log('Debugger.restartFrame', res);
      }
    });
  }
}
