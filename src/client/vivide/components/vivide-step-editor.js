import Morph from 'src/components/widgets/lively-morph.js';
import ContextMenu from "src/client/contextmenu.js";

import babelDefault from 'systemjs-babel-build';
const babel = babelDefault.babel;

import syntaxJsx from 'babel-plugin-syntax-jsx';
import doExpressions from 'babel-plugin-syntax-do-expressions';
import functionBind from 'babel-plugin-syntax-function-bind';
import asyncGenerators from 'babel-plugin-syntax-async-generators';



export default class VivideStepEditor extends Morph {
  get editor() { return this.get('#editor'); }
  get cm() { return this.editor.editor; }
  
  async initialize() {
    this.windowTitle = "VivideStepEditor";
    
    this.routeToShownPath = [];
    this.markerWrappers = [];
    
    this.registerButtons();
    
    this.editor.editorLoaded().then(() => this.editorConfig());
  }
  editorConfig() {
    this.editor.setOption('viewportMargin', Infinity);

    if (!this.editor.value) {
      this.editor.value = 'Initializing Step...';
    }
    
    this.editor.doSave = text => this.stepSaved(text);

    this.cm.addKeyMap({
      // #KeyboardShortcut Alt-Enter insert new vivide script step after this one 
      "Alt-Enter": cm => {
        this.showTypeMenu();
      },
      // #TODO: implement
      // #KeyboardShortcut Alt-Shift-Enter insert new vivide script step before this one 
      "Alt-Shift-Enter": cm => {
        lively.warn("'Insert Before' not yet implemented", 'fallback to insertAfter');
        this.showTypeMenu();
      },
      // #KeyboardShortcut Alt-Delete remove this step from vivide script
      "Alt-Delete": cm => {
        this.onRemoveStep();
      },
      // #KeyboardShortcut Alt-Backspace remove this step from vivide script
      "Alt-Backspace": cm => {
        this.onRemoveStep();
      },
      // #KeyboardShortcut Alt-Up focus previous step editor
      "Alt-Up": cm => {
        this.scriptEditor && this.scriptEditor.navigateStepEditors(this, false);
      },
      // #KeyboardShortcut Alt-Down focus next step editor
      "Alt-Down": cm => {
        this.scriptEditor && this.scriptEditor.navigateStepEditors(this, true);
      },
      // #KeyboardShortcut Alt-Right inverse code folding (indent)
      "Alt-Right": cm => {
        this.indent(); // #TODO: rename indent to fold and dedent to unfold
      },
      // #KeyboardShortcut Alt-Left inverse code folding (dedent)
      "Alt-Left": cm => {
        this.dedent();
      },
      // #TODO: implement
      // #KeyboardShortcut Alt-U make the current selection bigger
      "Alt-U": cm => {
        lively.warn('\'make the current selection bigger');
        this.expandSelection()
      },
    });
  }
  
  // #TODO: refactor
  // #TODO: split generic iteration and specific conditions
  nextCursorPath(startingPath) {
    let myself = this;

    let forcedDone = false;
    let pathToShow;
    const nodesToLookFor = {
      enter(path) {
        if(forcedDone) { return; }

        const location = path.node.loc;
        if(!myself.isCursorIn(location, 'from')) { return; }
        if(!myself.isCursorIn(location, 'to')) { return; }

        pathToShow = path;
        forcedDone = true;
      }
    }

    startingPath.traverse(nodesToLookFor);
    
    return pathToShow;
  }
  expandSelection() {
    let programPath = this.getPathForRoute([]);
    
    // go down to minimal selected node
    let pathToShow = programPath;
    while(true) {
      let nextPath = this.nextCursorPath(pathToShow);
      if(nextPath) {
        lively.notify(nextPath.node.type)
        pathToShow = nextPath;
      } else {
        break;
      }
    }
    
    if(pathToShow) {
      // go up again
      let selectionStart = this.cm.getCursor('anchor');
      let selectionEnd = this.cm.getCursor();
      let maxPath = pathToShow.find(path => {
        // lively.notify(path.node.type)
        const pathLocation = path.node.loc;
        const pathStart = this.toCMPosition(pathLocation.start);
        const pathEnd = this.toCMPosition(pathLocation.end);
        
        return this.isStrictBefore(pathStart, selectionStart) || this.isStrictBefore(selectionEnd, pathEnd)
      }) || pathToShow;
      
      this.selectPath(maxPath);
    }
  }
  selectPath(path) {
    const location = path.node.loc;
    this.cm.setSelection({
      line: location.start.line - 1, ch: location.start.column
    }, {
      line: location.end.line - 1, ch: location.end.column
    });
  }
  
