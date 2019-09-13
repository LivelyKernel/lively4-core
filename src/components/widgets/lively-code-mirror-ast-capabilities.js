import { loc, range } from 'utils';

import babelDefault from 'systemjs-babel-build';
const babel = babelDefault.babel;

import ContextMenu from 'src/client/contextmenu.js';

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
  expandSelection() {
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
  
  selectNodes(nodes) {
    const ranges = nodes.map(node => {
      const [anchor, head] = range(node.loc).asCM();
      return { anchor, head };
    });
    this.editor.setSelections(ranges);
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
  
  async openMenu() {
    function fa(name) { return `<i class="fa fa-${name}"></i>`; }
    
    const menuItems = [
      ['selection to local variable', () => {
        menu.remove();
        this.extractExpressionIntoLocalVariable()
      }, '→', fa('arrow-up')],
    ];
    
    const menu = await ContextMenu.openIn(document.body, { /*clientX: x, clientY: y*/ }, undefined, document.body,  menuItems);
  }
  
  async extractExpressionIntoLocalVariable() {
    const { anchor, head } = this.editor.listSelections()[0];
    const selectionStart = loc(anchor);
    const selectionEnd = loc(head);
    let done = false;
    const pathLocationsToSelect = [];
    
    var cm = this.codeMirror;
    const scrollInfo = cm.getScrollInfo();
    
    const res = this.lcm.value.transformAsAST({
      Expression(path) {
        const pathLocation = path.node.loc;
        if (!done && pathLocation) {
          const pathStart = loc(pathLocation.start);
          const pathEnd = loc(pathLocation.end);

          const isSelectedPath = pathStart.isEqual(selectionStart) && selectionEnd.isEqual(pathEnd);
          if (isSelectedPath) {
            const t = babel.types;
            let value = '';
            path.traverse({
              Identifier(p) {
                value += '-'+p.node.name
              }
            });
            if (value.length > 0) {
              // #TODO: ensure unique identifier
              value = value.camelCase();
            } else {
              value = path.scope.generateUidIdentifier('temp').name;
            }
            const identifier = t.Identifier(value);
            const decl = babel.template('const ID = INIT;')({
              ID: identifier,
              INIT: path.node
            })
                            // lively.notify("HERE0");

            let referree = t.Identifier(value);
            
            // #TODO: ensure block to insert to
//             path.find(p => {
//               const parentPath = p.parentPath;
//               if (!parentPath) { return false; }

//               function ensureBlock(body) {
//                 if (!body.node) return null;

//                 if (body.isBlockStatement()) {
//                   return body.node;
//                 }

//                 const statements = [];
//                 if (body.isStatement()) {
//                   statements.push(body.node);
//                 } else if (body.parentPath.isArrowFunctionExpression() && body.isExpression()) {
//                   statements.push(t.returnStatement(body.node));
//                 } else {
//                   throw new Error("I never thought this was even possible.");
//                 }

//                 const blockNode = t.blockStatement(statements);
//                 body.replaceWith(blockNode);
//                 return blockNode;
//               }

//               if (
//                 p.parentKey === 'body' &&
//                 (
//                   parentPath.isFunction() ||
//                   parentPath.isFor() ||
//                   parentPath.isWhile()
//                 )
//               ) {
//                 ensureBlock(p);
//                 return true;
//               }
//               if (
//                 parentPath.isIfStatement() &&
//                 (p.parentKey === 'consequent' || p.parentKey === 'alternate')
//               ) {
//                 ensureBlock(p);
//                 return true;
//               }
//             });

            // lively.notify("HERE1");

            path.replaceWith(referree);
            const insertedDeclaration = path.getStatementParent().insertBefore(decl)[0]
            const insertedDeclarationIdentifier = insertedDeclaration.get('declarations')[0].get('id')
            
            pathLocationsToSelect.push(insertedDeclarationIdentifier.getPathLocation());
            pathLocationsToSelect.push(path.getPathLocation())
            
            done = true;
          }
        }
      }
    });
    this.lcm.value=res.code;
                // lively.notify("HERE2");

    const pathsToSelect = [];
    this.lcm.value.traverseAsAST({
      Program(path) {
        pathLocationsToSelect.forEach(location => {
          let p = path;
          const reg = /(\.[A-Za-z0-9]+|(\[[0-9]+\]))/ig;
          let result;
          while((result = reg.exec(location)) !== null) {
            let part = result[0]
            if (part.startsWith('.')) {
              part = part.replace('.', '')
              p = p.get(part);
            } else {
              part = part.replace(/\[|\]/ig, '')
              part = parseInt(part)
              p = p[part];
            }    
          }

          pathsToSelect.push(p)
        });
      }
    });
            // lively.notify("HERE3");

    this.selectPaths(pathsToSelect);
    this.lcm.focus();
    cm.scrollIntoView({
      left: scrollInfo.left,
      top: scrollInfo.top,
      right: scrollInfo.left + scrollInfo.width,
      bottom: scrollInfo.top + scrollInfo.height
    });
  }

  
}
