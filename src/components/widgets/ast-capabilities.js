import { loc, range } from 'utils';

import FileIndex from "src/client/fileindex.js";

import babelDefault from 'systemjs-babel-build';
const babel = babelDefault.babel;

const t = babel.types;
const template = babel.template;

var Pos = CodeMirror.Pos;
function copyCursor(cur) {
  return Pos(cur.line, cur.ch);
}
function lineLength(cm, lineNum) {
  return cm.getLine(lineNum).length;
}

export default class ASTCapabilities {

  constructor(codeProvider) {
    this.codeProvider = codeProvider;
    this.codeChanged();
  }

  get selectionRanges() {
    if (this.codeProvider.selections.length == 0) {
      return this.firstSelection;
    }
    return this.codeProvider.selections.map(range);
  }

  get firstSelection() {
    return range(this._getFirstSelectionOrCursorPosition());
  }

  _getFirstSelectionOrCursorPosition() {
    if (this.codeProvider.selections.length == 0) {
      return { anchor: this.codeProvider.cursor, head: this.codeProvider.cursor };
    }
    return this.codeProvider.selections[0];
  }

  newlineAndIndent(after) {
    const cm = this.codeProvider.codeMirror;

    const insertAt = copyCursor(cm.getCursor());
    if (insertAt.line === cm.firstLine() && !after) {
      // Special case for inserting newline before start of document.
      cm.replaceRange('\n', Pos(cm.firstLine(), 0));
      cm.setCursor(cm.firstLine(), 0);
    } else {
      insertAt.line = after ? insertAt.line : insertAt.line - 1;
      insertAt.ch = lineLength(cm, insertAt.line);
      cm.setCursor(insertAt);
      var newlineFn = CodeMirror.commands.newlineAndIndentContinueComment || CodeMirror.commands.newlineAndIndent;
      newlineFn(cm);
    }
  }

  livelyNotify() {
    const { livelyCodeMirror: lcm, codeMirror: cm } = this.codeProvider;

    const before = 'lively.notify(';
    const after = ')';

    const selectionTexts = cm.getSelections();
    cm.replaceSelections(selectionTexts.map(t => before + t + after), "around"
    // selections.forEach()
    );const selections = cm.listSelections();
    selections.forEach(({ anchor, head }) => {
      const [left, right] = loc(anchor).isBefore(head) ? [anchor, head] : [head, anchor];
      left.ch += before.length;
      right.ch -= after.length;
    });
    cm.setSelections(selections, undefined, {
      scroll: false
    });
  }

  // replace parent with me
  // #TODO: also for multiselections
  replaceParentWithSelection() {
    const scrollInfo = this.scrollInfo;
    lively.noti;
    let exitedEarly = false;

    let pathLocationToSelect;

    let transformed = this.sourceCode.transformAsAST(({ types: t, template }) => ({
      visitor: {
        Program: programPath => {

          const selectedPath = this.getInnermostPathContainingSelection(programPath, this.firstSelection);

          const parentPath = selectedPath.parentPath;

          // #TODO: which cases do we not want to support?
          if (false) {
            lively.warn('special case not supported');
            exitedEarly = true;
            return;
          }

          //           // #TODO: smooth some rough edges

          //           const variableDeclarator = declarationIdentifierPath.findParent(parentPath => parentPath.isVariableDeclarator());
          //           const variableDeclaration = declarationIdentifierPath.findParent(parentPath => parentPath.isVariableDeclaration());
          //           const initPath = variableDeclarator.get('init');

          // default case
          pathLocationToSelect = parentPath.getPathLocation();
          parentPath.replaceWith(selectedPath.node);
        }
      }
    }));

    if (exitedEarly) {
      return;
    }

    this.sourceCode = transformed.code;

    const pathsToSelect = this.pathLocationsToPathes([pathLocationToSelect]);
    this.selectPaths(pathsToSelect);

    this.scrollTo(scrollInfo);
  }

  generateIf(type) {
    const scrollInfo = this.scrollInfo;
    let exitedEarly = false;

    const pathLocationsToSelect = [];

    let transformed = this.sourceCode.transformAsAST(({ types: t, template }) => ({
      visitor: {
        Program: programPath => {

          const selectedPath = this.getInnermostPathContainingSelection(programPath, this.firstSelection);

          const statement = selectedPath.getStatementParent();
          pathLocationsToSelect.push(statement.getPathLocation() + '.test');

          statement.replaceWith(t.ifStatement(t.booleanLiteral(true), statement.node));
          if (type === 'condition') {} else if (type === 'then') {} else if (type === 'else') {}

          return;

          const identifier = this.getFirstSelectedIdentifier(selectedPath);
          if (!identifier) {
            lively.warn('no identifier selected');
            exitedEarly = true;
            return;
          }

          const name = identifier.node.name;
          if (!identifier.scope.hasBinding(name)) {
            lively.warn('no binding found for ' + name);
            exitedEarly = true;
            return;
          }

          let binding = identifier.scope.getBinding(name);
          if (!binding) {
            lively.warn('selected identifier is not referencing a variable ' + name);
            exitedEarly = true;
            return;
          }

          if (!['var', 'let', 'const'].includes(binding.kind)) {
            lively.warn('binding for "' + name + '" is of kind "' + binding.kind + '" but should be any of "var", "let", or "const"');
            exitedEarly = true;
            return;
          }

          const constantViolations = binding.constantViolations.map(cv => this.getFirstSelectedIdentifierWithName(cv, binding.identifier.name));
          if (constantViolations.length > 0) {
            lively.warn('cannot inline because there is a constant violation for variable ' + name);
            exitedEarly = true;
            return;
          }

          const declarationIdentifierPath = this.getBindingDeclarationIdentifierPath(binding);
          if (!declarationIdentifierPath.parentPath.isVariableDeclarator()) {
            lively.warn('declaration is probably in a destructuring');
            exitedEarly = true;
            return;
          }

          const referencePaths = binding.referencePaths;
          if (referencePaths.length === 0) {
            lively.warn('variable "' + name + '" is never referenced');
            exitedEarly = true;
            return;
          }

          const identifierPaths = [declarationIdentifierPath, ...referencePaths, ...constantViolations];
          if (!identifierPaths.includes(identifier)) {
            lively.warn('selected identifier is not referencing a variable ' + name);
            exitedEarly = true;
            return;
          }

          const variableDeclarator = declarationIdentifierPath.findParent(parentPath => parentPath.isVariableDeclarator());
          const variableDeclaration = declarationIdentifierPath.findParent(parentPath => parentPath.isVariableDeclaration());
          const initPath = variableDeclarator.get('init');

          // remove declaration
          if (variableDeclaration.get('declarations').length === 1) {
            variableDeclaration.remove();
          } else {
            variableDeclarator.remove();
          }

          // inline declaration
          referencePaths.forEach(p => {
            pathLocationsToSelect.push(p.getPathLocation());
          });
          referencePaths.forEach(p => {
            p.replaceWith(initPath.node);
          });
          const o = { a: 42, b: 17 };
        }
      }
    }));

    if (exitedEarly) {
      return;
    }

    this.sourceCode = transformed.code;

    const pathsToSelect = this.pathLocationsToPathes(pathLocationsToSelect);
    this.selectPaths(pathsToSelect);

    this.scrollTo(scrollInfo);
  }

  // # Swap if and else blocks of a conditional
  swapConditional() {
    const scrollInfo = this.scrollInfo;
    let exitedEarly = false;

    const pathLocationsToSelect = [];

    let transformed = this.sourceCode.transformAsAST(({ types: t, template }) => ({
      visitor: {
        Program: programPath => {

          const selectedPath = this.getInnermostPathContainingSelection(programPath, this.firstSelection);

          const ifStatement = selectedPath.find(p => p.isIfStatement());
          if (!ifStatement) {
            lively.warn('not within an if statement');
            exitedEarly = true;
            return;
          }

          pathLocationsToSelect.push(ifStatement.getPathLocation());

          const then = ifStatement.node.consequent;
          ifStatement.node.consequent = ifStatement.node.alternate || t.blockStatement([]);
          if (then.type === 'BlockStatement' && then.body.length === 0) {
            ifStatement.node.alternate = null;
          } else {
            ifStatement.node.alternate = then;
          }
        }
      }
    }));

    if (exitedEarly) {
      return;
    }

    this.sourceCode = transformed.code;

    const pathsToSelect = this.pathLocationsToPathes(pathLocationsToSelect);
    this.selectPaths(pathsToSelect);

    this.scrollTo(scrollInfo);
  }

