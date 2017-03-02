import Morph from './Morph.js';

const debuggerGitHubURL = 'https://github.com/LivelyKernel/lively4-chrome-debugger';

export default class Debugger extends Morph {

  initialize() {
    this.windowTitle = 'Debugger';
    this.windowIcon = '<i class="fa fa-chrome" aria-hidden="true"></i>';
    this.lastDebuggerPausedResult = null;
    this.currentTarget = null;
    this.currentCallFrame = null;
    this.highlightedLineId = null;
    this.scopeList = document.createElement('ul');
    this.breakPoints = {}; // mapping: scriptId => {lineNumber => breakpointId}
    this.Range = ace.require('ace/range').Range;

    this.targetList = this.getSubmorph('#targetList');
    this.scriptList = this.getSubmorph('#scriptList');
    this.scriptList.addEventListener('change', this.scriptListChanged.bind(this))
    this.callFrameList = this.getSubmorph('#callFrameList');
    this.scopeList = this.getSubmorph('#scopeList');
    this.codeEditor = this.getSubmorph('#codeEditor').editor;
    this.debuggerWorkspace = this.getSubmorph('#debuggerWorkspace').editor;

    // ensure the extension is installed    
    if (!lively4ChromeDebugger) {
      if (window.confirm('Lively4 Debugger Extension not found. Do you want to install it?')) {
        window.open(debuggerGitHubURL, '_blank').focus();
      }
      return;
    }

    this.initializeButtonBar();
    this.initializeTargets();
    this.initializeCodeEditor();
    this.initializeDebuggerWorkspace();
    
    this.detachedCallback = () => {
      if (this._debugger_is_attached()) {
        this.detachDebugger();
      }
    };
    this.dispatchEvent(new CustomEvent('loaded'));
  }

  /*
  * Initialization
  */
  
  initializeButtonBar() {
    var buttons = this.getSubmorph('#debugger-top').getElementsByTagName('button');
    for (var i = 0; i < buttons.length; i++) {
      var button = buttons[i];
      this[button.id] = button;
      var clickHandler = this[`${button.id}Click`];
      if (clickHandler) {
        button.addEventListener('click', clickHandler.bind(this));
      } else {
        console.warn(`No click handler called ${button.id}Click`);
      }
    }
  }
  
