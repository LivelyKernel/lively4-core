import Morph from 'src/components/widgets/lively-morph.js';
import ContextMenu from "src/client/contextmenu.js";

import babelDefault from 'src/external/babel/babel7default.js';
const babel = babelDefault.babel;
import {parseForAST} from "src/plugin-babel.js"

import { saveFile } from 'src/components/halo/lively-halo-vivide-save-script-item.js';

import { loc, range } from 'utils';

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
        this.fold();
      },
      // #KeyboardShortcut Alt-Left unfold (inverse code folding)
      "Alt-Left": cm => {
        this.unfold();
      },
      // #KeyboardShortcut Alt-A expand current selection
      "Alt-A": cm => {
        this.expandSelection();
      },
      // #KeyboardShortcut Alt-L set this step as loop start
      "Alt-L": cm => {
        this.scriptEditor && this.scriptEditor.setLoopStart(this.step);
      },
      // #KeyboardShortcut Shift-Alt-L expand current selection
      "Shift-Alt-L": cm => {
        this.scriptEditor && this.scriptEditor.removeLoop();
      },
      "Shift-Alt-S": cm => {
        const saveTarget = that;
        saveFile(saveTarget)
      }
    });
  }
  
  /**
   * Generic path utilities
   */
  ast() {
    const src = this.editor.value;
    return parseForAST(src).ast;
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
      let selectionStart = loc(this.cm.getCursor('anchor'));
      let selectionEnd = loc(this.cm.getCursor());
      let maxPath = pathToShow.find(path => {
        const pathLocation = path.node.loc;
        const pathStart = loc(pathLocation.start);
        const pathEnd = loc(pathLocation.end);
        
        return pathStart.isStrictBefore(selectionStart) || selectionEnd.isStrictBefore(pathEnd)
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
  toCMPosition(babelPosition) {
    return {
      line: babelPosition.line - 1,
      ch: babelPosition.column
    };
  }
  isCursorIn(location, cursorStart) {
    return range(location).contains(this.cm.getCursor(cursorStart));
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
      path.isFunctionExpression() ||
      path.isForAwaitStatement() ||
      (path.parentPath && path.parentPath.isYieldExpression()) ||
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
  
  async showTypeMenu() {
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
    const menu = await ContextMenu.openIn(document.body, undefined, undefined, document.body, menuItems);
    lively.setClientPosition(menu, lively.getClientPosition(this));
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
      
      this.setStepStyle()

      requestAnimationFrame(() => this.cm.refresh());
    });
  }

  setStepStyle() {
    const colors = new Map([
      ['transform', 'eeffee'],
      ['extract', 'ffffee'],
      ['descent', 'ffeeee'],
    ])
     
    this.editor.setCustomStyle(`
.CodeMirror { background-color: #${colors.get(this.step.type)}; }
`);
// .CodeMirror-activeline-background {
//     background: rgba(197, 42, 42, 0.78);
// }
// .CodeMirror-gutters { color: #282a36; }
// .CodeMirror-cursor { border-left: solid thin #f8f8f0; }
// .CodeMirror-linenumber { color: #6D8A88; }
// .CodeMirror-selected { background: rgba(255, 255, 255, 0.10); }
// .CodeMirror-line::selection, .CodeMirror-line > span::selection, .CodeMirror-line > span > span::selection { background: rgba(255, 255, 255, 0.10); }
// .CodeMirror-line::-moz-selection, .CodeMirror-line > span::-moz-selection, .CodeMirror-line > span > span::-moz-selection { background: rgba(255, 255, 255, 0.10); }
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
  se.getAllSubmorphs("vivide-step-editor").forEach(stepE => stepE.migrateTo(VivideStepEditor));
})