  // # Swap if and else blocks of a conditional
  negateExpression() {
    const scrollInfo = this.scrollInfo;
    let exitedEarly = false;

    const pathLocationsToSelect = [];

    let transformed = this.sourceCode.transformAsAST(({ types: t, template }) => ({
      visitor: {
        Program: programPath => {

          const negatableBinaryOperators = {
            "==": "!=",
            "!=": "==",
            "===": "!==",
            "!==": "===",
            "<": ">=",
            "<=": ">",
            ">": "<=",
            ">=": "<"
          };

          const selectedPath = this.getInnermostPathContainingSelection(programPath, this.firstSelection);

          let pathToNegate = selectedPath.find(p => {
            const parentPath = p.parentPath;

            if (!parentPath) {
              return false;
            }

            if (parentPath.isIfStatement() && p.parentKey === 'test') {
              return true;
            }

            if (p.isBinaryExpression() && negatableBinaryOperators[p.node.operator]) {
              return true;
            }

            return false;
          });

          pathToNegate = pathToNegate || selectedPath.find(p => {
            const parentPath = p.parentPath;
            return parentPath && parentPath.isVariableDeclarator() && p.parentKey === 'init';
          });

          if (!pathToNegate) {
            lively.warn('not within a negatable node');
            exitedEarly = true;
            return;
          }

          pathLocationsToSelect.push(pathToNegate.getPathLocation());

          if (pathToNegate.isUnaryExpression() && pathToNegate.node.operator === '!') {
            pathToNegate.replaceWith(pathToNegate.get('argument').node);
          } else {
            const negatedOperator = negatableBinaryOperators[pathToNegate.node.operator];
            if (pathToNegate.isBinaryExpression() && negatedOperator) {
              pathToNegate.node.operator = negatedOperator;
            } else {
              pathToNegate.replaceWith(t.unaryExpression("!", pathToNegate.node));
            }
          }
        }
      }
    }));

    if (exitedEarly) {
      return;
    }

    this.sourceCode = transformed.code;

    const pathsToSelect = this.pathLocationsToPathes(pathLocationsToSelect);
    this.selectPaths(pathsToSelect);

    this.scrollTo(scrollInfo);
  }

  /*MD ## Navigation MD*/
  /**
   * Get the root path
  */
  get programPath() {
    if (!this.myProgramPath && !this.parsingFailed) {
      this.myProgramPath = this.programPathFor(this.sourceCode);
      this.parsingFailed = !this.myProgramPath;
    }
    return this.myProgramPath;
  }

  programPathFor(code) {
    var programPath = null;
    try {
      code.traverseAsAST({
        Program(path) {
          programPath = path;
        }
      });
    } catch (err) {
      return undefined;
    }

    return programPath;
  }

  get rootNode() {
    return this.programPath && this.programPath.parent;
  }

  /**
   * Invalidates old state on code change
  */
  codeChanged() {
    this.myProgramPath = undefined;
    this.parsingFailed = null;
    this.finishedEnrichment = false;
    this.memberAssignments = new Map();
    this.aexprs = undefined;
  }

  get canParse() {
    if (this.parsingFailed == null) this.programPath;
    return !this.parsingFailed;
  }

  /** 
   * Return first child in depth first search that satisfies a condition
   */
  nextPath(startingPath, isValid) {
    let pathToShow;

    startingPath.traverse({
      enter(path) {
        if (!pathToShow && isValid(path)) {
          pathToShow = path;
          path.stop();
        }
      }
    });

    return pathToShow;
  }

  /**
   * Return the last valid path that is generated by a given callback function on the previous path
   */
  getLastPath(startingPath, nextPathCallback) {
    let pathToShow = startingPath;
    while (true) {
      let nextPath = nextPathCallback(pathToShow);
      if (nextPath) {
        pathToShow = nextPath;
      } else {
        break;
      }
    }

    return pathToShow;
  }

  /**
   * Returns the first child of a node or the node itself, if it has no children
   */
  getFirstChildOrSelf(startingPath) {
    let child;
    startingPath.traverse({
      enter(path) {
        if (!child) {
          child = path;
        }
      }
    });
    return child || startingPath;
  }

  /**
  * Returns the nearest path before the cursor location
  */
  getPathBeforeCursor(startingPath, anchor) {
    const selectionStart = loc(anchor);
    let foundPath;
    startingPath.traverse({
      exit(path) {
        const pathLocation = path.node.loc;
        const pathEnd = loc(pathLocation.end);
        if (selectionStart.isBefore(pathEnd)) {
          path.stop();
          return;
        }
        foundPath = path;
      }
    });
    return foundPath;
  }

  /**
   * Returns the innermost node, that contains the selected text.
   */
  getInnermostPathContainingSelection(startingPath, selection) {
    // go down to minimal selected node
    const nextPathContainingCursor = (newStartingPath, selection) => {
      return this.nextPath(newStartingPath, path => {
        return range(path.node.loc).containsRange(selection);
      });
    };
    return this.getLastPath(startingPath, prevPath => nextPathContainingCursor(prevPath, selection));
  }

  getSelectedPaths(programPath) {
    return this.selectionRanges.map(selection => {
      const pathContainingWholeSelection = this.getInnermostPathContainingSelection(programPath, selection);

      //path already matches the selection
      if (this.isPathExactlySelected(pathContainingWholeSelection, selection)) {
        return pathContainingWholeSelection;
      }

      //find children that match the selection
      let selectedPaths = [];
      pathContainingWholeSelection.traverse({
        enter(path) {
          if (selection.containsPartsOfRange(range(path.node.loc))) {
            selectedPaths.push(path);
          }
          path.skip();
        }
      });
      return selectedPaths;
    }).flat();
  }

  getSelectedStatements(programPath) {
    return this.selectionRanges.map(selection => {
      //Replace with get surrounding statement?
      const pathContainingWholeSelection = this.getOutermostPathContainingSelectionWithMinimalSelectionRange(programPath, selection);

      if (t.isStatement(pathContainingWholeSelection) && !t.isBlockStatement(pathContainingWholeSelection)) {
        return pathContainingWholeSelection;
      }

      //find children that match the selection
      let selectedPaths = [];
      pathContainingWholeSelection.traverse({
        Statement(path) {
          if (selection.containsPartsOfRange(range(path.node.loc))) {
            selectedPaths.push(path);
          }
          path.skip();
        }
      });
      return selectedPaths;
    }).flat();
  }

  getSelectedExpressions(programPath) {
    return this.selectionRanges.map(selection => {
      //Replace with get surrounding statement?
      const pathContainingWholeSelection = this.getOutermostPathContainingSelectionWithMinimalSelectionRange(programPath, selection);

      if (t.isExpression(pathContainingWholeSelection) && !t.isIdentifier(pathContainingWholeSelection)) {
        return pathContainingWholeSelection;
      }
      //find children that match the selection
      let selectedPaths = [];
      pathContainingWholeSelection.traverse({
        Expression(path) {
          if (selection.containsPartsOfRange(range(path.node.loc)) && !t.isIdentifier(path)) {
            selectedPaths.push(path);
          }
          path.skip();
        }
      });
      return selectedPaths;
    }).flat();
  }

  /** 
   * Takes the outermost node which corresponding selection range is minimal for containing the selected text.
   * a      foo = bar
   * --b    foo
   *   --c  foo
   * 
   * In this example, when 'foo' is selected, b will be returned, since it is the outermost node that contains the
   * entire selection, but nothing more.
   */
  getOutermostPathContainingSelectionWithMinimalSelectionRange(startingPath, selection) {
    var currentPath = this.getInnermostPathContainingSelection(startingPath, selection);
    currentPath.findParent(path => {
      if (selection.isEqual(range(path.node.loc))) {
        currentPath = path;
      }
      return false;
    });
    return currentPath;
  }

  /**
   * Array of all children in depth first search order
   */
  forwardList(parentPath) {
    const linearizedPathList = [];
    parentPath.traverse({
      exit(path) {
        linearizedPathList.push(path);
      }
    });
    return linearizedPathList;
  }

  /**
   * Array of all children in reversed depth first search order
   */
  backwardList(parentPath) {
    const linearizedPathList = [];
    parentPath.traverse({
      enter(path) {
        linearizedPathList.push(path);
      }
    });
    return linearizedPathList.reverse();
  }

  /**
   * select the selection range of the next ast node after the current selection that satisfies a given condition
   * select previous selection instead of next, if reversed is set to true
   */
  selectNextASTNodeWith(condition, reversed) {
    const programPath = this.programPath;
    const pathList = reversed ? this.backwardList(programPath) : this.forwardList(programPath);

    const maxPaths = this.selectionRanges.map(selection => {

      const currentPath = this.getOutermostPathContainingSelectionWithMinimalSelectionRange(programPath, selection);

      // do we fully select the current path?
      if (selection.isEqual(range(currentPath.node.loc))) {
        return this.getNextASTNodeInListWith(condition, pathList, currentPath);
      } else {
        return currentPath;
      }
    });

    this.selectPaths(maxPaths);
  }

