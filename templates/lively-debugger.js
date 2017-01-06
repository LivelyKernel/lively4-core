import Morph from './Morph.js';

const debuggerGitHubURL = 'https://github.com/LivelyKernel/lively4-chrome-debugger';

export default class Debugger extends Morph {

  initialize() {
    this.windowTitle = 'Debugger';
    this.lastDebuggerPausedResult = null;
    this.currentCallFrame = null;
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
    this.debuggerWorkspace = this.getSubmorph('#debuggerWorkspace').editor;
    this.details = this.getSubmorph('#details');
    
    this.initializeTargets();
    this.initializeCodeEditor();
    this.initializeDebuggerWorkspace();
    this.breakPoints = {};
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
    this.codeEditor.on("guttermousedown", function(e) {
      if (!this._ensureCurrentCallFrame()) return;
      var scriptId = this.currentCallFrame.location.scriptId;
      var lineNumber = e.getDocumentPosition().row;
      var method, params;
      if (lineNumber in this.codeEditor.session.getBreakpoints()) {
        method = 'Debugger.removeBreakpoint';
        var breakPointId = this.breakPoints[lineNumber];
        if (!breakPointId) {
          alert(`Cannot find breakpointId for line #${lineNumber}`);
          debugger;
          return;
        }
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
          this.breakPoints[actualLineNumber - 1] = res.breakpointId;
          this.codeEditor.session.setBreakpoint(actualLineNumber - 1);
        } else {
          this.codeEditor.session.clearBreakpoint(lineNumber);
        }
        
      });
    }.bind(this))
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
    })

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
  
  updateCodeEditor() {
    if (!this._ensureCurrentCallFrame()) return;
    this.sendCommandToDebugger('Debugger.getScriptSource', {
      scriptId: this.currentCallFrame.location.scriptId
    }).then((res) => {
      if (res.scriptSource) {
        this.codeEditor.setValue(res.scriptSource);
        this.codeEditor.gotoLine(this.currentCallFrame.location.lineNumber);
        this.codeEditor.session.clearBreakpoints();
      } else {
        alert(`Failed to getScriptSource for ${this.currentCallFrame.location.scriptId}`)
      }
    });
  }
  
  dispatchDebuggerPaused(result) {
    this.lastDebuggerPausedResult = result;
    this.currentCallFrame = result.callFrames[0];
    var callFrameList = document.createElement('ul');
    var callFrames = this.lastDebuggerPausedResult.callFrames;
    var callFrameClickHandler = (e) => {
      var callFrameIndex = e.target.getAttribute('data-call-frame-index');
      var callFrame = callFrames[callFrameIndex];
      this.currentCallFrame = callFrame;
      this.updateCodeEditor();
      e.stopPropagation();
    };
    for (var i = 0; i < callFrames.length; i++) {
      var callFrame = callFrames[i];
      var li = document.createElement('li');
      li.setAttribute('data-call-frame-index', i);
      li.innerHTML = callFrame.functionName;
      li.addEventListener('click', callFrameClickHandler.bind(this));
      callFrameList.appendChild(li);
    }
    this.updateCodeEditor();
    // TODO: restore existing breakpoints
    if (result.hitBreakpoints.length > 0) {
      debugger;
    }
    var scopeChain = this.currentCallFrame.scopeChain;
    var scopeList = document.createElement('ul');
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
        scopeList.appendChild(li);
    }

    this.details.innerHTML = '';
    var callFrameListTitle = document.createElement('b');
    callFrameListTitle.innerHTML = 'Call Frames';
    this.details.appendChild(callFrameListTitle);
    this.details.appendChild(callFrameList);
    var scopeListTitle = document.createElement('b');
    scopeListTitle.innerHTML = 'Scope';
    this.details.appendChild(scopeListTitle);
    this.details.appendChild(scopeList);
  }
  
  appendPropertyList(parentSummary, objectId) {
    this.sendCommandToDebugger('Runtime.getProperties', {objectId: objectId})
      .then((res) => {
        var parentDetails = parentSummary.parentElement;
        var propList = document.createElement('ul');
        var itemClickHandler = (e) => {
          if (parentDetails.hasAttribute('open')) return;
          var objectId = e.target.getAttribute('data-object-id');
          this.appendPropertyList(e.target, objectId);
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
            propSummary.addEventListener('click', itemClickHandler);
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
    this.pauseButton.classList.add('hide');
    this.playButton.classList.remove('hide');
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
}
