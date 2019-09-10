import { promisedEvent, through, uuid as generateUUID } from 'utils';
import boundEval from 'src/client/bound-eval.js';
import Morph from "src/components/widgets/lively-morph.js"
import diff from 'src/external/diff-match-patch.js';
import SyntaxChecker from 'src/client/syntax.js';
import { debounce } from "utils";
import Preferences from 'src/client/preferences.js';
import {pt} from 'src/client/graphics.js';
import 'src/client/stablefocus.js';
import Strings from 'src/client/strings.js';
import { letsScript } from 'src/client/vivide/vivide.js';
import LivelyCodeMirrorWidgetImport from 'src/components/widgets/lively-code-mirror-widget-import.js';
import * as spellCheck from "src/external/codemirror-spellcheck.js"
import {isSet} from 'utils'
import fake from "./lively-code-mirror-fake.js"
import CodeMirror from "src/external/code-mirror/lib/codemirror.js"
self.CodeMirror = CodeMirror // for modules
let loadPromise = undefined;
import { loc, range } from 'utils';

/*MD ### AST-aware Navigation MD*/
export default class ASTCapabilities {
  
  constructor(lcm, cm) {
    this.lcm = lcm;
    this.codeMirror = cm;
  }
  get editor() { return this.lcm.editor; }
  get selectionRanges() {
    return this.editor.listSelections().map(range);
  }
  get programPath() {
    let programPath;
    this.lcm.value.traverseAsAST({
      Program(path) {
        programPath = path;
      }
    });
    return programPath;
  }
  getPathForRoute(route) {
    let path = this.programPath;
    if(!path) {
      lively.warn('No programPath found');
    }
    
    route.forEach(routePoint => {
      path = path.get(routePoint.inList ? routePoint.listKey + '.' + routePoint.key : routePoint.key);
    });
    
    return path;
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
  expandSelection(cm) {
    
    const maxPaths = this.editor.listSelections().map(({ anchor, head }) => {

      // go down to minimal selected node
      const nextPathContainingCursor = (startingPath, {anchor, head}) => {
        return this.nextPath(startingPath, path => {
          const location = range(path.node.loc);
          return location.contains(anchor) && location.contains(head);
        });
      }
      const pathToShow = this.getInnermostPath(this.programPath, prevPath => nextPathContainingCursor(prevPath, { anchor, head }));

      // go up again
      let selectionStart = loc(anchor);
      let selectionEnd = loc(head);
      return pathToShow.find(path => {
        const pathLocation = path.node.loc;
        const pathStart = loc(pathLocation.start);
        const pathEnd = loc(pathLocation.end);

        return pathStart.isStrictBefore(selectionStart) || selectionEnd.isStrictBefore(pathEnd)
      }) || pathToShow;
    });

    this.selectPaths(maxPaths);
  }
  forwardList(parentPath) {
    const linearizedPathList = [];
    parentPath.traverse({
      exit(path) { linearizedPathList.push(path); }
    });
    return linearizedPathList;
  }
  backwardList(parentPath) {
    const linearizedPathList = [];
    parentPath.traverse({
      enter(path) { linearizedPathList.push(path); }
    });
    return linearizedPathList.reverse();
  }
  selectNextASTNode(reversed) {
    const programPath = this.programPath;
    const pathList = reversed ? this.backwardList(programPath) : this.forwardList(programPath);

    const maxPaths = this.editor.listSelections().map(({ anchor, head }) => {

      // go down to minimal selected node
      const nextPathContainingCursor = (startingPath, {anchor, head}) => {
        return this.nextPath(startingPath, path => {
          const location = range(path.node.loc);
          return location.contains(anchor) && location.contains(head);
        });
      }
      let currentPath = this.getInnermostPath(programPath, prevPath => nextPathContainingCursor(prevPath, { anchor, head }));

      let selectionStart = loc(anchor);
      let selectionEnd = loc(head);
      const pathLocation = currentPath.node.loc;
      const pathStart = loc(pathLocation.start);
      const pathEnd = loc(pathLocation.end);

      // do we fully select the current path?
      if (selectionStart.isEqual(pathStart) && selectionEnd.isEqual(pathEnd)) {
        
        // check if parents have the same selection range
        currentPath.findParent(path => {
          const pathLocation = path.node.loc;
          const pathStart = loc(pathLocation.start);
          const pathEnd = loc(pathLocation.end);

          if (pathStart.isEqual(selectionStart) && selectionEnd.isEqual(pathEnd)) {
            currentPath = path;
          }

          return false;
        });

        const currentPathInList = pathList.find(path => path.node === currentPath.node);
        const currentIndex = pathList.indexOf(currentPathInList);
        const newPath = pathList[Math.min(currentIndex + 1, pathList.length -1)];
        return newPath;
      } else {
        return currentPath;
      }
    });

    this.selectPaths(maxPaths);
  }
  
  selectPaths(paths) {
    const ranges = paths.map(path => {
      const [anchor, head] = range(path.node.loc).asCM();
      return { anchor, head };
    });
    this.editor.setSelections(ranges);
  }
  selectPath(path) {
    range(path.node.loc).selectInCM(this.editor);
  }
  isCursorIn(location, cursorStart) {
    return range(location).contains(this.editor.getCursor(cursorStart));
  }
  
  
  get routeToShownPath() { return this._routeToShownPath = this._routeToShownPath || []; }
  set routeToShownPath(value) { return this._routeToShownPath = value; }
  get markerWrappers() { return this._markerWrappers = this._markerWrappers || []; }
  set markerWrappers(value) { return this._markerWrappers = value; }

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
    return true;
    return path.isProgram() ||
      path.isForOfStatement() ||
      path.isFunctionExpression() ||
      path.isForAwaitStatement() ||
      (path.parentPath && path.parentPath.isYieldExpression()) ||
      path.isArrowFunctionExpression();
  }
  nextFoldingPath(startingPath) {
    return this.nextPath(startingPath, path => {
      const location = path.node.loc;
      if(!this.isCursorIn(location, 'anchor')) { return false; }
      if(!this.isCursorIn(location, 'head')) { return false; }

      return this.isValidFoldPath(path);
    });
  }
  fold() {
    const prevPath = this.getPathForRoute(this.routeToShownPath)
    
    const pathToShow = this.nextFoldingPath(prevPath);
    
    if(pathToShow) {
      this.foldPath(pathToShow);
    } else {
      lively.warn("No next folding level found");
    }
  }
  autoFoldMax() {
    const pathToShow = this.getInnermostPath(this.programPath, prevPath => this.nextFoldingPath(prevPath));
    
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
      line: this.editor.lineCount(), ch: 0
    });

    requestAnimationFrame(() => {
      this.editor.refresh();
    });
  }
  /*MD ### END of AST-aware Navigation MD*/
  createWrapper(from, to) {
    const divStyle = {
      width: "2px",
      height: "1px",
      minWidth: "2px",
      minHeight: "1px",
      borderRadius: "1px",
      backgroundColor: "green"
    };

    return this.lcm.wrapWidget('div', from, to).then(div => {
      // div.innerHTML='<i class="fa fa-plus"></i>xx'
      Object.assign(div.style, divStyle);
      this.lcm.markerWrappers.push(div);
    });
  }
  removeFolding() {
    this.lcm.markerWrappers.forEach(wrapper => wrapper.marker.clear());
    this.lcm.markerWrappers.length = 0;
  }
  
  /*MD ### /AST-aware Navigation MD*/
}