  getFirstSelectedIdentifier(startPath) {
    if (t.isIdentifier(startPath.node)) {
      return startPath;
    }
    var first;
    startPath.traverse({
      Identifier(path) {
        if (!first) {
          first = path;
          path.stop();
        }
      }
    });
    return first;
  }

  getFirstSelectedIdentifierWithName(startPath, name) {
    if (t.isIdentifier(startPath.node, { name: name })) {
      return startPath;
    }
    var first;
    startPath.traverse({
      Identifier(path) {
        if (!first && t.isIdentifier(path.node, { name: name })) {
          first = path;
          path.stop();
        }
      }
    });
    return first;
  }

  getAllIdentifiers(startPath) {
    var identifiers = [];
    startPath.traverse({
      Identifier(path) {
        identifiers.push(path);
      }
    });
    return identifiers;
  }

  getDeclaration(identifier) {
    if (identifier.scope.hasBinding(identifier.node.name)) {
      return identifier.scope.getBinding(identifier.node.name).path;
    }
  }

  getBindingDeclarationIdentifierPath(binding) {
    return this.getFirstSelectedIdentifierWithName(binding.path, binding.identifier.name);
  }

  getBindingsInFile(startPath) {
    var identifier = this.getFirstSelectedIdentifier(startPath);
    if (!identifier) return [];
    const astBindings = this.getASTBinding(identifier);

    if (astBindings) {
      return astBindings;
    }

    return this.getClassBindings(identifier);
  }

  /**
   * Returns all bindings of a given identifier
   */
  getASTBinding(identifier) {
    if (identifier.scope.hasBinding(identifier.node.name)) {
      const binding = identifier.scope.getBinding(identifier.node.name);
      const identifierPaths = [...new Set([this.getBindingDeclarationIdentifierPath(binding), ...binding.referencePaths, ...binding.constantViolations.map(cv => this.getFirstSelectedIdentifierWithName(cv, binding.identifier.name))])];
      if (identifierPaths.includes(identifier)) {
        return identifierPaths;
      }
    }
    return undefined;
  }

  /**
   * Returns bindings of given identifier in its class
   */
  getClassBindings(identifier) {
    if (t.isMemberExpression(identifier.parent)) {
      if (t.isThisExpression(identifier.parent.object)) {
        let classPath = this.getClassPath(this.programPath);
        let methodPath = this.getMethodPath(classPath, identifier.node.name);
        if (methodPath) {
          return this.getClassMethodBindings(methodPath);
        } else {
          return this.getMemberBindings(identifier);
        }
      }
    } else if (t.isClassMethod(identifier.parent)) {
      return this.getClassMethodBindings(identifier.parentPath);
    }
  }

  getClassMethodBindings(classMethod) {
    var methodIdentifier;
    classMethod.traverse({
      Identifier(path) {
        path.stop();
        methodIdentifier = path;
      }
    });
    return [methodIdentifier, ...this.getMemberBindings(methodIdentifier)];
  }

  /**
   * if getUnbound is set to true, instead of getting all member Expressions with this (= that are bound) we only get those, that are unbound
   */
  getMemberBindings(identifier, getUnbound = false, startPath = this.programPath) {
    var members = [];
    startPath.traverse({
      Identifier(path) {
        if (t.isMemberExpression(path.parent) && path.node.name === identifier.node.name) {
          if (getUnbound || t.isThisExpression(path.parent.object)) {
            members.push(path);
          }
        }
      }
    });
    return members;
  }

  getAllUnboundIdentifierNames(startPath = this.programPath) {
    var unboundIdentifiers = [];
    startPath.traverse({
      Identifier(path) {
        if (t.isMemberExpression(path.parent)) {
          if (!t.isThisExpression(path.parent.object)) {
            unboundIdentifiers.push(path);
          }
        }
      }
    });
    return unboundIdentifiers.map(binding => binding.node.name).filter((value, index, self) => self.indexOf(value) === index);
  }

  getNextASTNodeInListWith(conditionFunc, pathList, path) {
    const currentPathInList = pathList.find(pathInList => pathInList.node === path.node);
    const currentIndex = pathList.indexOf(currentPathInList);
    for (var i = currentIndex + 1; i < pathList.length; i++) {
      if (conditionFunc(path, pathList[i])) {
        return pathList[i];
      }
    }
    return pathList[pathList.length - 1];
  }

  /** 
   * Select the text corresponding to the given nodes
   */
  selectNodes(nodes, selectStringContentsOnly = false) {
    const ranges = nodes.map(node => {
      let selectedRange = range(node.loc);
      if (selectStringContentsOnly) {
        //only select the contents, not the quotes around it 
        selectedRange.start._cmCharacter++;
        selectedRange.end._cmCharacter--;
      }
      return selectedRange;
    });
    this.codeProvider.selections = ranges;
  }

  /** 
   * Select the text corresponding to the given paths
   */
  selectPaths(paths, selectStringContentsOnly = false) {
    this.selectNodes(paths.map(path => path.node), selectStringContentsOnly);
  }

  /** 
   * Get the path for the first method with the given name
   */
  getMethodPath(programPath, name) {
    let methodPath;
    programPath.traverse({
      ClassMethod(path) {
        if (!methodPath && path.node.key.name == name) {
          methodPath = path;
        }
      },
      FunctionDeclaration(path) {
        if (!methodPath && path.node.id.name == name) {
          methodPath = path;
        }
      }
    });
    return methodPath;
  }

  /** 
   * Get the path of the first class
   */
  getClassPath(programPath) {
    let classPath;
    programPath.traverse({
      ClassDeclaration(path) {
        if (!classPath) {
          classPath = path;
        }
      }
    });
    return classPath;
  }

