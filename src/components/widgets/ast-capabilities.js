import { loc, range } from 'utils';

import FileIndex from "src/client/fileindex.js";
import MousePosition from 'src/client/mouse-position.js';

import diff from 'src/external/diff-match-patch.js';
const DMP_DELETION = -1,
      DMP_EQUALITY = 0,
      DMP_INSERTION = 1;

import babelDefault from 'systemjs-babel-build';
const babel = babelDefault.babel;

const t = babel.types;
const template = babel.template;

import { indentFromTo } from './code-mirror-utils.js';

function copyCursor(cur) {
  return CodeMirror.Pos(cur.line, cur.ch);
}
function lineLength(cm, lineNum) {
  return cm.getLine(lineNum).length;
}
function comparePos(a, b) {
  return a.line - b.line || a.ch - b.ch;
}
function asFromTo(anchor, head) {
  if (comparePos(anchor, head) > 0) {
    return [head, anchor];
  } else {
    return [anchor, head];
  }
}

export default class ASTCapabilities {

  constructor(codeProvider) {
    this.codeProvider = codeProvider;
    this.codeChanged();
  }

  get cm() {
    return this.codeProvider.codeMirror;
  }

  get lcm() {
    return this.codeProvider.livelyCodeMirror;
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
      cm.replaceRange('\n', CodeMirror.Pos(cm.firstLine(), 0));
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

  lively4url() {
    const { livelyCodeMirror: lcm, codeMirror: cm } = this.codeProvider;

    const l4url = 'lively4url';
    const l4urlplus = l4url + ' + ';

    const selectionTexts = cm.getSelections();
    const simples = new Set();
    cm.replaceSelections(selectionTexts.map((t, i) => {
      if (t.length > 0) {
        return l4urlplus + t;
      } else {
        simples.add(i);
        return l4url;
      };
    }), "around");
    const selections = cm.listSelections();
    selections.forEach(({ anchor, head }, i) => {
      const [left, right] = loc(anchor).isBefore(head) ? [anchor, head] : [head, anchor];
      if (simples.has(i)) {
        left.ch += l4url.length;
      } else {
        // select `lively4url + <prior>`
      }
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

  // search and select backwards from cursor
  selectPrevious(cm, searchString, startPos) {
    let headIndex = cm.indexFromPos({ line: startPos.line, ch: startPos.ch });

    const str = cm.getValue();
    let compareString = '';
    while (headIndex >= 0) {
      compareString = str[headIndex] + compareString;

      if (compareString.startsWith(searchString)) {
        break;
      } else {
        headIndex--;
      }
    }
    const anchor = cm.posFromIndex(headIndex);
    const head = cm.posFromIndex(headIndex + searchString.length);

    cm.setSelection(anchor, head);
  }

  generateIf(type) {
    const cm = this.codeProvider.codeMirror;

    const selections = cm.getSelections();
    if (selections.length === 1 && !cm.somethingSelected()) {
      const CONDITION_IDENTIFIER = 'condition';
      const { line } = cm.getCursor();
      const lineContent = cm.getLine(line);

      if (/^\s*$/.test(lineContent)) {
        cm.replaceSelection(`if (${CONDITION_IDENTIFIER}) {
  
}`, 'start');
        cm::indentFromTo(line, line + 2);
        let { ch } = cm.getCursor();

        // select condition
        ch += 4;
        cm.setSelection({ line, ch: ch + CONDITION_IDENTIFIER.length }, { line, ch });
      } else {
        cm.replaceRange(`if (${CONDITION_IDENTIFIER}) {
${lineContent}
}`, { line, ch: 0 }, { line, ch: Infinity }, "+input");
        cm::indentFromTo(line, line + 2);
        this.selectPrevious(cm, CONDITION_IDENTIFIER, { line, ch: Infinity });
      }
      return;
    }

    const scrollInfo = this.scrollInfo;
    let exitedEarly = false;

    const pathLocationsToSelect = [];

    let transformed = this.sourceCode.transformAsAST(({ types: t, template }) => ({
      visitor: {
        Program: programPath => {

          function selectMethodExtraction(programPath, silent = false) {
            var selectedPaths = this.getSelectedStatements(programPath);
            var extractingExpression = false;

            if (selectedPaths.length == 0) {
              var expressions = this.getSelectedExpressions(programPath);
              if (expressions.length > 1) {
                if (!silent) lively.warn('2222You cannot extract multiple statements at once. Select statements or a single expression!2');
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

          var selectedPaths = this.getSelectedStatements(programPath);
          lively.notify(selectedPaths.length);
          if (selectedPaths.length == 0) {
            lively.notify('no path');
            return;
          }
          pathLocationsToSelect.push(...selectedPaths.map(statement => statement.getPathLocation()));
          return;
          const selectedPath = this.getInnermostPathContainingSelection(programPath, this.firstSelection);

          const statement = selectedPath.getStatementParent();
          pathLocationsToSelect.push(statement.getPathLocation() + '.test');

          statement.replaceWith(t.ifStatement(t.identifier('condition'), t.blockStatement([statement.node])));

          return;
          {
            const selectedPath = this.getInnermostPathContainingSelection(programPath, this.firstSelection);

            const statement = selectedPath.getStatementParent();
            pathLocationsToSelect.push(statement.getPathLocation() + '.test');

            statement.replaceWith(t.ifStatement(t.identifier('condition'), t.blockStatement([statement.node])));
          }
          if (type === 'condition') {
            programPath;
          } else if (type === 'then') {
            programPath;
          } else if (type === 'else') {
            programPath;
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

  insertMarkdownComment() {
    const { livelyCodeMirror: lcm, codeMirror: cm } = this.codeProvider;

    const before = '/*M' + 'D ## ';
    const around = 'your text';
    const after = ' MD*/';
    const l4url = 'lively4url';
    const l4urlplus = l4url + ' + ';

    const selections = cm.getSelections();
    cm.replaceSelections(selections.fill(before));
    cm.replaceSelections(selections.fill(after), "start");
    cm.replaceSelections(selections.fill(around), "around");
  }
  braveNewWorld() {
    const { livelyCodeMirror: lcm, codeMirror: cm } = this.codeProvider;

    this.insertLastDefinedVariable();
  }

  // #TODO: multi-selection
  insertLastDefinedVariable(n = 1) {
    const { livelyCodeMirror: lcm, codeMirror: cm } = this.codeProvider;
    const firstRange = range(cm.listSelections().first);
    const path = this.getInnermostPathContainingSelection(this.programPath, firstRange);

    var s = path.scope;
    const identifiers = [];
    do {
      Object.values(s.bindings).forEach(binding => identifiers.push(binding.identifier));
    } while (s = s.parent);

    const cursorIndex = cm.indexFromPos(cm.getCursor());
    let positions = identifiers.map(identifier => {
      const { start, end } = range(identifier.loc);

      return {
        name: identifier.name,
        start: cm.indexFromPos(start.asCM()),
        end: cm.indexFromPos(end.asCM())
      };
    });
    positions = positions.filter(({ start }) => start < cursorIndex).sortBy(({ start }) => start);

    const position = positions.getItem(-n);
    const anchor = cm.posFromIndex(position.start);
    const head = cm.posFromIndex(position.end);
    // cm.setSelection(anchor, head);

    cm.replaceSelection(position.name);
  }

  insertArrowFunction(numArgs = 1) {
    function isPlural(name) {
      return name.endsWith('s') && name.length > 1;
    }
    function makeSingular(name) {
      const matches = [...name.matchAll(/(?<=[a-z])(?=[A-Z])|(?<=[A-Z])(?=[A-Z][a-z])/gm)];
      if (matches.length === 0) {
        return name;
      }
      return name.substring(matches.last.index).slice(0, -1).lowerCase();
    }
    function getStart(selection) {
      return comparePos(selection.anchor, selection.head) < 1 ? selection.anchor : selection.head;
    }
    function getEnd(selection) {
      return comparePos(selection.anchor, selection.head) < 1 ? selection.head : selection.anchor;
    }

    const { codeMirror: cm } = this.codeProvider;

    const selections = cm.listSelections();
    const selectionTexts = cm.getSelections();
    const arg1s = selections.map((selection, i) => {
      const selectionRange = range(selection);
      const cursorIndex = cm.indexFromPos(getStart(selection));
      const identifiers = [];
      try {
        const path = this.getInnermostPathContainingSelection(this.programPath, selectionRange);

        const scopePath = path.scope.path;
        scopePath.traverse({
          Identifier(path) {
            identifiers.push(path.node);
          }
        });
      } catch (e) {}

      const arg1identifier = identifiers.reverse().find(identifier => {
        const { start, end } = range(identifier.loc);
        return isPlural(identifier.name) && cm.indexFromPos(start.asCM()) < cursorIndex;
      });
      return arg1identifier ? makeSingular(arg1identifier.name) : 'ea';
    });

    function getExpression(i) {
      const selectionText = selectionTexts[i];
      return selectionText === '' ? arg1s[i] : selectionText;
    }
    cm.replaceSelections(selectionTexts.map((selection, i) => {
      return `${arg1s[i]} => ${getExpression(i)}`;
    }), 'around');

    cm.setSelections(cm.listSelections().flatMap((selection, i) => {
      const argumentStart = getStart(selection);
      const expressionEnd = getEnd(selection);
      const argument = {
        anchor: argumentStart,
        head: cm.posFromIndex(cm.indexFromPos(argumentStart) + arg1s[i].length)
      };
      const expressionText = getExpression(i);
      const expression = {
        anchor: cm.posFromIndex(cm.indexFromPos(expressionEnd) - expressionText.length),
        head: expressionEnd
      };

      return [argument, expression];
    }), 1);
  }

  /*MD ## Feedback Helpers MD*/

  highlightChanges() {
    const from = document.querySelector('#from').editor;
    const to = document.querySelector('#to').editor;
    const targetLCM = document.querySelector('#target');
    const targetCM = targetLCM.editor;
    const oldText = from.getValue();
    const newText = to.getValue();

    targetLCM.value = oldText;

    var dmp = new diff.diff_match_patch();
    var d = dmp.diff_main(oldText, newText);
    // d.inspect()
    var index = 0;
    let firstChangeStep = true;
    // prune diffs
    const onlySpaces = str => str.trim().length === 0;
    // d = d.filter(([changeType, text]) => changeType === 0 || !onlySpaces(text));
    // d.inspect()
    for (let [changeType, text] of d) {
      index = this.highlightChange(changeType, targetCM, text, index);
      firstChangeStep = false;
    }
  }

  highlightChange(changeType, cm, text, index) {
    switch (changeType) {
      case DMP_EQUALITY:
        index += text.length;
        break;
      case DMP_INSERTION:
        cm.replaceRange(text, cm.posFromIndex(index), cm.posFromIndex(index), 'insertion');
        index += text.length;
        break;
      case DMP_DELETION:
        cm.replaceRange('', cm.posFromIndex(index), cm.posFromIndex(index + text.length), 'deletion');
        break;
    }

    return index;
  }

  underlineText(cm, anchor, head, color) {

    function drawLineFor(from, to) {
      if (from.ch === Infinity) {
        from.ch = cm.getLine(from.line).length;
      }
      if (to.ch === Infinity) {
        to.ch = cm.getLine(to.line).length;
      }

      function drawLineFragment(posA, posB) {
        lively.showPath([{ x: posA.left - 1, y: posA.bottom }, { x: posB.left + 1, y: posB.bottom }], color, false);
      }
      {
        // short line :)
        const { left: anchorLeft, bottom: anchorBottom } = cm.charCoords(from, 'window');
        const { left: anchorRight, bottom: anchorBottomRight } = cm.charCoords(to, 'window');

        if (anchorBottom === anchorBottomRight) {
          lively.showPath([{ x: anchorLeft - 1, y: anchorBottom }, { x: anchorRight + 1, y: anchorBottomRight }], color, false);
          return;
        }
      }

      // long line support
      let line = from.line;
      let startCh = from.ch;
      let currentCh = startCh;
      let startPos = cm.charCoords({ line, ch: startCh }, 'window');
      let lastPos = Object.assign({}, startPos);
      while (currentCh <= to.ch) {
        let currentPos = cm.charCoords({ line, ch: currentCh }, 'window');
        if (currentPos.bottom > startPos.bottom) {
          drawLineFragment(startPos, lastPos);
          startPos = currentPos;
        }
        lastPos = currentPos;
        currentCh++;
      }
      drawLineFragment(startPos, lastPos);
    }

    if (anchor.line === head.line) {
      drawLineFor(anchor, head);
      return;
    }

    if (comparePos(anchor, head) > 0) {
      this.underlineText(cm, head, anchor);
      return;
    }

    {
      const anchorLine = anchor.line;
      const headLine = head.line;

      drawLineFor(anchor, { line: anchorLine, ch: Infinity });
      let line = anchorLine + 1;
      while (line < headLine) {
        drawLineFor({ line, ch: 0 }, { line, ch: Infinity });
        line++;
      }
      drawLineFor({ line: headLine, ch: 0 }, head);
    }
  }

  underlinePath(cm, path, color) {
    const start = loc(path.node.loc.start).asCM();
    const end = loc(path.node.loc.end).asCM();
    this.underlineText(cm, start, end, color);
  }

  underlineMark(cm, mark, color) {
    const { from, to } = mark.find();
    this.underlineText(cm, from, to, color);
  }

  /*MD ## Psych (paste from mouse) MD*/
  psych() {
    const pt = MousePosition.pt;

    const elementsFromPoint = MousePosition.elementsFromPoint(pt);
    if (elementsFromPoint.length === 0) {
      lively.warn('no element under cursor found');
      return;
    }

    const webComponent = elementsFromPoint.find(e => e.tagName.includes('-'));

    if (webComponent && webComponent.tagName === 'LIVELY-CODE-MIRROR') {
      const cm = webComponent.editor;
      const { line, ch } = cm.coordsChar({ left: pt.x, top: pt.y }, "window");
      const w = cm.findWordAt({ line, ch });
      const { anchor, head } = w;
      this.underlineText(cm, anchor, head);
      this.replaceSelectionWith(cm.getRange(anchor, head));
      return;
      that.editor.findMatchingBracket(pos, strict, config);
    }

    lively.showElement(elementsFromPoint.first);
    this.replaceSelectionWith(elementsFromPoint.first.textContent);
  }

  psychEach() {
    const { lcm, cm, line, ch } = this.hoveredPosition;
    if (!cm) {
      return;
    }

    {
      // not hovering a word?: fallback to psych
      let { anchor, head } = cm.findWordAt({ line, ch });
      if (/[^a-zA-Z]/.test(cm.getRange(anchor, head))) {
        return this.psych();
      }
    }

    let anchorIndex = cm.indexFromPos({ line, ch }),
        headIndex = anchorIndex;

    const str = lcm.value;

    const letter = c => /[a-zA-Z]/g.test(c);
    const small = c => /[a-z]/g.test(c);
    const big = c => /[A-Z]/g.test(c);

    // scan left

    let foundBig = big(str[anchorIndex]);
    while (anchorIndex - 1 >= 0) {
      const charToAdd = str[anchorIndex - 1];

      if (!letter(charToAdd)) {
        break;
      }

      if (foundBig && small(charToAdd)) {
        break;
      }

      foundBig = big(charToAdd);
      anchorIndex--;
    }

    // scan right

    let foundSmall = small(str[headIndex]);
    while (headIndex < str.length) {
      const charToAdd = str[headIndex];

      if (!letter(charToAdd)) {
        break;
      }

      if (foundSmall && big(charToAdd)) {
        break;
      }

      foundSmall = small(charToAdd);
      headIndex++;
    }

    const anchor = cm.posFromIndex(anchorIndex);
    const head = cm.posFromIndex(headIndex);
    this.replaceSelectionWith(cm.getRange(anchor, head));
  }

  psychTo(char, inclusive) {
    if (char === 'Enter') {
      char = '\n';
    }

    const { lcm, cm, line, ch } = this.hoveredPosition;
    if (!cm) {
      return;
    }

    let { anchor, head } = cm.findWordAt({ line, ch });

    let headIndex = cm.indexFromPos(head);

    const str = lcm.value;

    while (headIndex < str.length) {
      const charToAdd = str[headIndex];

      if (char === charToAdd) {
        if (inclusive) {
          headIndex++;
        }
        break;
      } else {
        headIndex++;
      }
    }
    head = cm.posFromIndex(headIndex);

    this.replaceSelectionWith(cm.getRange(anchor, head));
  }

  iterateNestingStructure(cm, onLeft = () => {}, onRight = () => {}) {

    const str = cm.getValue();

    const matches = [...str.matchAll(/\/\/|\/\*|\*\/|['"`\(\)\[\]{}]/g)].map(match => {
      const index = match.index;
      const { line, ch } = cm.posFromIndex(index);
      return {
        char: match[0],
        line,
        ch,
        index
      };
    });

    const {
      isLeft,
      isRight,
      getLeft,
      getRight
    } = this.psychUtils;

    let currentLineCommentLine = -1;

    const stack = [];
    function pushOntoStack(m) {
      stack.push(m);
    }

    function isStringDelimiter(char) {
      return '\'"`'.includes(char);
    }

    function isOdd(n) {
      return n % 2 == 1;
    }
    function isEven(n) {
      return n % 2 == 0;
    }
    function numEscapes(index) {
      let escapes = 0;
      while (index - 1 >= 0) {
        const char = str[index - 1];

        if (char === '\\') {
          escapes++;
          index--;
        } else {
          break;
        }
      }

      return escapes;
    }

    for (let match of matches) {
      const { char, index, line, ch } = match;

      if ((!stack.last || !isStringDelimiter(stack.last.char)) && char === '//') {
        currentLineCommentLine = line;
        continue;
      }
      if (line === currentLineCommentLine) {
        // ignore because we are right of a line comment (//)
        continue;
      }

      if (stack.last && stack.last.char === '/*' && char !== '*/') {
        // ignore of a multi-line comment (/* */)
        continue;
      }

      // handle strings
      handleStrings: if (stack.last && isStringDelimiter(stack.last.char)) {
        // handle template part in template string
        if (stack.last.char === '`' && char === '{' && str[index - 1] === '$' && isEven(numEscapes(index - 1))) {
          break handleStrings;
        }

        // other chars are part of the string, and do not end the string
        if (stack.last.char !== char) {
          continue;
        }

        // same char but escaped?
        if (isOdd(numEscapes(index))) {
          continue;
        }
      }

      /* handling characters */

      if (isRight(char)) {
        if (stack.length > 0 && getLeft(char) === stack.last.char) {
          // matching right found
          const left = stack.pop();
          const shouldContinue = onRight(match, left);
          if (shouldContinue === false) {
            return;
          }
          continue;
        }
      }

      if (isLeft(char)) {
        // quotes or left bracket as left delimiter
        pushOntoStack(match);
        const shouldContinue = onLeft(match);
        if (shouldContinue === false) {
          return;
        }
        continue;
      }

      if (isRight(char)) {
        // ignore non-matching right brackets
      } else {
        lively.error(`match ${char} at position ${index} should never happen`);
      }
    }
  }

  findSmartAroundSelection(cm, anchor, head, inclusive, charsToBeginList = '\'"`([{') {
    const [from, to] = asFromTo(anchor, head);

    const fromIndex = cm.indexFromPos(from);
    const toIndex = cm.indexFromPos(to);

    let startIndex = 0;
    let endIndex = cm.getValue().length;
    this.iterateNestingStructure(cm, left => {
      left.onLeftSide = left.index < fromIndex;
    }, (right, left) => {
      const onRightSide = toIndex <= right.index;
      if (onRightSide && left.onLeftSide) {
        if (charsToBeginList.includes(left.char)) {
          startIndex = left.index;
          endIndex = right.index;
          return false;
        }
      }
    });

    if (inclusive) {
      endIndex++;
    } else {
      startIndex++;
    }

    const start = cm.posFromIndex(startIndex);
    const end = cm.posFromIndex(endIndex);
    return { anchor: start, head: end };
  }

  psychInSmart(inclusive) {
    const { cm, line, ch } = this.hoveredPosition;
    if (!cm) {
      return;
    }

    const pos = { line, ch };
    const { anchor, head } = this.findSmartAroundSelection(cm, pos, pos, inclusive);

    this.replaceSelectionWith(cm.getRange(anchor, head));
  }

  get psychUtils() {
    const lrPairs = [{ left: '/*', right: '*/' }, { left: "'", right: "'" }, { left: '"', right: '"' }, { left: '`', right: '`' }].concat([{ left: '(', right: ')' }, { left: '[', right: ']' }, { left: '{', right: '}' }]);

    const isLeft = char => lrPairs.some(({ left }) => left === char);

    const isRight = char => lrPairs.some(({ right }) => right === char);

    const getLeft = char => {
      const pair = lrPairs.find(({ right }) => right === char);
      return pair && pair.left;
    };

    const getRight = char => {
      const pair = lrPairs.find(({ left }) => left === char);
      return pair && pair.right;
    };

    return {
      lrPairs,

      isLeft,
      isRight,
      getLeft,
      getRight
    };
  }

  get hoveredPosition() {
    const pt = MousePosition.pt;
    MousePosition.showPoint(pt);

    const lcm = MousePosition.elementsFromPoint(pt).find(e => e.tagName === 'LIVELY-CODE-MIRROR');
    if (!lcm) {
      lively.warn('no hovered code-mirror found');
      return {};
    }
    const cm = lcm.editor;
    const { line, ch } = cm.coordsChar({ left: pt.x, top: pt.y }, "window");

    return { lcm, cm, line, ch };
  }

  replaceSelectionWith(text) {
    this.cm.replaceSelection(text, 'end');
  }

  /*MD ## Slurping and Barfing MD*/

  __getScrollInfo__() {
    return this.cm.getScrollInfo();
  }

  __setScrollInfo__(scrollInfo) {
    this.cm.scrollIntoView({
      left: scrollInfo.left,
      top: scrollInfo.top,
      right: scrollInfo.left + scrollInfo.width,
      bottom: scrollInfo.top + scrollInfo.height
    });
  }

  slurpOrBarf({ slurp = false, barf = false, forward }) {
    const cm = this.codeProvider.codeMirror;

    const selections = cm.listSelections();

    this.sourceCode.transformAsAST(() => ({
      visitor: {
        Program: programPath => {
          let path = this.getInnermostPathContainingSelection(programPath, range(selections.first));
          const innerBlock = path.find(p => {
            if (!p.isBlock()) {
              return false;
            }
            if (barf && p.get('body').length === 0) {
              // nothing to barf
              return false;
            }
            return true;
          });

          if (!innerBlock) {
            if (barf) {
              lively.warn('nothing to barf');
            } else {
              lively.warn('no innerBlock found');
            }
            return;
          }

          let outerStatement = innerBlock.find(p => {
            if (!(p.parentPath && p.parentPath.isBlock())) {
              return false;
            }
            if (slurp) {
              if (forward && !p.getNextSibling().node) {
                return false;
              }
              if (!forward && !p.getPrevSibling().node) {
                return false;
              }
            }
            return true;
          });

          function removeLine(line) {
            cm.replaceRange('', { line, ch: 0 }, { line: line + 1, ch: 0 }, '+input');
          }

          function isBlank(str) {
            return (/^\s*$/.test(str)
            );
          }

          function hasCleanLeft(start) {
            const frontLineStart = {
              ch: 0,
              line: start.line
            };
            return isBlank(cm.getRange(frontLineStart, start));
          }
          function hasCleanRight(pos) {
            const backLineEnd = {
              co: Infinity,
              line: pos.line
            };
            return isBlank(cm.getRange(pos, backLineEnd));
          }

          function adaptPos(pos, lineOffset = 0, chOffset = 0) {
            return {
              line: pos.line + lineOffset,
              ch: pos.ch + chOffset
            };
          }
          
          const INCLUSIVE_MARK_OPTIONS = {
            clearWhenEmpty: false,
            inclusiveLeft: true,
            inclusiveRight: true
          };
              
          if (slurp) {
            // forward means pathToSlurp is below, so we need to pull it up
            // backward means pathToSlurp is on top of where it should be, thus moving down
            const pathToSlurp = forward ? outerStatement.getNextSibling() : outerStatement.getPrevSibling();

            let markToSlurp;
            let markInnerBlockWithBraces;
            let markInnerBlockContent;
            try {
              const [rangeToSlurpStart, rangeToSlurpEnd] = range(pathToSlurp.node.loc).asCM();
              markToSlurp = cm.markText(rangeToSlurpStart, rangeToSlurpEnd, INCLUSIVE_MARK_OPTIONS);
              
              const [innerBlockRangeStart, innerBlockRangeEnd] = range(innerBlock.node.loc).asCM();
              markInnerBlockWithBraces = cm.markText(innerBlockRangeStart, innerBlockRangeEnd, INCLUSIVE_MARK_OPTIONS);
              markInnerBlockContent = cm.markText(adaptPos(innerBlockRangeStart, undefined, 1), adaptPos(innerBlockRangeEnd, undefined, -1), INCLUSIVE_MARK_OPTIONS);
              
              let consumedWhiteline = false;
              if (forward) {
                if (hasCleanLeft(rangeToSlurpStart) && isBlank(cm.getLine(rangeToSlurpStart.line - 1))) {
                  removeLine(rangeToSlurpStart.line - 1);
                  consumedWhiteline = true;
                }
              } else {
                if (hasCleanRight(rangeToSlurpEnd) && isBlank(cm.getLine(rangeToSlurpEnd.line + 1))) {
                  removeLine(rangeToSlurpEnd.line + 1);
                  consumedWhiteline = true;
                }
              }
              
              let slurpedText;
              {
                // remove::markToSLurp
                const { from, to } = markToSlurp.find();
                slurpedText = cm.getRange(from, to);
                cm.replaceRange('', from, to, '+input');
                this.underlineMark(cm, markToSlurp, 'red');
              }
              
              {
                // handle remainder of slurped line
                const line = markToSlurp.find().from.line;
                if (isBlank(cm.getLine(line))) {
                  removeLine(line);
                } else {
                  cm::indentFromTo(line, line);
                }
              }
              
              {
                // make space to insert the statement:
                // unravel single line innerBlocks
                const { from: innerFrom } = markInnerBlockContent.find();
                const { from: outerFrom } = markInnerBlockWithBraces.find();
                if (!hasCleanRight(innerFrom)) {
                  const braces = cm.getRange(outerFrom, innerFrom);
                  if (braces !== '{') {
                    throw new Error(`try to replace left border of block, which should be '{' but was '${braces}'`);
                  }
                  cm.replaceRange(`{\n`, outerFrom, innerFrom, '+input');
                }
                
                const { to: innerTo } = markInnerBlockContent.find();
                const { to: outerTo } = markInnerBlockWithBraces.find();
                if (!hasCleanLeft(innerTo)) {
                  const braces = cm.getRange(innerTo, outerTo);
                  if (braces !== '}') {
                    throw new Error(`try to replace right border of block, which should be '}' but was '${braces}'`);
                  }
                  cm.replaceRange(`\n}`, innerTo, outerTo, '+input');
                }
              }
              
              let preserveCursor = false;
              {
                // insert slurped text
                const line = forward ? markInnerBlockWithBraces.find().to.line - 1 : markInnerBlockWithBraces.find().from.line + 1;
                let shouldInsertExtraWhiteline = false;
                
                if (isBlank(cm.getLine(forward ? line : line))) {
                  const { from, to } = markInnerBlockWithBraces.find();
                  if (forward ? line - 1 === from.line : line + 1 === to.line) {
                    const { anchor, head } = cm.listSelections().first;
                    // cursor is on this very line
                    if (line === anchor.line && line === head.line) {
                      preserveCursor = true;
                    }
                  }
                } else {
                  if (consumedWhiteline) {
                    // we are not on a black line but the slurped text had one, so we insert it here
                    shouldInsertExtraWhiteline = true;
                  }
                }
                
                const pos = { line: forward ? line + 1 : line, ch: 0 };
                const prependWhiteline = shouldInsertExtraWhiteline && forward ? '\n' : '';
                const appendWhiteline = shouldInsertExtraWhiteline && !forward ? '\n' : '';
                cm.replaceRange(prependWhiteline + slurpedText + '\n' + appendWhiteline, pos, pos, '+input');
              }
              
              {
                const { from, to } = markInnerBlockWithBraces.find();
                cm::indentFromTo(from.line, to.line);
              }
              
              if (preserveCursor) {
                let lineToKill;
                cm.setSelections(cm.listSelections().map(({ anchor, head }, index) => {
                  if (index === 0) {
                    lineToKill = anchor.line;
                    if (forward) {
                      return { anchor: adaptPos(anchor, 1), head: adaptPos(head, 1) };
                    } else {
                      return { anchor: adaptPos(anchor, -1), head: adaptPos(head, -1) };
                    }
                  }
                  return { anchor, head };
                }));
                removeLine(lineToKill);
              }
              
              this.underlineMark(cm, markInnerBlockWithBraces, 'goldenrod');
              this.underlineMark(cm, markInnerBlockContent, 'gold');
              // this.underlineMark(cm, markToSlurp, 'steelblue');
            } finally {
              markToSlurp.clear();
              markInnerBlockWithBraces.clear();
              markInnerBlockContent.clear();
            }
          } else if (barf) {
            // forward means push the last statement (pathToBarf) out of the block downwards
            // backward: push first statement upwards
            const pathToBarf = forward ? innerBlock.get('body').last : innerBlock.get('body').first;

            let markToBarf;
            let markOuterStatement;
            let markBarfed;
            try {
              {
                // create marks
                const [rangeToBarfStart, rangeToBarfEnd] = range(pathToBarf.node.loc).asCM();
                markToBarf = cm.markText(rangeToBarfStart, rangeToBarfEnd, INCLUSIVE_MARK_OPTIONS);
                const [rangeOuterStatementStart, rangeOuterStatementEnd] = range(outerStatement.node.loc).asCM();
                markOuterStatement = cm.markText(rangeOuterStatementStart, rangeOuterStatementEnd, {
                  clearWhenEmpty: false,
                  inclusiveLeft: false,
                  inclusiveRight: false
                });
              }

              // #TODO: ensure there is a line below/above outer statement

              {
                if (forward) {
                  // ensure clean right of outer statement
                  const outerRight = markOuterStatement.find().to;
                  if (!hasCleanRight(outerRight)) {
                    cm.replaceRange('\n', outerRight, outerRight, '+input');
                  }
                  cm::indentFromTo(outerRight.line + 1, outerRight.line + 1);
                } else {
                  // ensure clean left of outer statement
                  const outerLeft = markOuterStatement.find().from;
                  if (!hasCleanLeft(outerLeft)) {
                    cm.replaceRange('\n', outerLeft, outerLeft, '+input');
                  }
                  cm::indentFromTo(outerLeft.line - 1, outerLeft.line - 1);
                }
              }

              let consumedWhiteline = false;
              {
                if (forward) {
                  const leftOfMark = markToBarf.find().from;
                  const lineAbove = leftOfMark.line - 1;
                  if (hasCleanLeft(leftOfMark) && isBlank(cm.getLine(lineAbove))) {
                    removeLine(lineAbove);
                    consumedWhiteline = true;
                  }
                } else {
                  const rightOfMark = markToBarf.find().to;
                  const nextLine = rightOfMark.line + 1;
                  if (hasCleanRight(rightOfMark) && isBlank(cm.getLine(nextLine))) {
                    removeLine(nextLine);
                    consumedWhiteline = true;
                  }
                }
              }

              let barfedText;
              let preserveCursor;
              {
                // remove text to barf
                const { from, to } = markToBarf.find();

                const { anchor, head } = cm.listSelections().first;
                if (range({ anchor: from, head: to }).containsRange(range({ anchor, head }))) {
                  // cursor completely to text to be barfed
                  const referenceIndex = cm.indexFromPos(from);
                  preserveCursor = [cm.indexFromPos(anchor) - referenceIndex, cm.indexFromPos(head) - referenceIndex];
                }

                barfedText = cm.getRange(from, to);
                cm.replaceRange('', from, to, '+input');
                this.underlineMark(cm, markToBarf, 'red');
              }

              {
                // handle remainder of barfed line
                const line = markToBarf.find().from.line;
                if (isBlank(cm.getLine(line))) {
                  removeLine(line);
                } else {
                  cm::indentFromTo(line, line);
                }
              }

              {
                // insert text to barf
                const line = forward ? markOuterStatement.find().to.line + 1 : markOuterStatement.find().from.line;
                const pos = { line, ch: 0 };
                markBarfed = cm.markText(pos, pos, INCLUSIVE_MARK_OPTIONS);
                cm.replaceRange(barfedText + '\n', pos, pos, '+input');

                // handle if cursor was completely in markToBarf
                if (preserveCursor) {
                  cm.setSelections(cm.listSelections().map(({ anchor, head }, index) => {
                    if (index === 0) {
                      const referenceIndex = cm.indexFromPos(pos);
                      const [anchorOffsetIndex, headOffsetIndex] = preserveCursor;
                      return { anchor: cm.posFromIndex(anchorOffsetIndex + referenceIndex), head: cm.posFromIndex(headOffsetIndex + referenceIndex) };
                    }
                    return { anchor, head };
                  }));
                }

                if (consumedWhiteline) {
                  if (forward) {
                    cm.replaceRange('\n', pos, pos, '+input');
                  } else {
                    const pos = { line: markOuterStatement.find().from.line, ch: 0 };
                    cm.replaceRange('\n', pos, pos, '+input');
                  }
                }
              }

              {
                const { from: fromOut, to: toOut } = markOuterStatement.find();
                const { from: fromMark, to: toMark } = markBarfed.find();
                cm::indentFromTo(Math.min(fromOut.line, fromMark.line), Math.max(toOut.line, toMark.line));
              }

              // this.underlineMark(cm, markOuterStatement, 'goldenrod');
              this.underlineMark(cm, markBarfed, 'green');
              // this.underlineMark(cm, markToBarf, 'green');
            } finally {
              markToBarf.clear();
              markOuterStatement.clear();
              markBarfed.clear();
            }
          }
        }
      }
    }));
  }

  // #api
  slurp(forward) {
    this.slurpOrBarf({ slurp: true, forward });
  }

  // #api
  barf(forward) {
    this.slurpOrBarf({ barf: true, forward });
  }

  /*MD ## List Items MD*/

  findListFragments() {
    const cm = this.cm;

    const { anchor, head } = cm.listSelections()[0];
    const [from, to] = asFromTo(anchor, head);

    const fromIndex = cm.indexFromPos(from);
    const toIndex = cm.indexFromPos(to);

    const str = cm.getValue();

    let listStartIndex = 0;
    let listEndIndex = str.length;
    let foundAList = false;
    const innerAreas = [];
    this.iterateNestingStructure(cm, undefined, (right, left) => {
      const onLeftSide = left.index < fromIndex;
      const onRightSide = toIndex <= right.index;
      const isBrackets = '([{'.includes(left.char);
      if (onRightSide && onLeftSide && isBrackets) {
        listStartIndex = left.index + 1;
        listEndIndex = right.index;
        foundAList = true;
        return false;
      }

      innerAreas.push([left, right]);
    });

    if (!foundAList) {
      lively.notify('found no list');
      return;
    }

    const start = cm.posFromIndex(listStartIndex);
    const end = cm.posFromIndex(listEndIndex);
    if (start.line - end.line > 10) {
      lively.notify('very big list found');
      return;
    }

    const areasInList = innerAreas.filter(([left, right]) => listStartIndex - 1 < left.index && right.index < listEndIndex);
    lively.notify(areasInList.length + 'areas');

    let substr = str.substring(listStartIndex, listEndIndex);
    areasInList.forEach(([left, right]) => {
      function replaceBetween(origin, startIndex, endIndex, insertion) {
        return origin.substring(0, startIndex) + insertion + origin.substring(endIndex);
      }
      const replacement = 'x'.repeat(right.index + 1 - left.index);
      substr = substr.substring(0, left.index - listStartIndex) + replacement + substr.substring(right.index + 1 - listStartIndex);
    });
    lively.notify(substr, 'substr');

    const fragments = [...substr.matchAll(/^\s*|\s*,\s*|(?<![\s,])\s*,?\s*$/g)].map(match => {
      const startIndex = match.index + listStartIndex;
      const endIndex = match[0].length + startIndex;
      return {
        from: cm.posFromIndex(startIndex),
        to: cm.posFromIndex(endIndex),
        isItem: false
      };
    }).joinElements((left, right) => {
      const item = {
        from: left.to,
        to: right.from,
        isItem: true,
        prev: left,
        next: right
      };
      left.next = right.prev = item;

      return item;
    });

    return [fragments, { from: start, to: end }];
  }

  // #api
  selectCurrentItem(outer) {
    const [fragments, list] = this.findListFragments();
    fragments.forEach((fragment, index) => {
      this.underlineText(this.cm, fragment.from, fragment.to, index % 2 === 0 ? 'orange' : 'green');
    }
    // lively.notify(cm.getRange(start, end), 'items');
    // return { anchor: start, head: end };
    );
  }

  /*MD ## Navigation MD*/
  /**
   * Get the root path
  */
  get programPath() {
    debugger
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

  expandSelectionOLD() {
    // lively.notify('foo')
    const maxPaths = this.selectionRanges.map(selection => {
      const pathToShow = this.getInnermostPathContainingSelection(this.programPath, selection);

      // go up again
      return pathToShow.find(path => {
        return range(path.node.loc).strictlyContainsRange(selection);
      }) || pathToShow;
    });

    this.selectPaths(maxPaths);
  }

  expandSelection() {
    // lively.notify('foo')
    const maxPaths = this.selectionRanges.map(selection => {
      const startingPath = this.getInnermostPathContainingSelection(this.programPath, selection);

      'foo';
      "foo".bar;
      var foo;
      `foo ${foo} bar`;
      let resultSelection;

      // go up again
      startingPath.find(path => {
        function fullySelected(path) {
          return range(path.node.loc).isEqual(selection);
        }

        // lively.warn(path.inList);
        //     lively.openInspector(path);
        if (fullySelected(path)) {
          return false;
        } else {
          if (path.isTemplateLiteral()) {
            // are we in a template element notation
            if (path.get('expressions').find(p => {
              var r = range(p.node.loc);
              r.start._cmCharacter -= 2;
              r.end._cmCharacter++;
              if (r.strictlyContainsRange(selection)) {
                resultSelection = r;
                return true;
              }
            })) {
              return true;
            }
          }

          if (path.isStringLiteral() || path.isTemplateLiteral()) {
            resultSelection = range(path.node.loc);
            resultSelection.start._cmCharacter++;
            resultSelection.end._cmCharacter--;

            // did selection expand?
            if (!resultSelection.isEqual(selection)) {
              return true;
            }
          }

          if (path.isTemplateElement()) {
            return false;
          }

          resultSelection = range(path.node.loc);

          return true;
        }
        // comparePos(a, b)

        // return range(path.node.loc).strictlyContainsRange(selection);
      }) || startingPath;

      return resultSelection || selection;
    });

    // const nodes = maxPaths.map(path => path.node);
    // const ranges = nodes.map(node => {
    //   let selectedRange = range(node.loc);
    //   if (false) {
    //     //only select the contents, not the quotes around it 
    //   }
    //   return selectedRange;
    // });
    this.codeProvider.selections = maxPaths;
    // this.cm.setSelections(maxPaths)
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
    debugger;
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

  /*MD ## Psych RemainingsMD*/
  // cleanup
  getLeftRightCharacters(char) {
    if (/[']/.test(char)) {
      return ["'", "'"];
    }
    if (/["]/.test(char)) {
      return ['"', '"'];
    }
    if (/[`~]/.test(char)) {
      return ['`', '`'];
    }
    if (/[()90]/.test(char)) {
      return ['(', ')'];
    }
    if (/[[\]]/.test(char)) {
      return ['[', ']'];
    }
    if (/[{}]/.test(char)) {
      return ['{', '}'];
    }
    throw new Error(`char ${char} not supported for leftRight`);
  }

  scanLeftRight(char, inclusive) {}

  psychIn(char, inclusive) {
    if (/[^'"`\(\)\[\]{}90~]/.test(char)) {
      lively.warn(`char ${char} not supported`);
      return;
    }

    const { lcm, cm, line, ch } = this.hoveredPosition;
    if (!cm) {
      return;
    }

    let anchorIndex = cm.indexFromPos({ line, ch }),
        headIndex = anchorIndex;

    const str = lcm.value;

    const [left, right] = this.getLeftRightCharacters(char);
    const {
      isLeft,
      isRight,
      getLeft,
      getRight
    } = this.psychUtils;

    // scan left
    {
      const stackLeft = [];
      while (anchorIndex - 1 >= 0) {
        const charToAdd = str[anchorIndex - 1];

        if (charToAdd === left && stackLeft.last !== getRight(charToAdd)) {
          break;
        }

        if (isRight(charToAdd)) {
          stackLeft.push(charToAdd);
        } else if (isLeft(charToAdd) && stackLeft.last === getRight(charToAdd)) {
          stackLeft.pop();
        }

        anchorIndex--;
      }
    }

    // scan right
    {
      const stackRight = [];
      while (headIndex < str.length) {
        const charToAdd = str[headIndex];

        if (charToAdd === right && stackRight.last !== getLeft(charToAdd)) {
          break;
        }

        if (isLeft(charToAdd)) {
          stackRight.push(charToAdd);
        } else if (isRight(charToAdd) && stackRight.last === getLeft(charToAdd)) {
          stackRight.pop();
        }

        headIndex++;
      }
    }

    if (inclusive) {
      anchorIndex--;
      headIndex++;
    }
    const anchor = cm.posFromIndex(anchorIndex);
    const head = cm.posFromIndex(headIndex);
    this.replaceSelectionWith(cm.getRange(anchor, head));
  }

}

Object.defineProperty(self, '__ASTCapabilities__', {
  configurable: true,
  enumerable: true,
  get() {
    return ASTCapabilities;
  }
});