  initializeTargets() {
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
          this.targetList.appendChild(option);
        }
      }
    )).catch((error) => {
      console.log(error);
      debugger;
    });
    this.targetList.addEventListener('changed', () => {
      this.currentTarget = {
        targetId: this._selectedTargetId()
      };
    });
  }
  
  initializeCodeEditor() {
    this.codeEditor.session.setMode("ace/mode/javascript");
    this.codeEditor.commands.addCommand({
      name: "saveIt",
      bindKey: {win: "Ctrl-S", mac: "Command-S"},
      exec: (editor) => {
        if (!this._ensureCurrentCallFrame()) return;
        this.sendCommandToDebugger('Debugger.setScriptSource', {
          scriptId: this._selectedScriptId(),
          scriptSource: editor.getValue()
        }).then((res) => {
          if (res && res.exceptionDetails) {
            alert(res.exceptionDetails.text); 
          } else {
            console.log('Debugger.setScriptSource', res);
          }
        });
      }
    });
    this.codeEditor.on("guttermousedown", (e) => {
      if (!this._ensureCurrentCallFrame()) return;
      var scriptId = this._selectedScriptId();
      var lineNumber = e.getDocumentPosition().row;
      var method, params;
      if (lineNumber in this.codeEditor.session.getBreakpoints()) {
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
            lineNumber: lineNumber + 2 // ace rows start at 0
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
          this.breakPoints[scriptId][actualLineNumber - 2] = res.breakpointId;
          this.codeEditor.session.setBreakpoint(actualLineNumber - 2);
        } else {
          this.codeEditor.session.clearBreakpoint(lineNumber);
        }
      });
    });
  }
  
  initializeDebuggerWorkspace() {
    this.debuggerWorkspace.session.setMode("ace/mode/javascript");
    this.debuggerWorkspace.renderer.setShowGutter(false);
    this.debuggerWorkspace.currentSelectionOrLine = () => {
        let text,
            editor = this.debuggerWorkspace,
            sel =  editor.getSelectionRange();
        if (sel.start.row == sel.end.row && sel.start.column == sel.end.column) {
            var currline = editor.getSelectionRange().start.row;
            text = editor.session.getLine(currline);
        } else {
            text = editor.getCopyText();
        }
        return text;
    };
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
    this.debuggerWorkspace.commands.addCommand({
      name: "inspectIt",
      bindKey: {win: "Ctrl-I", mac: "Command-I"},
      exec: (editor) => {
        this._evaluateOnCallFrame(editor, (res) => {
          if (res.exceptionsDetails) {
            lively.openInspector(res);
          } else {
            lively.openInspector(res.result.value || res.result);
          }
        });
      }
    });
  }

  /*
  * Event handlers
  */

  debugButtonClick(evt) {
    this.detachDebugger(); // detach any old debugger
    this.attachDebugger().then(() => {
      this.sendCommandToDebugger('Debugger.enable');
    });
    this.debugButton.classList.add('hide');
    this.stopButton.classList.remove('hide');
    this._setDisabledAllDebugButtons(false);
  }
  
  stopButtonClick(evt) {
    this.detachDebugger();
    this.stopButton.classList.add('hide');
    this.debugButton.classList.remove('hide');
    this._setDisabledAllDebugButtons(true);
    this.debugButton.disabled = false;
    this._reset();
  }

  pauseButtonClick(evt) {
    this.updateScripts();
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
  
  multiStepButtonClick(evt) {
    var debugMethod = window.prompt('Step method (stepOver, stepInto, or stepOut):', 'stepOver');
    var numberOfIterations = parseInt(window.prompt('Number of iterations:', '5'));
    var millisecondsBetweenSteps = parseInt(window.prompt('Milliseconds between steps:', '1000'));
    for (var i = 0; i < numberOfIterations; i++) {
      setTimeout(() => {
        this.sendCommandToDebugger(`Debugger.${debugMethod}`);
      }, millisecondsBetweenSteps * i);
    }
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
  
  breakpointsButtonClick(evt) {
    var active = evt.target.classList.toggle('active');
    this.sendCommandToDebugger('Debugger.setBreakpointsActive', {active: active });
  }
  
  profilerButtonClick(evt) {
    var numberOfSections = parseInt(window.prompt('Seconds to profile:', '5'));
    this.sendCommandToDebugger('Profiler.enable').then(() => {
      this.sendCommandToDebugger('Profiler.start').then(() => {
        setTimeout(() => {
          this.sendCommandToDebugger('Profiler.stop').then((res) => {
            if (res && res.profile) {
              lively.openInspector(res.profile);
            } else {
              alert('Failed to retrieve profile.');
              debugger;
            }
            this.sendCommandToDebugger('Profiler.disable');
          });
        }, numberOfSections * 1000);
      });
    });
  }
  
  urlButtonClick(evt) {
    var url = window.prompt('URL to open:', 'https://hpi.de');
    this.sendCommandToDebugger('Page.enable').then(() => {
      this.sendCommandToDebugger('Page.navigate', { url: url }).then((res) => {
        this.sendCommandToDebugger('Page.disable');
      });
    });
  }
  
  reloadButtonClick(evt) {
    this.sendCommandToDebugger('Page.enable').then(() => {
      this.sendCommandToDebugger('Page.reload', { ignoreCache: true }).then(() => {
        this.sendCommandToDebugger('Page.disable');
      });
    });
  }
  
  scriptListChanged(evt) {
    this.sendCommandToDebugger('Debugger.getScriptSource', {
      scriptId: this._selectedScriptId()
    }).then((res) => {
      if (res && res.scriptSource) {
        this.codeEditor.setValue(res.scriptSource);
      } else {
        alert('Unable to retrieve scriptSource:', res);
        debugger;
      }
    });
  }

  /*
  * Interaction with debugger extension
  */

  attachDebugger() {
    return lively4ChromeDebugger.debuggerAttach(this.currentTarget);
  }

  attachAndEnableDebuggerFromTabId(tabId) {
    this.currentTarget = { tabId: tabId };
    return this.attachDebugger().then(() => {
      this.sendCommandToDebugger('Debugger.enable');
    });
  }

  detachDebugger() {
    return lively4ChromeDebugger.debuggerDetach(this.currentTarget);
  }

  sendCommandToDebugger(method, args) {
    return lively4ChromeDebugger.debuggerSendCommand(
      this.currentTarget, method, args);
  }
  
  dispatchDebuggerPaused(result) {
    // Update buttons
    this.pauseButton.classList.add('hide');
    this.playButton.classList.remove('hide');
    
    this.lastDebuggerPausedResult = result;
    this.currentCallFrame = result.callFrames[0];
    this.updateCodeEditor(result);
    this.updateCallFrameList();
    this.updateScopeList();
  }
  
  /*
  * Dynamic UI updating
  */
  
  updateCodeEditor(pausedResult) {
    if (!this._ensureCurrentCallFrame()) return;
    var currentScriptId = this.currentCallFrame.location.scriptId;
    this.sendCommandToDebugger('Debugger.getScriptSource', {
      scriptId: currentScriptId
    }).then((res) => {
      if (res && res.scriptSource) {
        var lineNumber = this.currentCallFrame.location.lineNumber - 1; // Chrome debugger to ace
        this._setScriptId(currentScriptId);
        this.codeEditor.setValue(res.scriptSource);
        this.codeEditor.gotoLine(lineNumber);
        this._updateHighlightLine(this.codeEditor.session, lineNumber);
      } else {
        alert(`Failed to getScriptSource for ${this.currentCallFrame.location.scriptId}`);
      }
    });
  }
  
  updateCallFrameList() {
    this.callFrameList.innerHTML = '';
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
      li.addEventListener('click', callFrameClickHandler);
      this.callFrameList.appendChild(li);
    }
  }
  
  updateScopeList() {
    this.scopeList.innerHTML = '';
    var scopeChain = this.currentCallFrame.scopeChain;
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
      summary.addEventListener('click', summaryClickHandler);
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
        var clickHandler = (e) => {
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
            var propSummary = document.createElement('summary');
            propSummary.setAttribute('data-object-id', property.value.objectId);
            propSummary.innerHTML = `${property.name} [${property.value.type}]`;
            propSummary.addEventListener('click', clickHandler);
            var propDetails = document.createElement('details');
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
  
  updateScripts(cb) {
    lively4ChromeDebugger.getDebuggingScripts().then((scripts) => {
      this.scriptList.innerHTML = '';
      scripts.forEach((ea) => {
        // hide background page which is used to talk to the debugger
        if (ea.url) {
          var option = document.createElement('option');
          option.text = ea.url;
          option.value = ea.scriptId;
          this.scriptList.appendChild(option);
        }
      });
      if (cb) cb();
    });
  }

  /*
  * Private helpers
  */
  
  _reset() {
    this.codeEditor.setValue('');
    this.scriptList.innerHTML = '';
    this.callFrameList.innerHTML = '';
    this.scopeList.innerHTML = '';
  }
  
  _selectedTargetId() {
    return this.targetList.options[this.targetList.selectedIndex].value;
  }

  _selectedScriptId() {
    return this.scriptList.options[this.scriptList.selectedIndex].value;
  }
  
  _setScriptId(scriptId) {
    this.updateScripts(() => {
      this.scriptList.value = scriptId;
    });
    
  }
  
  _setDisabledAllDebugButtons(bool) {
    var buttons = this.getSubmorph('#debugger-top').getElementsByTagName('button');
    for (var i = 0; i < buttons.length; i++) {
      buttons[i].disabled = bool;
    }
    this.targetList.disabled = !bool;
  }
  
  _updateHighlightLine(session, lineNumber) {
    if (this.highlightedLineId) {
      session.removeMarker(this.highlightedLineId);
    }
    var range = new this.Range(lineNumber - 1, 0, lineNumber - 1, 1);
    this.highlightedLineId = session.addMarker(range, 'highlight_line', 'fullLine');
  }
  
  _ensureCurrentCallFrame() {
    if (!this.currentCallFrame) {
      alert('No call frame to operate on. Has the debugger paused?');
      debugger;
      return false;
    }
    return true;
  }
  
  _debugger_is_attached() {
    return this.targetList.disabled;
  }
  
  _evaluateOnCallFrame(editor, cb) {
    let expression = editor.currentSelectionOrLine();
    if (!this._debugger_is_attached()) {
      alert('Debugger is not attached to any target.');
      debugger;
      return;
    }
    if (this.currentCallFrame) {
      this.sendCommandToDebugger('Debugger.evaluateOnCallFrame', {
        callFrameId: this.currentCallFrame.callFrameId,
        expression: expression
      }).then(cb);
    } else {
      this.sendCommandToDebugger('Runtime.evaluate', {
        expression: expression
      }).then(cb);
    }
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
}
