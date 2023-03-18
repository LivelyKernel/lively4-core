
import Preferences from 'src/client/preferences.js';
import Morph from "src/components/widgets/lively-morph.js";
import 'src/client/keys-input.js';

import toTitleCase from "src/external/title-case.js";
import { indentFromTo } from './code-mirror-utils.js';

function comparePos(a, b) {
  return a.line - b.line || a.ch - b.ch;
}

class Mode {
  constructor(cmm, data) {
    this.cmm = cmm;
    this.data = data;
  }
  enter() {}
  exit() {}
}

class CommandMode extends Mode {}

// the standard editor mode
class InsertMode extends Mode {}

// special-purpose modes
class CaseMode extends Mode {}
class PsychMode extends Mode {}
class KillMode extends Mode {}
class GenerateMode extends Mode {}

class CodeMirrorModes {

  constructor(lcm, cm) {
    this.lcm = lcm;
    this.cm = cm;
  }

  get stack() {
    if (!this.lcm.inputModes) {
      this.lcm.inputModes = [];
    }
    return this.lcm.inputModes;
  }

  get defaultMode() {
    const commandModeAsDefault = Preferences.get('CommandModeAsDefault');
    return {
      type: commandModeAsDefault ? 'command' : 'insert',
      data: {}
    };
  }

  getMode() {
    return this.stack.length > 0 ? this.stack.last : this.defaultMode;
  }

  withASTCapabilities(callback) {
    Promise.resolve(this.lcm.astCapabilities).then(callback);
  }

  get ac() {
    return this.lcm.astCapabilities;
  }

