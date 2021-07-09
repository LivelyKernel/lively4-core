
import Preferences from 'src/client/preferences.js';
import Morph from "src/components/widgets/lively-morph.js";

import toTitleCase from "src/external/title-case.js";

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
class CaseMode extends Mode {}
class PsychMode extends Mode {}
class CommandMode extends Mode {}
class InsertMode extends Mode {}

const o = {
  r: 'reverse',
  p: 'reverse',
  i: 'reverse'
};

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

  handleKeyEvent(evt) {
    // Use this option in context menu to toggle off mode-specific behavior in case you shot yourself in the foot
    const useDefault = Preferences.get('CircumventCodeMirrorModes');
    if (useDefault) {
      return;
    }

    // #KeyboardShortcut Shift-Escape clear multi-selection
    if (evt.key === 'Escape' && evt.shiftKey) {
      cancelDefaultEvent();
      this.cm.execCommand('singleSelection');
      return;
    }

    if (evt.key === 'Tab') {
      cancelDefaultEvent();
      this.cm.execCommand(evt.ctrlKey ? 'indentAuto' : evt.shiftKey ? 'indentLess' : 'indentMore');
      return;
    }

    // no mode
    if (this.stack.length === 0) {
      return;
    }

    function cancelDefaultEvent() {
      evt.preventDefault();
      evt.codemirrorIgnore = true;
    }

    // leave any mode with `Escape`
    const noModifier = !evt.altKey && !evt.ctrlKey && !evt.shiftKey;
    if (evt.key === 'Escape' && noModifier) {
      cancelDefaultEvent();
      this.popMode();
      return;
    }

    const { type, data } = this.stack.last;
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
      };

      const operations = {
        z: () => this.cm.execCommand('undo'),
        Enter: () => this.popMode(),
        ' ': () => this.popMode(),
        c: () => transformCase(text => text.camelCase()),
        C: () => transformCase(text => text.capitalize()),
        k: () => transformCase(text => text.kebabCase()),
        l: () => transformCase(text => text.lowerFirst()),
        L: () => transformCase(text => text.toLower()),
        '^l': () => transformCase(text => text.lowerCase()),
        s: () => transformCase(text => text.snakeCase()),
        S: () => transformCase(text => text.startCase()),
        u: () => transformCase(text => text.upperFirst()),
        U: () => transformCase(text => text.toUpper()),
        '^u': () => transformCase(text => text.upperCase()),
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

        this.lcm.astCapabilities(this.cm).then(ac => ac[command](evt.key, inclusive));
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
          this.lcm.astCapabilities(this.cm).then(ac => ac.inlineLocalVariable());
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

  pushMode(type, data = {}) {
    this.stack.push({ type, data });
    this.dispatchMode(type, data).enter();
    this.renderModeStack();
  }

  popMode() {
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

    const mode = modeMap.get(type);
    if (!mode) {
      throw new Error('No mode found for ' + type);
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