  ast() {
    const syntaxPlugins = [
      syntaxJsx,
      doExpressions,
      functionBind,
      asyncGenerators
    ];
    
    // try {
      var src = this.editor.value;
      const result = babel.transform(src, {
        babelrc: false,
        plugins: syntaxPlugins,
        presets: [],
        filename: undefined,
        sourceFileName: undefined,
        moduleIds: false,
        sourceMaps: false,
        compact: false,
        comments: true,
        code: true,
        ast: true,
        resolveModuleSource: undefined
      })
    // } catch(err) {
    //   this.get("#log").innerHTML = "" + err
    // }
    
    return result.ast;
  }
  
  isBefore(small, big) {
    return small.line < big.line ||
      small.line === big.line && small.ch <= big.ch;
  }
  isStrictBefore(small, big) {
    return small.line < big.line ||
      small.line === big.line && small.ch < big.ch;
  }
  toCMPosition(babelPosition) {
    return {
      line: babelPosition.line - 1,
      ch: babelPosition.column
    };
  }
  isCursorIn(location, cursorStart) {
    function toCMPosition(babelPosition) {
      return {
        line: babelPosition.line - 1,
        ch: babelPosition.column
      };
    }
    
    function isBefore(small, big) {
      return small.line < big.line ||
        small.line === big.line && small.ch <= big.ch;
    }

    const start = toCMPosition(location.start);
    const cursor = this.cm.getCursor(cursorStart);
    const end = toCMPosition(location.end);
    
    return isBefore(start, cursor) && isBefore(cursor, end);
  }
  dedent() {
    const prevPath = this.getPathForRoute(this.routeToShownPath)

    const pathToShow = prevPath.findParent(path => this.isValidIndentionPath(path));
    
    if(pathToShow) {
      this.applyIndentionFor(pathToShow);
    } else {
      lively.warn("No new indention level for dedent found");
    }
  }
  isValidIndentionPath(path) {
    return path.isProgram() ||
      path.isForOfStatement() ||
      path.isArrowFunctionExpression();
  }
  nextIndentionPath(startingPath, obeyCursor) {
    let myself = this;

    let forcedDone = false;
    let pathToShow;
    const nodesToLookFor = {
      enter(path) {
        if(forcedDone) { return; }

        if(!myself.isValidIndentionPath(path)) { return; }

        const location = path.node.loc;
        if(obeyCursor && !myself.isCursorIn(location, 'anchor')) { return; }
        if(obeyCursor && !myself.isCursorIn(location, 'head')) { return; }

        pathToShow = path;
        forcedDone = true;
      }
    }

    startingPath.traverse(nodesToLookFor);
    
    return pathToShow;
  }
  indent() {
    const prevPath = this.getPathForRoute(this.routeToShownPath)
    
    let pathToShow = this.nextIndentionPath(prevPath, true);
    
    if(pathToShow) {
      this.applyIndentionFor(pathToShow);
    } else {
      lively.warn("No new indention level for indent found");
    }
  }
  autoIndentMax() {
    let prevPath = this.getPathForRoute(this.routeToShownPath)
    
    let pathToShow = prevPath;
    while(true) {
      let nextPath = this.nextIndentionPath(pathToShow, false);
      if(nextPath) {
        lively.notify(nextPath.node.type)
        pathToShow = nextPath;
      } else {
        break;
      }
    }
    
    if(pathToShow) {
      this.applyIndentionFor(pathToShow);
    } else {
      lively.warn("No new indention level for indent found");
    }
  }
  getRouteForPath(path) {
    const route = [];
    
    path.find(path => {
      if(path.isProgram()) { return false; } // we expect to start at a Program node

      route.unshift({
        inList: path.inList,
        listKey: path.listKey,
        key: path.key
      });
      
      return false;
    })

    lively.notify(route);
    
    return route;
  }
  getPathForRoute(route) {
    let programPath;
    babel.traverse(this.ast(), {
      Program(path) {
        programPath = path;
      }
    });
    if(!programPath) {
      lively.warn('No programPath found');
    }
    
    let path = programPath;
    
    route.forEach(routePoint => {
      path = path.get(routePoint.inList ? routePoint.listKey + '.' + routePoint.key : routePoint.key);
    });
    
    return path;
  }
  applyIndentionFor(path) {
    this.removeIndention();

    this.routeToShownPath = this.getRouteForPath(path);

    const location = path.node.loc;

    this.createWrapper({
      line: 0, ch: 0
    }, {
      line: location.start.line - 1, ch: location.start.column
    });
    this.createWrapper({
      line: location.end.line - 1, ch: location.end.column
    }, {
      line: this.cm.lineCount(), ch: 0
    });

    requestAnimationFrame(() => {
      this.cm.refresh();
    });
  }
  createWrapper(from, to) {
    const divStyle = {
      width: "2px",
      height: "1px",
      minWidth: "2px",
      minHeight: "1px",
      borderRadius: "1px",
      backgroundColor: "green"
    };

    return this.editor.wrapWidget('div', from, to).then(div => {
      // div.innerHTML='<i class="fa fa-plus"></i>xx'
      Object.assign(div.style, divStyle);
      this.markerWrappers.push(div);
    });
  }
  removeIndention() {
    this.markerWrappers.forEach(wrapper => wrapper.marker.clear());
    this.markerWrappers.length = 0;
  }
  