  // #important
  handleKeyEvent(evt) {
    
    // Use this option in context menu to toggle off mode-specific behavior in case you shot yourself in the foot
    const circumventMode = Preferences.get('CircumventCodeMirrorModes');
    if (circumventMode) {
      return;
    }

    const completion = this.cm.state.completionActive;
    if (completion) {
      if (evt.key === 'Escape') {
        // use default behavior, i.e. close the completion
        return;
      }

      const digit = '0123456789'.split('').find(ea => ea === evt.key);
      if (digit) {
        cancelDefaultEvent();
        completion.pick(completion.data, parseInt(digit));
      }
    }

    // #KeyboardShortcut Shift-Escape clear multi-selection
    if (evt.key === 'Escape' && evt.shiftKey) {
      cancelDefaultEvent();
      this.cm.execCommand('singleSelection');
      return;
    }

    const { type, data } = this.getMode();

    // leave any mode with `Escape`
    const noModifier = !evt.altKey && !evt.ctrlKey && !evt.shiftKey;
    if (evt.key === 'Escape' && noModifier) {
      cancelDefaultEvent();
      if (this.stack.length === 0 && type === 'insert') {
        this.cm.execCommand('singleSelection');
      } else {
        this.popMode();
      }
      return;
    }

    if (evt.key === 'Tab') {
      cancelDefaultEvent();
      this.cm.execCommand(evt.ctrlKey ? 'indentAuto' : evt.shiftKey ? 'indentLess' : 'indentMore');
      return;
    }

    function cancelDefaultEvent() {
      evt.preventDefault();
      evt.codemirrorIgnore = true;
    }

    function isCommandInput() {
      return self.input.key('F4') || self.input.key('F23')
    }
    function isSelectionInput() {
      return self.input.key('F9') || self.input.key('F24')
    }
    function logKey(msg) {
      
      lively.warn(`${evt.ctrlKey}${evt.shiftKey}${evt.altKey}`, msg)
    }
    // logKey('modes')
    if (isCommandInput()) {
      
      // #KeyboardShortcut F4/F23-G code snippets generator
      if (evt.key === 'g') {
        cancelDefaultEvent();
        this.pushMode('generate');
        return;
      }
      
      // #KeyboardShortcut F4/F23-Shift-S slurp backward
      // #KeyboardShortcut F4/F23-S slurp forward
      if (evt.code === 'KeyS') {
        cancelDefaultEvent();
        this.ac.slurp(!evt.shiftKey)
        return;
      }
      
      // #KeyboardShortcut F4/F23-Shift-B barf upward
      // #KeyboardShortcut F4/F23-B barf downward
      if (evt.code === 'KeyB') {
        cancelDefaultEvent();
        this.ac.barf(!evt.shiftKey)
        return;
      }
      
    }
    
    // #KeyboardShortcut Alt-[ used in container to manipulate navbar
    if (evt.key === '[' && (evt.altKey && !evt.ctrlKey && !evt.shiftKey || evt.altRight)) {
      evt.preventDefault();
      evt.codemirrorIgnore = true;
    }

    if (isSelectionInput()) {
      const killSelectionState = () => {
        delete this.cm.innerOuter;
      };

      // #KeyboardShortcut F9/F24-O 'outer' modifier
      if (evt.key === 'o') {
        this.cm.innerOuter = 'outer';
        cancelDefaultEvent();
        return;
      }
      // #KeyboardShortcut F9/F24-I 'inner' modifier
      if (evt.key === 'i') {
        this.cm.innerOuter = 'inner';
        cancelDefaultEvent();
        return;
      }
      // #KeyboardShortcut F9/F24-L select 'list'
      if (evt.key === 'l') {
        const outer = this.cm.innerOuter === 'outer';
        const selections = this.cm.listSelections().map(({ anchor, head }) => {
          return this.ac.findSmartAroundSelection(this.cm, anchor, head, outer);
        });
        // Array.prototype.filter(test, i, array, context?)
        this.cm.setSelections(selections);
        killSelectionState();
        cancelDefaultEvent();
        return;
      }
      // #KeyboardShortcut F9/F24-K select 'item'
      if (evt.key === 'k') {
        const outer = this.cm.innerOuter === 'outer';
        const selections = this.cm.listSelections().map(({ anchor, head }) => {
          return this.ac.findSmartAroundSelection(this.cm, anchor, head, outer);
        });
        this.cm.setSelections(selections);
        killSelectionState();
        cancelDefaultEvent();
        return;
      }
      if (evt.key === 'q') {
        this.cm.listSelections().forEach(({ anchor, head }) => {
          this.ac.underlineText(this.cm, anchor, head);
        });
        killSelectionState();
        cancelDefaultEvent();
        return;
      }
    }

    if (type === 'insert') {
      const cm = this.cm;

      // #KeyboardShortcut Alt-G code snippets generator
      if (evt.key === 'g' && evt.altKey) {
        this.pushMode('generate');
        cancelDefaultEvent();
        return;
      }

      // #KeyboardShortcut = insert ' === ' at end of if condition
      if (' =!<>&|'.split('').includes(evt.key)) {
        const { line, ch } = cm.getCursor();
        const lineContent = cm.getLine(line);
        const match = lineContent.match(/(\s*\bif\s*\()(.+)\)\s?\{?/);

        const endOfCondition = match && match.index + match[1].length + match[2].length === ch;
        const singlePlainCursor = !cm.somethingSelected() && cm.listSelections().length === 1;
        if (singlePlainCursor && endOfCondition) {
          const condition = match[2];
          const insertions = [];
          insertions.push(['=', '<', '= ']);
          insertions.push(['=', '>', '= ']);
          insertions.push(['=', '!', '== ']);
          insertions.push(['=', ' ==', '= ']);
          insertions.push(['=', ' === ', '']);
          insertions.push(['=', '!== ', '']);
          insertions.push(['=', ' ', '=== ']);
          insertions.push(['=', '', ' === ']);
          insertions.push([' ', ' ', '']);
          insertions.push(['!', ' ', '!== ']);
          insertions.push(['!', '', ' !== ']);
          insertions.push(['<', ' <', '']);
          insertions.push(['<', ' ', '<']);
          insertions.push(['<', '', ' <']);
          insertions.push(['>', ' ', '> ']);
          insertions.push(['>', '', ' > ']);
          insertions.push(['&', '& ', '']);
          insertions.push(['&', '', ' && ']);
          insertions.push(['|', '| ', '']);
          insertions.push(['|', '', ' || ']);

          const insertion = insertions.find(([key, end]) => {
            return key === evt.key && condition.endsWith(end);
          });
          if (insertion) {
            cm.replaceSelection(insertion[2]);

            cancelDefaultEvent();
          }
        }
      }

      // #KeyboardShortcut AltRight-A insert arrow function with 0 arguments
      if (evt.key === 'a' && evt.altRight) {
        const cm = this.cm;

        const selections = cm.getSelections();
        cm.replaceSelection('() => ');
        cm.replaceSelections(selections, 'around');
        cancelDefaultEvent();
      }

      // #KeyboardShortcut CtrlRight-A insert arrow function with 1 argument
      if (evt.key === 'a' && evt.ctrlRight) {
        this.ac.insertArrowFunction(1);

        cancelDefaultEvent();
      }

      // #KeyboardShortcut AltRight-K kill line(s)
      if (evt.key === 'k' && evt.altRight) {
        const cm = this.cm;

        const chars = cm.listSelections().map(({ head }) => head.ch);
        this.cm.execCommand('deleteLine');
        cm.setSelections(cm.listSelections().map(({ head }, i) => {
          const pos = { line: head.line, ch: chars[i] };
          return { anchor: pos, head: pos };
        }));

        cancelDefaultEvent();
      }

      // #TODO: need to merge selections, if there are multiple on the same line
      // #KeyboardShortcut AltRight-D duplicate line(s)
      if (evt.key === 'd' && evt.altRight) {
        const cm = this.cm;

        cm.listSelections().reverse().forEach(({ anchor, head }) => {
          const anchorLine = anchor.line;
          const headLine = head.line;

          const startLine = anchorLine > headLine ? headLine : anchorLine;
          const endLine = anchorLine > headLine ? anchorLine : headLine;

          const start = { line: startLine, ch: 0 };
          const content = cm.getRange(start, { line: endLine + 1, ch: 0 });
          cm.replaceRange(content, start, start);
        });
        cancelDefaultEvent();
      }

      // #KeyboardShortcut AltRight-S enter select mode
      if (evt.key === 's' && evt.altRight && !evt.repeat) {
        this.pushMode('select'), cancelDefaultEvent();
      }

      if (evt.key === '<') {
        return;
        const that = this;
        that.value;
        const cm = that.editor;
        cm.indexFromPos(cm.getCursor());
        that.cm.listSelections().forEach(({ anchor, head }) => {
          if (comparePos(anchor, head) === 0) {
            const word = that.cm.findWordAt(anchor);
            that.cm.addSelection(word.anchor, word.head);
          }
        });
      }

      return;
    }

    var æ = type;

    const unifiedKeyDescription = evt => {
      const alt = evt.altKey ? evt.altRight ? '>^' : '^' : '';
      const ctrl = evt.ctrlKey ? evt.ctrlRight ? '>!' : '!' : '';
      const shift = evt.shiftKey ? evt.shiftRight ? '>+' : '+' : '';
      return ctrl + shift + alt + evt.key;
    };

    if (type === 'case' && !evt.repeat) {
      const transformCase = transformer => {
        // extend collapsed selections to words
        this.cm.listSelections().forEach(({ anchor, head }) => {
          if (comparePos(anchor, head) === 0) {
            const word = this.cm.findWordAt(anchor);
            this.cm.addSelection(word.anchor, word.head);
          }
        });

        const selections = this.cm.getSelections();
        this.cm.replaceSelections(selections.map(transformer), 'around');

        if (!data.multi) {
          this.popMode();
        }
      };

      const operations = {
        // #KeyboardShortcut z (case mode) undo
        z: () => this.cm.execCommand('undo'),
        // #KeyboardShortcut Enter (case mode) exit case mode
        Enter: () => this.popMode(),
        // #KeyboardShortcut Space (case mode) exit case mode
        Space: () => this.popMode(),
        // #KeyboardShortcut m (case mode) chain multiple case transformations
        m: () => data.multi = !data.multi,
        // #KeyboardShortcut c (case mode) camelCase
        c: () => transformCase(text => text.camelCase()),
        // #KeyboardShortcut C (case mode) Capitalize
        C: () => transformCase(text => text.capitalize()),
        // #KeyboardShortcut k (case mode) kebab-case
        k: () => transformCase(text => text.kebabCase()),
        // #KeyboardShortcut l (case mode) lOWERFIRST
        l: () => transformCase(text => text.lowerFirst()),
        // #KeyboardShortcut L (case mode) tolower
        L: () => transformCase(text => text.toLower()),
        // #KeyboardShortcut Ctrl-l (case mode) lower case
        '^l': () => transformCase(text => text.lowerCase()),
        // #KeyboardShortcut s (case mode) snake_case
        s: () => transformCase(text => text.snakeCase()),
        // #KeyboardShortcut S (case mode) Start Case
        S: () => transformCase(text => text.startCase()),
        // #KeyboardShortcut u (case mode) Upperfirst
        u: () => transformCase(text => text.upperFirst()),
        // #KeyboardShortcut U (case mode) TOUPPER
        U: () => transformCase(text => text.toUpper()),
        // #KeyboardShortcut Ctrl-u (case mode) UPPER CASE
        '^u': () => transformCase(text => text.upperCase()),
        // #KeyboardShortcut t (case mode) To Title Case
        t: () => transformCase(text => toTitleCase(text))
      };

      const operation = operations[(evt.ctrlKey ? '^' : '') + evt.key];
      if (operation) {
        cancelDefaultEvent();
        operation();
      } else {
        lively.notify(evt.key);
      }
      return;
    }

    if (type === 'select' && !evt.repeat) {
      const transformCase = transformer => {
        // extend collapsed selections to words
        this.cm.listSelections().forEach(({ anchor, head }) => {
          if (comparePos(anchor, head) === 0) {
            const word = this.cm.findWordAt(anchor);
            this.cm.addSelection(word.anchor, word.head);
          }
        });

        const selections = this.cm.getSelections();
        this.cm.replaceSelections(selections.map(transformer), 'around');

        if (!data.multi) {
          this.popMode();
        }
      };

      const operations = {
        // #KeyboardShortcut z (case mode) undo
        z: () => this.cm.execCommand('undo'),
        // #KeyboardShortcut Enter (case mode) exit case mode
        Enter: () => this.popMode(),
        // #KeyboardShortcut Space (case mode) exit case mode
        Space: () => this.popMode(),
        // #KeyboardShortcut m (case mode) chain multiple case transformations
        m: () => data.multi = !data.multi,
        // #KeyboardShortcut c (case mode) camelCase
        c: () => transformCase(text => text.camelCase()),
        // #KeyboardShortcut C (case mode) Capitalize
        C: () => transformCase(text => text.capitalize()),
        // #KeyboardShortcut k (case mode) kebab-case
        k: () => transformCase(text => text.kebabCase()),
        // #KeyboardShortcut l (case mode) lOWERFIRST
        l: () => transformCase(text => text.lowerFirst()),
        // #KeyboardShortcut L (case mode) tolower
        L: () => transformCase(text => text.toLower()),
        // #KeyboardShortcut Ctrl-l (case mode) lower case
        '^l': () => transformCase(text => text.lowerCase()),
        // #KeyboardShortcut s (case mode) snake_case
        s: () => transformCase(text => text.snakeCase()),
        // #KeyboardShortcut S (case mode) Start Case
        S: () => transformCase(text => text.startCase()),
        // #KeyboardShortcut u (case mode) Upperfirst
        u: () => transformCase(text => text.upperFirst()),
        // #KeyboardShortcut U (case mode) TOUPPER
        U: () => transformCase(text => text.toUpper()),
        // #KeyboardShortcut Ctrl-u (case mode) UPPER CASE
        '^u': () => transformCase(text => text.upperCase()),
        // #KeyboardShortcut t (case mode) To Title Case
        t: () => transformCase(text => toTitleCase(text))
      };

      const operation = operations[(evt.ctrlKey ? '^' : '') + evt.key];
      if (operation) {
        cancelDefaultEvent();
        operation();
      } else {
        lively.notify(evt.key);
      }
      return;
    }

    if (type === 'psych' && !evt.repeat) {
      if (evt.key.length === 1 || evt.key === 'Enter') {
        const { command, inclusive } = data;

        cancelDefaultEvent();
        this.popMode();

        this.ac[command](evt.key, inclusive);
        return;
      }
    }

    if (type === 'command' && !evt.repeat) {
      const unifiedKeyDescription = e => {
        const alt = e.altKey ? 'Alt-' : '';
        const ctrl = e.ctrlKey ? 'Ctrl-' : '';
        const shift = e.shiftKey ? 'Shift-' : '';
        return ctrl + shift + alt + e.key;
      };

      const operations = {
        i: () => {
          this.ac.inlineLocalVariable();
        },
        Enter: () => {
          this.pushMode('insert');
        },
        k: () => {
          this.pushMode('kill');
        },
        'Shift-K': () => {
          this.cm.execCommand('deleteLine');
        }
      };

      const operation = operations[unifiedKeyDescription(evt)];
      if (operation) {
        cancelDefaultEvent();
        operation();
      } else {
        lively.notify(unifiedKeyDescription(evt), [this.lcm, this.cm, evt]);
      }
    }

    if (type === 'generate' && !evt.repeat) {
      const unifiedKeyDescription = e => {
        const alt = e.altKey ? 'Alt-' : '';
        const ctrl = e.ctrlKey ? 'Ctrl-' : '';
        const shift = e.shiftKey ? 'Shift-' : '';
        return ctrl + shift + alt + e.key;
      };

      const operations = {
        // #KeyboardShortcut i wrap in if-statement
        i: () => {
          this.ac.generateIf('if');
        },
        // #KeyboardShortcut f generate function
        f: () => {
          const line = this.cm.getLine(this.cm.getCursor().line);

          if (/\S/.test(line)) {
            this.ac.newlineAndIndent();
          }

          this.cm.replaceSelection('function ');
          this.cm.replaceSelection(`() {
  
}`, 'start');
          this.cm.replaceSelection('fn', 'around');

          const functionHeadLine = this.cm.getCursor().line;
          this.cm::indentFromTo(functionHeadLine, functionHeadLine + 2)

          this.ensureMode('insert');
        },
        // #KeyboardShortcut v declare variable
        v: () => {
          if (this.cm.somethingSelected()) {
            this.ac.extractExpressionIntoLocalVariable();
          } else {
            const line = this.cm.getLine(this.cm.getCursor().line);

            if (/\S/.test(line)) {
              this.ac.newlineAndIndent(true);
            }
            this.cm.execCommand('indentAuto');

            this.cm.replaceSelection('const ');
            this.cm.replaceSelection(' = $hole$;', 'start');
            this.cm.replaceSelection('name', 'around');

            this.ensureMode('insert');
          }
        },
        // #KeyboardShortcut m insert method category
        m: () => {
          const line = this.cm.getLine(this.cm.getCursor().line);

          if (/\S/.test(line)) {
            this.ac.newlineAndIndent();
          }
          this.cm.execCommand('indentAuto');

          this.cm.replaceSelection('/*MD ## ');
          this.cm.replaceSelection(' MD*/;', 'start');
          this.cm.replaceSelection('Category', 'around');

          this.ensureMode('insert');
        },
        // #KeyboardShortcut t insert todo for this line
        t: () => {
          const line = this.cm.getLine(this.cm.getCursor().line);

          if (/\S/.test(line)) {
            this.ac.newlineAndIndent();
          }
          this.cm.execCommand('indentAuto');

          this.cm.replaceSelection('// #TODO: ');

          this.ensureMode('insert');
        }
      };

      const operation = operations[unifiedKeyDescription(evt)];
      if (operation) {
        this.popMode();
        cancelDefaultEvent();
        operation();
      } else {
        lively.notify(unifiedKeyDescription(evt), [this.lcm, this.cm, evt]);
      }
    }

    if (type === 'kill' && !evt.repeat) {
      const unifiedKeyDescription = e => {
        const alt = e.altKey ? 'Alt-' : '';
        const ctrl = e.ctrlKey ? 'Ctrl-' : '';
        const shift = e.shiftKey ? 'Shift-' : '';
        return ctrl + shift + alt + e.key;
      };

      const operations = {
        k: () => {
          const cursor = this.cm.getCursor();
          this.cm.execCommand('deleteLine');
          this.cm.setCursor(cursor);
          this.popMode();
        },
        l: () => {
          this.cm.execCommand('killLine'); // cursor to end of line
          this.popMode();
        },
        j: () => {
          this.cm.execCommand('delLineLeft');
          this.popMode();
        },
        o: () => {
          this.cm.execCommand('delWrappedLineRight');
          this.popMode();
        },
        u: () => {
          this.cm.execCommand('delWrappedLineLeft');
          this.popMode();
        }
      };

      const operation = operations[unifiedKeyDescription(evt)];
      if (operation) {
        cancelDefaultEvent();
        operation();
      } else {
        lively.notify(unifiedKeyDescription(evt), [this.lcm, this.cm, evt]);
      }
    }
  }

  ensureMode(type, data = {}) {
    if (this.getMode().type === type) {
      return;
    }

    this.pushMode(type, data);
  }

  pushMode(type, data = {}) {
    this.stack.push({ type, data });
    this.dispatchMode(type, data).enter();
    this.renderModeStack();
  }

  popMode() {
    if (this.stack.length === 0) {
      lively.notify('no mode to pop');
      return;
    }
    const { type, data } = this.stack.last;
    this.dispatchMode(type, data).exit();
    this.stack.pop();
    this.renderModeStack();
  }

  dispatchMode(type, data) {
    const modeMap = new Map();
    modeMap.set('case', CaseMode);
    modeMap.set('psych', PsychMode);
    modeMap.set('command', CommandMode);
    modeMap.set('insert', InsertMode);
    modeMap.set('kill', KillMode);
    modeMap.set('generate', GenerateMode);

    let mode = modeMap.get(type);
    if (!mode) {
      lively.warn('No mode found for ' + type);
      mode = Mode;
    }
    return new mode(this, data);
  }

  renderModeStack() {
    const modeContainer = this.lcm::Morph.prototype.getSubmorph('#modes-indicator');
    modeContainer.innerHTML = '';
    modeContainer.append(...this.stack.map(({ type }) => <div style="background: aliceblue; color: cornflowerblue; border-top: 0.5px solid blue;">{type}</div>).reverse());
  }
}

self.__CodeMirrorModes__ = function __CodeMirrorModes__(lcm, cm) {
  return new CodeMirrorModes(lcm, cm);
};