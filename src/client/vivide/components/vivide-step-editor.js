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
      // #KeyboardShortcut Alt-T insert new transform step after this one
      "Alt-T": cm => {
        this.scriptEditor.insertStepAfter('transform', this.step, this);
      },
      // #KeyboardShortcut Alt-E insert new extract step after this one
      "Alt-E": cm => {
        this.scriptEditor.insertStepAfter('extract', this.step, this);
      },
      // #KeyboardShortcut Alt-D insert new descent step after this one
      "Alt-D": cm => {
        this.scriptEditor.insertStepAfter('descent', this.step, this);
      },
      // #TODO: implement
      // #KeyboardShortcut Alt-Shift-Enter insert new vivide script step before this one
      "Shift-Alt-Enter": cm => {
        lively.warn("'Insert Before' not yet implemented", 'fallback to insertAfter');
        this.showTypeMenu();
      },
      // #KeyboardShortcut Alt-Shift-T insert new transform step before this one
      "Shift-Alt-T": cm => {
        lively.warn("'Insert Before' not yet implemented", 'fallback to insertAfter');
        this.scriptEditor.insertStepAfter('transform', this.step, this);
      },
      // #KeyboardShortcut Alt-Shift-E insert new extract step before this one
      "Shift-Alt-E": cm => {
        lively.warn("'Insert Before' not yet implemented", 'fallback to insertAfter');
        this.scriptEditor.insertStepAfter('extract', this.step, this);
      },
      // #KeyboardShortcut Alt-Shift-D insert new descent step before this one
      "Shift-Alt-D": cm => {
        lively.warn("'Insert Before' not yet implemented", 'fallback to insertAfter');
        this.scriptEditor.insertStepAfter('descent', this.step, this);
      },
      // #KeyboardShortcut Alt-Delete remove this step from vivide script
      "Alt-Delete": cm => {
        this.scriptEditor.removeStep(this, this.step);
      },
      // #KeyboardShortcut Alt-Backspace remove this step from vivide script
      "Alt-Backspace": cm => {
        this.scriptEditor.removeStep(this, this.step);
      },
      // #KeyboardShortcut Alt-Up focus previous step editor
      "Alt-Up": cm => {
        this.scriptEditor && this.scriptEditor.navigateStepEditors(this, false);
      },
      // #KeyboardShortcut Alt-Down focus next step editor
      "Alt-Down": cm => {
        this.scriptEditor && this.scriptEditor.navigateStepEditors(this, true);
      },
      // #KeyboardShortcut Alt-Right fold (inverse code folding)
      "Alt-Right": cm => {
        this.fold(); // #TODO: rename indent to fold and dedent to unfold
      },
      // #KeyboardShortcut Alt-Left unfold (inverse code folding)
      "Alt-Left": cm => {
        this.unfold();
      },
      // #KeyboardShortcut Ctrl-A expand current selection
      "Ctrl-A": cm => {
        this.expandSelection();
      },
      // #KeyboardShortcut Alt-L set this step as loop start
      "Alt-L": cm => {
        this.setToLoopStart();
      },
      // #KeyboardShortcut Shift-Alt-L expand current selection
      "Shift-Alt-L": cm => {
        this.scriptEditor && this.scriptEditor.removeLoop();
      },
    });
  }
  
  /**
   * Generic path utilities
   */
  ast() {
    const syntaxPlugins = [
      syntaxJsx,
      doExpressions,
      functionBind,
      asyncGenerators
    ];
    
    const src = this.editor.value;
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
    });
    
    return result.ast;
  }
  
  nextPath(startingPath, isValid) {
    let pathToShow;

    startingPath.traverse({
      enter(path) {
        if(!pathToShow && isValid(path)) {
          pathToShow = path;
        }
      }
    });

    return pathToShow;
  }
  
  getInnermostPath(startingPath, nextPathCallback) {
    let pathToShow = startingPath;
    while(true) {
      let nextPath = nextPathCallback(pathToShow);
      if(nextPath) {
        pathToShow = nextPath;
      } else {
        break;
      }
    }

    return pathToShow;
  }

  /**
   * Selections
   */
  nextPathContainingCursor(startingPath) {
    return this.nextPath(startingPath, path => {
      const location = path.node.loc;
      return this.isCursorIn(location, 'from') && this.isCursorIn(location, 'to');
    });
  }
  expandSelection() {
    const programPath = this.getPathForRoute([]);
    // go down to minimal selected node
    const pathToShow = this.getInnermostPath(programPath, prevPath => this.nextPathContainingCursor(prevPath));
    
    if(pathToShow) {
      // go up again
      let selectionStart = this.cm.getCursor('anchor');
      let selectionEnd = this.cm.getCursor();
      let maxPath = pathToShow.find(path => {
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
  
  /**
   * Code folding
   */
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
  unfold() {
    const prevPath = this.getPathForRoute(this.routeToShownPath)

    const pathToShow = prevPath.findParent(path => this.isValidFoldPath(path));
    
    if(pathToShow) {
      this.foldPath(pathToShow);
    } else {
      lively.warn("No previous folding level found");
    }
  }
  isValidFoldPath(path) {
    return path.isProgram() ||
      path.isForOfStatement() ||
      path.isArrowFunctionExpression();
  }
  nextFoldingPath(startingPath, obeyCursor) {
    return this.nextPath(startingPath, path => {
      const location = path.node.loc;
      if(obeyCursor && !this.isCursorIn(location, 'anchor')) { return false; }
      if(obeyCursor && !this.isCursorIn(location, 'head')) { return false; }

      return this.isValidFoldPath(path);
    });
  }
  fold() {
    const prevPath = this.getPathForRoute(this.routeToShownPath)
    
    let pathToShow = this.nextFoldingPath(prevPath, true);
    
    if(pathToShow) {
      this.foldPath(pathToShow);
    } else {
      lively.warn("No next folding level found");
    }
  }
  autoFoldMax() {
    const programPath = this.getPathForRoute([]);
    const pathToShow = this.getInnermostPath(programPath, prevPath => this.nextFoldingPath(prevPath, false));
    
    if(pathToShow) {
      this.foldPath(pathToShow);
    } else {
      lively.warn("No folding level for automatic fold found");
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
  foldPath(path) {
    this.removeFolding();

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
  removeFolding() {
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
  
  async showTypeMenu(evt) {
    const createStepAfterThisOne = type => {
      menu.remove();
      this.scriptEditor.insertStepAfter(type, this.step, this);
    };
    
    const menuItems = [[
      'transform',
      evt => createStepAfterThisOne('transform'),
      'Alt+T',
      '<i class="fa fa-arrow-right" aria-hidden="true"></i>'
    ], [
      'extract',
      evt => createStepAfterThisOne('extract'),
      'Alt+E',
      '<i class="fa fa-image" aria-hidden="true"></i>'
    ], [
      'descent',
      evt => createStepAfterThisOne('descent'),
      'Alt+D',
      '<i class="fa fa-arrow-down" aria-hidden="true"></i>'
    ]];

    // #TODO: is there a better way to position the menu? @Jens
    const menu = await ContextMenu.openIn(this.get('#menu-holder'), evt, undefined, document.body, menuItems);
  }
  
  setToLoopStart() {
    const lastStep = this.step.getLastStep();
    
    // Reconfigure loop
    lastStep.nextStep = this.step;
    
    this.scriptEditor.updateLoopState();
    this.scriptEditor.firstStep.update();
  }
  showLoopMarker() {
    this.get('#loopMarker').classList.add('loop-start');
  }
  hideLoopMarker() {
    this.get('#loopMarker').classList.remove('loop-start');
  }
  
  setStep(step) {
    this.step = step;
    this.get('#stepType').innerHTML = step.type;
    this.editor.editorLoaded().then(() => {
      this.editor.value = step.source;
      
      this.cm.setSelection(...this.step.getCursorPosition(), {scroll: true});
      
      const route = this.step.getRoute();
      if(route) {
        this.routeToShownPath = route;
        this.foldPath(this.getPathForRoute(route));
      } else {
        this.autoFoldMax();
      }
      
      requestAnimationFrame(() => this.cm.refresh());
    });
  }

  async stepSaved(text) {
    this.step.source = text;
    this.step.setCursorPosition(this.cm.getCursor('anchor'), this.cm.getCursor('head'));
    this.step.setRoute(this.routeToShownPath);

    this.step.update();
  }
}

// #UPDATE_INSTANCES
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