  setFocus() {
    this.editor.editorLoaded().then(() => this.cm.focus());
  }
  delayedFocus() {
    setTimeout(() => this.setFocus());
  }
  
  containsStep(step) {
    return step === this.step;
  }
  
  setScriptEditor(scriptEditor) {
    this.scriptEditor = scriptEditor;
  }
  
  onInsertStepAfter(evt) {
    if (!this.scriptEditor) {
      lively.error('no ScriptEditor found (onInsertStepAfter)')
      return;
    }

    this.showTypeMenu(evt);
  }
  
  async showTypeMenu(evt) {
    const menuItems = ['transform', 'extract', 'descent'].map(type => {
      return [
        type,
        evt => {
          menu.remove();
          this.scriptEditor.insertStepAfter(type, this.step, this);
        },
        type,
        '<i class="fa fa-arrow-right" aria-hidden="true"></i>'
      ]
    })

    const menu = await ContextMenu.openIn(document.body, evt, undefined, document.body, menuItems);
  }
  
  onRemoveStep() {
    if (!this.scriptEditor) {
      lively.error('no ScriptEditor found (onRemoveStep)')
      return;
    }
    
    this.scriptEditor.removeStep(this, this.step);
    
    // #TODO: should focus next step editor
  }
  
  setToLoopStart() {
    const lastStep = this.step.getLastStep();
    
    // Reconfigure loop
    lastStep.nextStep = this.step;
  }
  
  setStep(step) {
    this.step = step;
    this.get('#stepType').innerHTML = step.type;
    this.editor.editorLoaded().then(() => {
      this.editor.value = step.source;
      // #TODO: this selection is only valid for default scripts, but fails on already edited scripts
      this.cm.setSelection(...this.step.getDefaultCursorPosition(), {scroll: true});
      this.autoIndentMax();
      
      requestAnimationFrame(() => {
        this.cm.refresh();
      });
    });
  }

  async stepSaved(text) {
    this.step.source = text;
    this.step.update();
  }
}

// #TODO: idea: using a list of all object, we can make them become anew
// go through all object reachable from window
document.querySelectorAll("vivide-script-editor").forEach(se => {
  se.getAllSubmorphs("vivide-step-editor").forEach(stepE => {
    // evil live programming
    stepE.constructor === VivideStepEditor

    // we can fix this, so we can do live development again....
    stepE.__proto__ = VivideStepEditor.prototype
  });
})
