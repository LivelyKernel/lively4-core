
import Preferences from 'src/client/preferences.js';
import Morph from "src/components/widgets/lively-morph.js";

class Mode {
  constructor(cmm, data) {
    this.cmm = cmm;
    this.data = data;
  }
  enter() {}
  exit() {}
}
class CaseMode extends Mode {}
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

    const unifiedKeyDescription = e => {
      const alt = e.altKey ? 'Alt-' : '';
      const ctrl = e.ctrlKey ? 'Ctrl-' : '';
      const shift = e.shiftKey ? 'Shift-' : '';
      return ctrl + shift + alt + e.key;
    };

    // #TODO: generic cancel multiselect using Shift-Escape

    if (this.lcm.classList.contains('psych-mode') && !evt.repeat) {
      const exitPsychMode = () => {
        this.lcm.classList.remove('psych-mode');
        this.lcm.removeAttribute('psych-mode-command');
        this.lcm.removeAttribute('psych-mode-inclusive');
      };

      if (evt.key === 'Escape') {
        cancelDefaultEvent();
        exitPsychMode();
        return;
      }

      if (evt.key.length === 1) {
        const which = this.lcm.getAttribute('psych-mode-command');
        const inclusive = this.lcm.getJSONAttribute('psych-mode-inclusive');

        cancelDefaultEvent();
        exitPsychMode();

        this.lcm.astCapabilities(this.cm).then(ac => ac[which](evt.key, inclusive));
        return;
      }
    }

    if (this.lcm.classList.contains('ast-mode') && !evt.repeat) {
      const unifiedKeyDescription = e => {
        const alt = e.altKey ? 'Alt-' : '';
        const ctrl = e.ctrlKey ? 'Ctrl-' : '';
        const shift = e.shiftKey ? 'Shift-' : '';
        return ctrl + shift + alt + e.key;
      };

      const operations = {
        Escape: () => {
          this.lcm.classList.remove('ast-mode');
        },
        i: () => {
          this.lcm.astCapabilities(this.cm).then(ac => ac.inlineLocalVariable());
        }
      };

      const operation = operations[unifiedKeyDescription(evt)];
      if (operation) {
        evt.preventDefault();
        evt.codemirrorIgnore = true;

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
    const {type, data} = this.stack.last
    this.dispatchMode(type, data).exit();
    this.stack.pop();
    this.renderModeStack();
  }

  dispatchMode(type, data) {
    const modeMap = new Map();
    modeMap.set('case', CaseMode);

    const mode = modeMap.get(type);
    if (!mode) {
      throw new Error('No mode found for ' + type);
    }
    return new mode(this, data);
  }

  renderModeStack() {
    const modeContainer = this.lcm::Morph.prototype.getSubmorph('#modes-indicator');
    modeContainer.innerHTML = '';
    modeContainer.append(...this.stack.reverse().map(({ type }, i) => <div>{i}{type}</div>));
  }
}

self.__CodeMirrorModes__ = function __CodeMirrorModes__(lcm, cm) {
  return new CodeMirrorModes(lcm, cm);
};