  getColorLiterals() {
    var pPath = this.programPath;
    if (!pPath) return;
    let colorPaths = [];
    const colorRegex = /(0[xX]|#)[0-9a-fA-F]{6}$/g;
    pPath.traverse({
      StringLiteral(path) {
        if (path.node.value.match(colorRegex)) {
          colorPaths.push(path);
        }
      }
    });
    return colorPaths;
  }

  /*MD ### Shortcuts MD*/

  expandSelection() {
    const maxPaths = this.selectionRanges.map(selection => {
      const pathToShow = this.getInnermostPathContainingSelection(this.programPath, selection);

      // go up again
      return pathToShow.find(path => {
        return range(path.node.loc).strictlyContainsRange(selection);
      }) || pathToShow;
    });

    this.selectPaths(maxPaths);
  }

  reduceSelection() {
    const maxPaths = this.selectionRanges.map(selection => {
      const pathToShow = this.getInnermostPathContainingSelection(this.programPath, selection);

      return this.getFirstChildOrSelf(pathToShow);
    });

    this.selectPaths(maxPaths);
  }

  selectNextASTChild(reversed) {
    return this.selectNextASTNodeWith((currentNode, nextNode) => {
      return t.isIdentifier(nextNode) || t.isLiteral(nextNode) || t.isThisExpression(nextNode) || t.isSuper(nextNode) || t.isDebuggerStatement(nextNode);
    }, reversed);
  }

  selectNextASTNodeLikeThis(reversed) {
    return this.selectNextASTNodeWith((currentNode, nextNode) => currentNode.type == nextNode.type, reversed);
  }

  selectNextReference(reversed) {
    const selectedPath = this.getInnermostPathContainingSelection(this.programPath, this.firstSelection);

    const bindings = this.getBindingsInFile(selectedPath);if (bindings) {
      let sortedBindings = [...bindings].sort((a, b) => a.node.start - b.node.start);
      let index = sortedBindings.indexOf(selectedPath);
      index += reversed ? -1 : 1;
      index = (index + sortedBindings.length) % sortedBindings.length;
      this.selectPaths([sortedBindings[index]]);
    }
  }

  async selectDeclaration() {
    const selectedPath = this.getInnermostPathContainingSelection(this.programPath, this.firstSelection);
    const identifier = this.getFirstSelectedIdentifier(selectedPath);
    if (!identifier) {
      return;
    }
    const identName = identifier.node.name;

    const declaration = await this.getDeclaration(identifier);
    //needs smarter selection of source
    if (declaration && !t.isImportSpecifier(declaration)) {
      this.selectPaths([declaration]);
    } else {
      let classPath = this.getClassPath(this.programPath);
      let methodPath = this.getMethodPath(classPath, identName);
      if (methodPath) {
        this.selectNodes([methodPath.node.key]);
      } else {

        // Find the declaration in other files and open the possible files in a new browser at the correct location
        const classUrls = await this.getCorrespondingClasses(identName).then(arr => arr.map(cl => cl.url));
        const functionUrls = await this.getFunctionExportURLs(identName);
        const urls = classUrls.concat(functionUrls);

        urls.forEach(url => lively.openBrowser(url, true).then(container => {
          container.asyncGet("#editor").then(async livelyEditor => {
            let newCodeMirror = livelyEditor.livelyCodeMirror();
            var cm = await livelyEditor.awaitEditor();
            newCodeMirror.astCapabilities(cm).then(ac => {
              ac.selectPaths([ac.getMethodPath(ac.programPath, identName)]);
            });
          });
        }));
      }
    }
    /**
      TODO: if our dependencies don't have the method, we can search all classes    
      Also: do not only search for methods, but for members too (even though they are technically not bindings?)
    */
  }

  async rename() {
    const selectedPath = this.getInnermostPathContainingSelection(this.programPath, this.firstSelection);

    var identifier = this.getFirstSelectedIdentifier(selectedPath);
    if (!identifier) return;
    const astBindings = this.getASTBinding(identifier);

    // If there is a binding in the current AST, all references get selected for renaming
    if (astBindings) {
      this.selectPaths(astBindings);
      return;
    }

    /**
     * If not: the user gets a list of all possible occurrences and can select entries for renaming and can choose the new name.
     * Afterwards the selected occurrences in other files get refactored in the background.
     */
    const bindingItems = await this.getPossibleBindingsAcrossFiles(identifier);

    let comp = await lively.openComponentInWindow("lively-code-occurence-selection");
    comp.focus();
    comp.setAdditionalInput("Name", "enter new name");
    comp.setTitle("Rename " + identifier.node.name);
    const references = await comp.selectItems(bindingItems);

    const newName = comp.getAdditionalInput().camelCase();
    if (newName === "") return;

    for (const reference of references) {
      const code = await fetch(reference.url).then(r => r.text());

      const codeLines = code.split("\n");

      String.prototype.replaceBetween = function (start, end, what) {
        return this.substring(0, start) + what + this.substring(end);
      };
      codeLines[reference.line] = codeLines[reference.line].replaceBetween(reference.ch, reference.ch + identifier.node.name.length, newName);

      const newCode = codeLines.join("\n");
      await lively.files.saveFile(reference.url, newCode);
      await lively.reloadModule(reference.url);
      await System.import(reference.url);
    }
  }

  selectBindings() {
    const selectedPath = this.getInnermostPathContainingSelection(this.programPath, this.firstSelection);

    const bindings = this.getBindingsInFile(selectedPath);
    if (bindings) {
      this.selectPaths(bindings);
    }
  }

  async printAllBindings() {
    const selectedPath = this.getInnermostPathContainingSelection(this.programPath, this.firstSelection);

    // const bindings = this.getBindings(selectedPath);
    var identifier = this.getFirstSelectedIdentifier(selectedPath);

    // find classes that contain the method
    const bindingItems = await this.getPossibleBindingsAcrossFiles(identifier);

    this.openReferencesMenu(bindingItems, identifier.node.name);
  }

  /**
   * Uses the FileIndex to look for possible bindings in other files and returns an array containing elements with the name of found files, their urls and the line and column of the occurrence.
   */
  async getPossibleBindingsAcrossFiles(identifier) {
    let index = await FileIndex.current();
    let ids = await index.db.files.filter(file => {
      if (!file.unboundIdentifiers) return false;
      return file.unboundIdentifiers.some(id => id.name == identifier.name);
    }).toArray();
    const bindingItems = [];

    for (const id of ids) {
      const code = await fetch(id.url).then(r => r.text());
      const program = this.programPathFor(code);
      for (const reference of this.getMemberBindings(identifier, true, program)) {
        const line = reference.node.loc.start.line - 1;
        const ch = reference.node.loc.start.column;
        bindingItems.push({ id: id.url.substring(id.url.lastIndexOf("/") + 1) + ": " + line, url: id.url, line, ch });
      }
    }

    return bindingItems;
  }

  async openReferencesMenu(ids, identifierName) {
    let comp = await lively.openComponentInWindow("lively-code-occurence-selection");
    comp.focus();
    comp.setTitle("References of " + identifierName);
    return comp.selectItems(ids);
  }

  async findImports() {
    let functions, classes, identName;
    const selectedPath = this.getInnermostPathContainingSelection(this.programPath, this.firstSelection);
    const identifier = this.getFirstSelectedIdentifier(selectedPath);
    if (identifier) {
      identName = identifier.node.name;
      functions = await this.getFunctionExportURLs(identName);
      classes = await this.getCorrespondingClasses(identName);
    }
    return { identName, functions, classes };
  }
  /*MD ## Factoring Menu MD*/

  /*MD ### Factoring Menu Helper Methods MD*/

  // returns innermostDescribePath 
  isInDescribe(path) {
    let possiblePath = this.isIn("CallExpression", path, "describe");

    while (possiblePath !== null) {
      if (possiblePath.node && possiblePath.node.callee.name === "describe") {
        break;
      }
      possiblePath = this.isIn("CallExpression", possiblePath.parentPath, "describe");
    }
    return possiblePath;
  }

  // returns a parentPath if path is somewhere in a path with a type stored in type
  // or null if no type matches
  // type can be a single type string or an array of type strings
  isIn(type, path) {
    while (path !== null) {
      if (this.isDirectlyIn(type, path)) {
        return path;
      }
      path = path.parentPath;
    }
    return null;
  }

  // returns if path is directly in a path with a type stored in type
  // type can be a single type string or an array of type strings 
  isDirectlyIn(type, path) {
    if (type instanceof Array) {
      return type.map(elem => this.isDirectlyIn(elem, path)).reduce((accu, elem) => accu || elem, false);
    }
    return path.node && path.node.type === type;
  }

  /*MD ## Color Picker MD*/

  updateColor(currentLocation, color) {
    var location = { anchor: currentLocation, head: currentLocation };
    const scrollInfo = this.scrollInfo;
    this.sourceCode = this.sourceCode.transformAsAST(() => ({
      visitor: {
        Program: programPath => {
          const path = this.getInnermostPathContainingSelection(programPath, range(location)); //this.getPathBeforeCursor(programPath, currentLocation);
          if (t.isStringLiteral(path.node)) {
            path.node.value = color;
          }
        }
      }
    })).code;
    this.scrollTo(scrollInfo);
  }
  /*MD ## Generations MD*/

  /*MD ### Generate Testcase / Class / get / set / HTML accessors MD*/

  async openHTMLAccessorsMenu(ids, initialSelectionState) {
    let comp = await lively.openComponentInWindow("lively-code-occurence-selection");
    comp.focus();
    comp.setTitle("Select HTML Accessors to generate");
    return comp.selectItems(ids, initialSelectionState);
  }

  getExistingAccessors() {
    let classMethodIdentifier = [];
    this.programPath.traverse({
      ExportDefaultDeclaration(path) {
        if (path && path.node.declaration && path.node.declaration.type == "ClassDeclaration") {
          classMethodIdentifier = path.node.declaration.body.body.map(elem => elem.key.name);
          path.stop();
        }
      }
    });
    return classMethodIdentifier;
  }

  async generateHTMLAccessors() {
    const ids = await this.compileListOfIDs();
    if (ids.length === 0) {
      return;
    }

    let existingMethods = this.getExistingAccessors();
    let initialSelectionState = ids.map(elem => existingMethods.includes(this.generateMethodNameFromProperty(elem.id)));
    const selectedItems = await this.openHTMLAccessorsMenu(ids, initialSelectionState);

    if (selectedItems.length === 0) {
      return;
    }
    lively.warn(`${selectedItems.length} Accessors generated`);

    selectedItems.forEach(item => {
      this.generateCodeFragment(item.id, name => this.compileHTMLGetter(name));
      const selectedPath = this.getInnermostPathContainingSelection(this.programPath, this.firstSelection);
      let line = selectedPath.parent.loc.end.line + 1;
      this.codeProvider.cursor = loc({ line, ch: 0 });
    });
  }

  // collects all html element ids of the current file
  async compileListOfIDs() {
    const htmlURI = this.codeProvider.htmlURI;
    let html = await htmlURI.fetchText();

    if (html === "File not found!\n") {
      lively.warn("There is no HTML associated with this file.");
      return [];
    }

    let tmp = <div></div>;
    tmp.innerHTML = html;
    let ids = tmp.childNodes[0].content.querySelectorAll("[id]").map(ea => ea.id);

    const htmlLines = html.split("\n");

    const idsWithLocation = [];
    for (const id of ids) {
      for (const line of htmlLines) {
        const indexOfId = line.indexOf("id=\"" + id + "\"");
        if (indexOfId !== -1) {
          idsWithLocation.push({ id, url: htmlURI, line: htmlLines.indexOf(line), ch: indexOfId + 4 });
          break;
        }
      }
    }
    return idsWithLocation;
  }

  generateTestCase() {
    this.generateCodeFragment("ExplainWhatIsTested", id => this.compileTestCase(id.identifier));
  }

  generateGetter() {
    this.generateCodeFragment("NameThisGetter", id => this.compileGetter(id.identifier));
  }

  generateSetter() {
    this.generateCodeFragment("NameThisSetter", id => this.compileSetter(id.identifier));
  }

  generateClass() {
    this.generateCodeFragment("SetClassName", id => this.compileClass(id.identifier));
  }

  async generateCodeFragment(identifier, replacementGenerator) {
    const scrollInfo = this.scrollInfo;
    const selection = this.firstSelection;

    var identifierObject = { identifier };

    var generatedCode;
    this.sourceCode = this.sourceCode.transformAsAST(() => ({
      visitor: {
        Program: programPath => {
          let pathBefore = this.getPathBeforeCursor(programPath, selection.start);
          let pathWithin = this.getInnermostPathContainingSelection(programPath, this.firstSelection);
          generatedCode = replacementGenerator(identifierObject);
          if (pathBefore === undefined) {
            // we're on top of the program
            pathWithin.unshiftContainer('body', generatedCode);
          } else if (this.isDirectlyIn(pathWithin.type, pathBefore.parentPath)) {
            // we're inside of a code block, but not in the first line
            pathBefore.insertAfter(generatedCode);
          } else {
            // we're in the first line of a block
            pathWithin.unshiftContainer('body', generatedCode);
          }
        }
      }
    })).code;

    // after code generation, we have to find the generated code another time to be able to select it for renaming
    var pathToSelect;
    this.programPath.traverse({
      StringLiteral(path) {
        if (!pathToSelect && path.node.value == identifierObject.identifier) {
          pathToSelect = path;
        }
      },
      Identifier(path) {
        if (path.node.name == identifierObject.identifier) {
          pathToSelect = path;
          path.stop();
        }
      }
    });
    this.selectPaths([pathToSelect], true);

    this.scrollTo(scrollInfo);
  }

  compileTestCase(explanation) {
    return template("it(EXP, () => {\n" + "let put = 'code here';" + "})")({
      EXP: t.stringLiteral(explanation)
    });
  }

  compileGetter(propertyName) {
    return t.classMethod("get", t.identifier(propertyName), [], t.blockStatement([t.returnStatement(t.memberExpression(t.thisExpression(), t.identifier("internalPropertyName")))]));
  }

  compileSetter(propertyName) {
    return t.classMethod("set", t.identifier(propertyName), [t.Identifier("newValue")], t.blockStatement([t.expressionStatement(t.assignmentExpression("=", t.memberExpression(t.thisExpression(), t.identifier("internalPropertyName")), t.identifier("newValue")))]));
  }

  compileClass(className) {
    return t.classDeclaration(t.identifier(className), null, t.classBody([t.classMethod("constructor", t.Identifier("constructor"), [], t.blockStatement([]))]), []);
  }

  compileHTMLGetter(property) {
    var propertyName = property.identifier;
    var methodName = this.generateMethodNameFromProperty(propertyName);
    property.identifier = methodName;
    return t.classMethod("get", t.identifier(methodName), [], t.blockStatement([t.returnStatement(t.callExpression(t.memberExpression(t.thisExpression(), t.identifier("get")), [t.stringLiteral("#" + propertyName)]))]));
  }

  generateMethodNameFromProperty(name) {
    return name.camelCase();
  }

  /*MD ### Generate Import MD*/

  /**
   * Converts the selected expression to a member expression and adds an import to the file if it doesn't already exist.
   */
  addImport(url, importName, isFunction) {
    const selection = this.firstSelection;
    const scrollInfo = this.scrollInfo;
    this.sourceCode = this.sourceCode.transformAsAST(() => ({
      visitor: {
        Program: programPath => {
          let existingImportStatement = this.nextPath(programPath, path => {
            return t.isImportDeclaration(path) && path.node.source.value == url;
          });
          let selectedPath = this.getInnermostPathContainingSelection(programPath, selection);
          if (!existingImportStatement) {
            let importStatement = t.importDeclaration([t.importSpecifier(t.identifier(importName), t.identifier(importName))], t.stringLiteral(url));
            programPath.node.body.unshift(importStatement);
          } else if (!existingImportStatement.node.specifiers.some(spec => spec.imported.name == importName)) {
            existingImportStatement.node.specifiers.push(t.identifier(importName));
          }
          if (!isFunction) {
            selectedPath.replaceWith(t.memberExpression(t.identifier(importName), t.identifier(selectedPath.node.name)));
          }
        }
      }
    })).code;
    this.scrollTo(scrollInfo);
  }

  /*MD ## Transformations MD*/

  /*MD ### Extract Method MD*/
  findParameters(identifiers, surroundingMethod, actualSelections) {
    return identifiers.filter(identifier => {
      return this.needsToBeParameter(identifier, surroundingMethod);
    }).filter(identifier => {
      const bindingPath = identifier.scope.getBinding(identifier.node.name).path;
      return !this.isSelected(bindingPath, actualSelections);
    }).map(identifier => {
      return this.getBindingDeclarationIdentifierPath(identifier.scope.getBinding(identifier.node.name)).node;
    });
  }

  shouldBeAsync(content) {
    let hasAwait = false;
    content.forEach(startPath => {
      if (t.isAwaitExpression(startPath.node)) {
        hasAwait = true;
      } else {
        startPath.traverse({
          AwaitExpression(path) {
            hasAwait = true;
            path.stop();
          }
        });
      }
    });

    return hasAwait;
  }

  couldBeStatic(content) {
    let hasThis = false;
    content.forEach(startPath => {
      startPath.traverse({
        ThisExpression(path) {
          hasThis = true;
          path.stop();
        }
      });
    });

    return !hasThis;
  }

  needsToBeParameter(identifier, surroundingMethod) {
    return identifier.scope.hasBinding(identifier.node.name) && !surroundingMethod.parentPath.scope.hasBinding(identifier.node.name);
  }

  findReturnValues(identifiers, surroundingMethod, actualSelections) {
    const bindings = [...new Set(identifiers.filter(identifier => {
      return identifier.scope.hasBinding(identifier.node.name) && !surroundingMethod.parentPath.scope.hasBinding(identifier.node.name);
    }).map(identifier => {
      return identifier.scope.getBinding(identifier.node.name);
    }))];

    return bindings.filter(binding => {
      const declarationInSelection = this.isSelected(binding.path, actualSelections);
      const constantViolationInSelection = binding.constantViolations.some(constantViolation => this.isSelected(constantViolation, actualSelections));
      const referenceOutsideSelection = binding.referencePaths.some(reference => !this.isSelected(reference, actualSelections));

      return this.needsToBeReturned(declarationInSelection, constantViolationInSelection, referenceOutsideSelection);
    }).map(binding => {
      const constantViolationOutsideSelection = binding.constantViolations.some(constantViolation => !this.isSelected(constantViolation, actualSelections));
      return { node: this.getBindingDeclarationIdentifierPath(binding).node, declaredInExtractedCode: this.isSelected(binding.path, actualSelections), constantViolationOutsideSelection };
    });
  }

  needsToBeReturned(declarationInSelection, constantViolationInSelection, referenceOutsideSelection) {
    return !declarationInSelection && constantViolationInSelection || (constantViolationInSelection || declarationInSelection) && referenceOutsideSelection;
  }

  createMethod(content, parameter, returnValues, scope, extractingExpression, shouldBeAsync, shouldBeStatic) {
    if (extractingExpression && returnValues.length > 0) {
      lively.warn("Unable to extract an expression, that assigns something to variables used outside the expression.");
    }
    var returnStatement;
    returnValues.forEach(returnValue => returnValue.returnIdentifier = returnValue.declaredInExtractedCode ? returnValue.node : t.identifier(returnValue.node.name + "_return"));
    if (returnValues.length == 1) {
      returnStatement = t.returnStatement(returnValues[0].node);
    } else if (returnValues.length > 1) {
      returnStatement = t.returnStatement(t.objectExpression(returnValues.map(i => t.objectProperty(i.returnIdentifier, i.node, false, true))));
    }

    var methodContent = content.map(p => {
      //remove formatting for proper re-formatting
      p.node.loc = null;
      p.node.start = null;
      p.node.end = null;
      return p.node;
    });
    if (returnStatement) {
      methodContent.push(returnStatement);
    } else if (extractingExpression) {
      methodContent = [t.returnStatement(content[0].node)];
    }
    const newMethod = t.classMethod("method", t.identifier("HopefullyNobodyEverUsesThisMethodName"), parameter, t.blockStatement(methodContent));
    newMethod.async = shouldBeAsync;
    newMethod.static = shouldBeStatic;
    scope.insertAfter(newMethod);
    for (let i = 0; i < content.length - 1; i++) {
      content[i].remove();
    }
    var methodCall;
    var callExpression = t.callExpression(t.identifier("this.HopefullyNobodyEverUsesThisMethodName"), parameter);
    if (shouldBeAsync) {
      lively.warn("Extracting async method. This could change the control flow.");
      callExpression = t.awaitExpression(callExpression);
    }
    if (returnValues.length == 1) {
      if (returnValues[0].declaredInExtractedCode) {
        const variableType = returnValues[0].constantViolationOutsideSelection ? "var" : "const";
        methodCall = [t.variableDeclaration(variableType, [t.variableDeclarator(returnValues[0].node, callExpression)])];
      } else {
        methodCall = [t.expressionStatement(t.assignmentExpression("=", returnValues[0].node, callExpression))];
      }
    } else if (returnValues.length > 1) {
      const objectPattern = t.objectPattern(returnValues.map(i => t.objectProperty(i.returnIdentifier, i.returnIdentifier, false, true)));
      methodCall = [t.variableDeclaration("const", [t.variableDeclarator(objectPattern, callExpression)])];
      returnValues.forEach(returnStatement => {
        if (returnStatement.node != returnStatement.returnIdentifier) {
          methodCall.push(t.expressionStatement(t.assignmentExpression("=", returnStatement.node, returnStatement.returnIdentifier)));
        }
      });
    } else {
      methodCall = [callExpression];
    }
    content[content.length - 1].replaceWithMultiple(methodCall);
  }

  async extractMethod() {
    const scrollInfo = this.scrollInfo;
    const transformed = this.sourceCode.transformAsAST(({ types: t, template }) => ({
      visitor: {
        Program: programPath => {
          const extraction = this.selectMethodExtraction(programPath);
          if (!extraction) return;
          const {
            selectedPaths,
            extractingExpression,
            actualSelections
          } = extraction;

          const identifiers = selectedPaths.map(this.getAllIdentifiers).flat();
          let surroundingMethod = selectedPaths[0].find(parent => {
            return parent.node.type == "ClassMethod";
          });
          var shouldBeStatic = this.couldBeStatic(selectedPaths);
          if (!surroundingMethod) {
            surroundingMethod = selectedPaths[selectedPaths.length - 1];
          } else {
            shouldBeStatic = surroundingMethod.node.static;
          }
          const shouldBeAsync = this.shouldBeAsync(selectedPaths);
          const parameters = this.findParameters(identifiers, surroundingMethod, actualSelections);
          const returnValues = this.findReturnValues(identifiers, surroundingMethod, actualSelections);
          this.createMethod(selectedPaths, [...new Set(parameters)], returnValues, surroundingMethod, extractingExpression, shouldBeAsync, shouldBeStatic);
        }
      }
    }));
    this.sourceCode = transformed.code;
    this.scrollTo(scrollInfo);
    const pathsToSelect = [];
    this.programPath.traverse({
      Identifier(path) {
        if (path.node.name == "HopefullyNobodyEverUsesThisMethodName") {
          pathsToSelect.push(path);
        }
      }
    });
    this.selectPaths(pathsToSelect);
  }

  /*MD ### Extract Variable MD*/

  selectMethodExtraction(programPath, silent = false) {
    var selectedPaths = this.getSelectedStatements(programPath);
    var extractingExpression = false;

    if (selectedPaths.length == 0) {
      var expressions = this.getSelectedExpressions(programPath);
      if (expressions.length > 1) {
        if (!silent) lively.warn('You cannot extract multiple statements at once. Select statements or a single expression!');
        return;
      } else if (expressions.length == 0) {
        if (!silent) lively.warn('Select statements or an expression to extract!');
        return;
      } else {
        selectedPaths = expressions;
        extractingExpression = true;
      }
    }

    const actualSelections = selectedPaths.map(path => {
      return range(path.node.loc);
    });
    return {
      selectedPaths,
      extractingExpression,
      actualSelections
    };
  }

  async extractExpressionIntoLocalVariable() {
    const selection = this.firstSelection;
    let done = false;

    const scrollInfo = this.scrollInfo;

    let pathLocationToBeExtracted;
    const res = this.sourceCode.transformAsAST(({ types: t }) => ({
      visitor: {
        Expression: path => {
          if (!done) {
            const isSelectedPath = this.isPathExactlySelected(path, selection);
            if (isSelectedPath) {
              pathLocationToBeExtracted = path.getPathLocation();

              path.find(p => {
                const parentPath = p.parentPath;
                if (!parentPath) {
                  return false;
                }

                function ensureBlock(body) {
                  if (!body.node) return false;

                  if (body.isBlockStatement()) {
                    return false;
                  }

                  const statements = [];
                  if (body.isStatement()) {
                    statements.push(body.node);
                    const blockNode = t.blockStatement(statements);
                    body.replaceWith(blockNode);
                    return true;
                  } else if (body.parentPath.isArrowFunctionExpression() && body.isExpression()) {
                    statements.push(t.returnStatement(body.node));
                    const blockNode = t.blockStatement(statements);
                    body.replaceWith(blockNode);
                    return true;
                  } else {
                    throw new Error("I never thought this was even possible.");
                  }
                }

                const targetLocation = path.getPathLocation();
                const blockLocation = p.getPathLocation();
                if (p.parentKey === 'body' && (parentPath.isFor() || parentPath.isWhile())) {
                  const becameABlock = ensureBlock(p);
                  if (becameABlock) {
                    pathLocationToBeExtracted = blockLocation + '.body[0]' + targetLocation.replace(blockLocation, '');
                  }
                  return true;
                }
                if (p.parentKey === 'body' && parentPath.isFunction()) {
                  const becameABlock = ensureBlock(p);
                  if (becameABlock) {
                    pathLocationToBeExtracted = blockLocation + '.body[0].argument' + targetLocation.replace(blockLocation, '');
                  }
                  return true;
                }
                if ((p.parentKey === 'consequent' || p.parentKey === 'alternate') && parentPath.isIfStatement()) {
                  const becameABlock = ensureBlock(p);
                  if (becameABlock) {
                    pathLocationToBeExtracted = blockLocation + '.body[0]' + targetLocation.replace(blockLocation, '');
                  }
                  return true;
                }
              });

              done = true;
            }
          }
        }
      }
    }));

    if (!pathLocationToBeExtracted) {
      lively.warn('No Expression to extract found.');
      return;
    }

    const pathLocationsToSelect = [];
    const resultExtracted = res.code.transformAsAST(({ types: t, template }) => ({
      visitor: {
        Program: programPath => {
          const path = this.pathByLocationFromProgram(programPath, pathLocationToBeExtracted);
          let value = '';
          path.traverse({
            Identifier(p) {
              value += '-' + p.node.name;
            }
          });
          if (value.length > 0) {
            // #TODO: ensure unique identifier
            value = value.camelCase();
          } else {
            value = path.scope.generateUidIdentifier('temp').name;
          }
          const identifier = t.Identifier(value);
          const decl = template('const ID = INIT;')({
            ID: identifier,
            INIT: path.node
          });

          let referree = t.Identifier(value);

          path.replaceWith(referree);
          const insertedDeclaration = path.getStatementParent().insertBefore(decl)[0];
          const insertedDeclarationIdentifier = insertedDeclaration.get('declarations')[0].get('id');

          pathLocationsToSelect.push(insertedDeclarationIdentifier.getPathLocation());
          pathLocationsToSelect.push(path.getPathLocation());
        }
      }
    }));
    this.sourceCode = resultExtracted.code;

    const pathsToSelect = this.pathLocationsToPathes(pathLocationsToSelect);

    this.selectPaths(pathsToSelect);
    this.scrollTo(scrollInfo);
  }

  async inlineLocalVariable(foo) {
    const scrollInfo = this.scrollInfo;
    let exitedEarly = false;

    const pathLocationsToSelect = [];

    let transformed = this.sourceCode.transformAsAST(({ types: t, template }) => ({
      visitor: {
        Program: programPath => {

          const selectedPath = this.getInnermostPathContainingSelection(programPath, this.firstSelection);

          const identifier = this.getFirstSelectedIdentifier(selectedPath);
          if (!identifier) {
            lively.warn('no identifier selected');
            exitedEarly = true;
            return;
          }

          const name = identifier.node.name;
          if (!identifier.scope.hasBinding(name)) {
            lively.warn('no binding found for ' + name);
            exitedEarly = true;
            return;
          }

          let binding = identifier.scope.getBinding(name);
          if (!binding) {
            lively.warn('selected identifier is not referencing a variable ' + name);
            exitedEarly = true;
            return;
          }

          if (!['var', 'let', 'const'].includes(binding.kind)) {
            lively.warn('binding for "' + name + '" is of kind "' + binding.kind + '" but should be any of "var", "let", or "const"');
            exitedEarly = true;
            return;
          }

          const constantViolations = binding.constantViolations.map(cv => this.getFirstSelectedIdentifierWithName(cv, binding.identifier.name));
          if (constantViolations.length > 0) {
            lively.warn('cannot inline because there is a constant violation for variable ' + name);
            exitedEarly = true;
            return;
          }

          const declarationIdentifierPath = this.getBindingDeclarationIdentifierPath(binding);
          if (!declarationIdentifierPath.parentPath.isVariableDeclarator()) {
            lively.warn('declaration is probably in a destructuring');
            exitedEarly = true;
            return;
          }

          const referencePaths = binding.referencePaths;
          if (referencePaths.length === 0) {
            lively.warn('variable "' + name + '" is never referenced');
            exitedEarly = true;
            return;
          }

          const identifierPaths = [declarationIdentifierPath, ...referencePaths, ...constantViolations];
          if (!identifierPaths.includes(identifier)) {
            lively.warn('selected identifier is not referencing a variable ' + name);
            exitedEarly = true;
            return;
          }

          const variableDeclarator = declarationIdentifierPath.findParent(parentPath => parentPath.isVariableDeclarator());
          const variableDeclaration = declarationIdentifierPath.findParent(parentPath => parentPath.isVariableDeclaration());
          const initPath = variableDeclarator.get('init');

          // remove declaration
          if (variableDeclaration.get('declarations').length === 1) {
            variableDeclaration.remove();
          } else {
            variableDeclarator.remove();
          }

          // inline declaration
          referencePaths.forEach(p => {
            pathLocationsToSelect.push(p.getPathLocation());
          });
          referencePaths.forEach(p => {
            p.replaceWith(initPath.node);
          });
          const o = { a: 42, b: 17 };
        }
      }
    }));

    if (exitedEarly) {
      return;
    }

    this.sourceCode = transformed.code;

    const pathsToSelect = this.pathLocationsToPathes(pathLocationsToSelect);
    this.selectPaths(pathsToSelect);

    this.scrollTo(scrollInfo);
  }

  async wrapExpressionIntoActiveExpression() {
    const selection = this.firstSelection;
    let done = false;

    const scrollInfo = this.scrollInfo;

    let pathLocationToBeExtracted;
    const res = this.sourceCode.transformAsAST(() => ({
      visitor: {
        Expression: path => {
          if (!done) {
            const isSelectedPath = this.isPathExactlySelected(path, selection);
            if (isSelectedPath) {
              pathLocationToBeExtracted = path.getPathLocation();
              done = true;
            }
          }
        }
      }
    }));

    if (!pathLocationToBeExtracted) {
      lively.warn('No `Expression` to wrap found.');
      return;
    }

    const pathLocationsToSelect = [];
    const resultExtracted = res.code.transformAsAST(({ template }) => ({
      visitor: {
        Program: programPath => {
          const path = this.pathByLocationFromProgram(programPath, pathLocationToBeExtracted);
          const ae = template('aexpr(() => EXPR)')({
            EXPR: path.node
          }).expression;

          path.replaceWith(ae);

          pathLocationsToSelect.push(path.getPathLocation());
        }
      }
    }));
    this.sourceCode = resultExtracted.code;

    const pathsToSelect = this.pathLocationsToPathes(pathLocationsToSelect);

    this.selectPaths(pathsToSelect);
    this.scrollTo(scrollInfo);
  }

  /*MD ## Accessors MD*/

  get sourceCode() {
    return this.codeProvider.code;
  }
  set sourceCode(text) {
    this.codeProvider.code = text;
    this.codeChanged();
    return this.codeProvider.code;
  }

  get scrollInfo() {
    return this.codeProvider.scrollInfo;
  }

  scrollTo(scrollInfo) {
    this.codeProvider.scrollInfo = scrollInfo;
  }

  /*MD ## Utilities MD*/

  isSelected(path, selections = null) {
    if (!selections) {
      selections = this.selectionRanges;
    }
    const pathRange = range(path.node.loc);
    for (const selection of selections) {
      if (selection.containsRange(pathRange)) {
        return true;
      }
    }
    return false;
  }

  isPathExactlySelected(path, selection) {
    return selection.isEqual(range(path.node.loc));
  }

  pathByLocationFromProgram(programPath, location) {
    let path = programPath;
    const reg = /(\.[A-Za-z0-9]+|(\[[0-9]+\]))/ig;
    let result;
    while ((result = reg.exec(location)) !== null) {
      let part = result[0];
      if (part.startsWith('.')) {
        part = part.replace('.', '');
        path = path.get(part);
      } else {
        part = part.replace(/\[|\]/ig, '');
        part = parseInt(part);
        path = path[part];
      }
    }

    return path;
  }

  pathLocationsToPathes(pathLocations) {
    const paths = [];

    this.sourceCode.traverseAsAST({
      Program: path => {
        pathLocations.forEach(location => {
          paths.push(this.pathByLocationFromProgram(path, location));
        });
      }
    });

    return paths;
  }

  async getCorrespondingClasses(methodName) {
    let index = await FileIndex.current();

    //find classes that contain the method
    let possibleClasses = await index.db.classes.filter(cl => {
      return cl.methods.some(me => me.name == methodName);
    }).toArray();

    //find files that export things with the urls from the found classes
    let possibleExports = await index.db.exports.where('url').anyOf(possibleClasses.map(cl => cl.url)).toArray();

    //reduce the found classes with the found possible exports
    let locations = possibleClasses.filter(cl => {
      return possibleExports.some(e => e.url == cl.url && e.classes.some(eCl => eCl == cl.name));
    });
    return locations.filter(ea => ea.url.match(lively4url)); //filter local files
  }

  async getFunctionExportURLs(methodName) {
    let index = await FileIndex.current();
    let locations = await index.db.exports.filter(exp => {
      return exp.functions.some(me => me == methodName);
    }).toArray();
    return locations.map(loc => loc.url).filter(url => url.match(lively4url));
  }

  /*MD ## Active_Expressions MD*/

  getAexprAtCursor(location) {
    let aexprPath;
    this.programPath.traverse({
      CallExpression(path) {
        if (!range(path.node.loc).contains(location)) {
          path.skip();
        } else if (isAExpr(path)) {
          aexprPath = path;
          path.stop();
        }
      }
    });
    return aexprPath;
  }

  get hasActiveExpressionsDirective() {
    return this.programPath.node.directives.some(node => {
      return node.value.value === "enable aexpr";
    });
  }

  ensureEnrichment() {
    if (this.finishedEnrichment) return true;
    if (!this.programPath || !this.hasActiveExpressionsDirective) return false;
    try {
      this.enrich();
    } catch (err) {
      console.error("Unable to process source code", err);
      return false;
    }
    return true;
  }

  enrich() {
    let self = this;
    this.rootNode.traverseAsAST({
      enter(path) {
        path.node.extra = {
          // this is necessary due to possible circles
          // this collects the correct dependencies
          // breaks (meaning not beeing entirely correct anymore) as soon as a node is contained by more than one circle (but this turned out to be unlikely)
          visited: 2,
          //same for return recursion
          returnVisited: 2
        };
      }
    });

    // adds the corresponding binding to every identifier
    this.rootNode.traverseAsAST({
      Scope(path) {
        Object.entries(path.scope.bindings).forEach(([_name, binding]) => {
          binding.referencePaths.forEach(path => {
            path.node.extra.binding = binding;
          });
        });
      }
    });

    this.extractMemberAssignments();

    this.enrichFunctionNodes();

    this.programPath.traverse({
      Expression(expr) {
        self.collectExpressionInformation(expr);
      }
    });

    this.finishedEnrichment = true;
  }

  // Filters every member assignment and registers it in `this.memberAssignments`
  extractMemberAssignments() {
    let self = this;
    this.programPath.traverse({
      MemberExpression(expr) {
        if (expr.node.computed) return;
        if (!expr.parentPath.isAssignmentExpression()) return;
        let assignment = self.assignedValue(expr.parentPath);

        let obj = expr.get("object");
        let objKey = obj.node.extra.binding || 'misc';
        let property = expr.get("property").node.name;

        let entry = self.memberAssignments.get(property);
        if (!entry) {
          // property unknown, adding new property and its accesses to the map
          let newMap = new Map();

          newMap.set(objKey, [assignment]);
          self.memberAssignments.set(property, newMap);
        } else {
          let objEntry = entry.get(objKey);
          if (!objEntry) {
            objEntry = [];
            entry.set(objKey, objEntry);
          }
          objEntry.push(assignment);
        }
      }
    });
  }

  enrichFunctionNodes() {
    // adds bindings definend outside of the current scope(e.g. Function) to the scope
    this.rootNode.traverseAsAST({
      'Function|ArrowFunctionExpression|Program'(path) {
        path.node.extra.leakingBindings = leakingBindings(path);
        const callExpressions = path.node.extra.callExpressions = [];
        const objects = path.node.extra.objects = new Map();
        const returns = path.node.extra.returns = [];

        path.traverse({
          MemberExpression(expr) {
            if (expr.parentPath.isAssignmentExpression()) return;
            let objExpr = expr.get("object").node;
            let property = expr.get("property").node.name;

            let entry = objects.get(objExpr);
            if (!entry) {
              objects.set(objExpr, new Set([property]));
            } else {
              entry.add(property);
            }
          }
        });

        path.traverse({
          ReturnStatement(ret) {
            if (ret.has("argument")) {
              returns.push(ret.get("argument"));
            }
          },
          CallExpression(call) {
            callExpressions.push(call);
          }
        });
      }
    });
  }

  /* Main recursion for enriching AST 
  *  Resolves Expression nodes and follows their children in order to find
  *  - resolvedObjects - the {ObjExpression, [Bindings]} in which the expression may result
  *  - resolvedCallees - the [Function] which callepressions may actually be
  *  - results         - the [Function] which may be returned by an expression or Identifier
  *
  */
  collectExpressionInformation(path) {
    if (path.node.extra.returnVisited <= 0) {
      return [];
    }

    path.node.extra.returnVisited -= 1;

    if (path.node.extra.results) {
      return path.node.extra.results;
    }

    let results = [];
    let resolvedObjects = [];

    if (path.isObjectExpression()) {
      resolvedObjects = [{ objectExpression: path, bindings: new Set() }];
    } else if (path.isIdentifier()) {
      if (!path.parentPath.isUpdateExpression()) {
        let binding = path.node.extra.binding;
        if (binding) {
          [binding.path, ...binding.constantViolations].forEach(item => {
            this.collectExpressionInformation(item);
            results.push(item.node.extra.results);
            item.node.extra.resolvedObjects.forEach(obj => {
              obj.bindings.add(binding);
              resolvedObjects.push(obj);
            });
          });
        }
      }
    } else if (path.isAssignmentExpression() || path.isVariableDeclarator()) {
      let val = this.assignedValue(path);
      this.collectExpressionInformation(val);
      results = val.node.extra.results;
      resolvedObjects = val.node.extra.resolvedObjects;
    } else if (path.isFunction()) {
      results = [path];
    } else if (path.isConditionalExpression()) {
      [path.get("consequent"), path.get("alternate")].forEach(expr => {
        this.collectExpressionInformation(expr);
        results.push(expr.node.extra.results);
        resolvedObjects.push(expr.node.extra.resolvedObjects);
      });
    } else if (path.isCallExpression()) {
      const callee = path.get("callee");
      let resolvedCallees = [];
      this.collectExpressionInformation(callee);
      callee.node.extra.results.forEach(func => {
        this.collectExpressionInformation(func);
        const body = func.get("body");
        if (!body.isBlockStatement()) {
          // slim arrow function        
          this.collectExpressionInformation(body);
          results.push(body.node.extra.results);
        } else {
          func.node.extra.returns.forEach(returnStatement => {
            this.collectExpressionInformation(returnStatement);
            results.push(returnStatement.node.extra.results);
            resolvedObjects.push(returnStatement.node.extra.resolvedObjects);
          });
        }
        // hey we found a callee as well. 
        resolvedCallees.push(func);
      });
      path.node.extra.resolvedCallees = resolvedCallees.flat();
    } else if (path.isMemberExpression()) {
      const objExpr = path.get("object");
      this.collectExpressionInformation(objExpr);

      let tmp = objExpr.node.extra.resolvedObjects.flat();
      tmp.forEach(result => {
        this.assignmentsOf(path.get("property").node.name, result).forEach(assignment => {
          this.collectExpressionInformation(assignment);
          results.push(assignment.node.extra.results);
          resolvedObjects.push(assignment.node.extra.resolvedObjects);
        });
      });
    }
    path.node.extra.resolvedObjects = resolvedObjects.flat();
    path.node.extra.results = results.flat();
  }

  // Returns for a given 'property' and {ObjExpression, [Binding]} all known assignments including the declaration
  assignmentsOf(property, obj) {

    let result = [];
    this.shadowedBindings(obj.bindings).forEach(binding => {

      let propertyEntry = this.memberAssignments.get(property) || new Map();
      let memberDependencies = propertyEntry.get("misc") || [];
      memberDependencies.forEach(assignment => result.push(assignment));

      let objEntry = propertyEntry.get(binding);
      if (objEntry) {
        objEntry.forEach(assignment => result.push(assignment));
      }
    });

    // try to read as much from the given ObjectExpression as possible
    let objExpr = obj.objectExpression; // the nodePath
    if (objExpr && objExpr.isObjectExpression()) {
      let tmp = objExpr.get("properties").find(path => path.get("key").node.name === property);
      if (tmp) {
        if (tmp.isObjectProperty()) {
          result.push(tmp.get("value"));
        } else if (tmp.isObjectMethod()) {
          result.push(tmp);
        }
      }
    }
    return result;
  }

  assignedValue(path) {
    if (path.isUpdateExpression()) return path;
    if (path.isFunctionDeclaration()) return path;
    if (path.isAssignmentExpression()) return path.get("right");
    if (path.isVariableDeclarator()) {
      const id = path.get("id");
      if (id.isPattern()) return; // #TODO
      return path.get("init");
    }
    return;
  }

  /* returns all [binding] that the input [binding] may be assigned to.
   * ATTENTION: this only works for object bindings, since literal values are copied in javascript
   * `let a = 4; let b = a` `b` is not shadowed but if `a` is an object, then it is shadowed, so instead of using the actual binding `b`, we use every binding `b` resolves to (including `b`)
   * 
   * //Where is b changed?
   * let a = {x:1};
   * let b = a; // a is shadowed binding
   * a.x = 2; //<--!!!
   * //b is equal to {x:2}
   */
  shadowedBindings(bindings) {

    /* this should be stored in the members map or in an extra property. 
    * DOES NOT DETECT DEPENDENCIES THROUGH SIMPLE ASSIGNMENTS (a la `a = b`)
    * do this with extra sweep as last enrichment step, when the new property in there
    */
    let result = bindings;
    bindings.forEach(binding => {
      binding.path.node.extra.resolvedObjects.forEach(obj => {
        if (obj.bindings) {
          obj.bindings.forEach(item => result.add(item));
        }
      });
    });

    return result;
  }

  /* returns a set of nodes where the active Expression on this location may be changed
   * DOES NOT care for execution order of the code
   * uses heuristics e.g. fixed recursion depth
   */
  resolveDependencies(path) {
    if (!this.ensureEnrichment()) return new Set();

    if (path.node.dependencies != null) {
      return path.node.dependencies;
    }

    return this._resolveDependencies(path);
  }

  _resolveDependencies(path) {
    const self = this;
    if ((path.node.extra.visited -= 1) <= 0) {
      return path.node.extra.dependencies || new Set();
    }

    if (path.node.extra.dependencies) {
      // the dependencies were already collected... just return them
      return path.node.extra.dependencies;
    }

    let dependencies = new Set([...this.shadowedBindings(path.node.extra.leakingBindings)].map(binding => [...binding.constantViolations]).flat());
    path.node.extra.callExpressions.forEach(callExpression => {
      callExpression.node.extra.resolvedCallees.forEach(callee => {
        if (t.isFunction(callee)) {
          this._resolveDependencies(callee).forEach(dep => dependencies.add(dep));
        }

        if (t.isAssignmentExpression(callee)) {
          const value = this.assignedValue(callee);
          if (t.isFunction(value) || t.isArrowFunctionExpression(value)) {
            this._resolveDependencies(value).forEach(dep => dependencies.add(dep));
          }
        }

        if (t.isVariableDeclarator(callee)) {
          //NOP
        }
      });
    });

    if (path.node.extra.objects.size) {
      for (const [objExpr, members] of path.node.extra.objects.entries()) {
        if (t.isThisExpression(objExpr)) continue;
        for (const member of members) {
          self.assignmentsOf(member, { bindings: new Set([objExpr.extra.binding]) }).forEach(assignment => {
            dependencies.add(assignment);
          });
        }
      }
    }
    path.node.extra.dependencies = dependencies;
    return dependencies;
  }

  getAllActiveExpressions() {
    return this.aexprs || (this.aexprs = this._collectAExprs());
  }

  _collectAExprs() {
    const allAExpr = [];
    this.programPath.traverse({
      CallExpression(path) {
        if (isAExpr(path)) {
          allAExpr.push(path);
        }
      }
    });
    return allAExpr;
  }

}

/*MD ## Active Expressions Helper*/

const AEXPR_IDENTIFIER_NAME = 'aexpr';

function leakingBindings(path) {
  const bindings = new Set();
  path.traverse({
    ReferencedIdentifier(id) {
      const outerBinding = path.scope.getBinding(id.node.name);
      if (!outerBinding) return;
      const actualBinding = id.scope.getBinding(id.node.name);
      if (outerBinding === actualBinding) {
        bindings.add(actualBinding);
      }
    }
  });
  return bindings;
}

function isAExpr(path) {
  return t.isCallExpression(path) && t.isIdentifier(path.node.callee) && path.node.callee.name === AEXPR_IDENTIFIER_NAME && !path.scope.hasBinding(AEXPR_IDENTIFIER_NAME, true);
}