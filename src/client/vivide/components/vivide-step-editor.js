import Morph from 'src/components/widgets/lively-morph.js';
import ContextMenu from "src/client/contextmenu.js";

export default class VivideStepEditor extends Morph {
  get editor() { return this.get('#editor'); }
  get cm() { return this.editor.editor; }
  
  async initialize() {
    this.windowTitle = "VivideStepEditor";
    
    this.registerButtons();
    
    this.editor.editorLoaded().then(() => this.editorConfig());
  }
  editorConfig() {
    this.editor.setOption('viewportMargin', Infinity);
    if (!this.editor.value) {
      this.editor.value = 'Initializing Step...';
    }
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
      // #KeyboardShortcut Alt-D remove this step from vivide script
      "Alt-D": cm => {
        this.onRemoveStep();
        // #TODO: should focus next step editor
      },
      // #KeyboardShortcut Alt-Up focus previous step editor
      "Alt-Up": cm => {
        this.scriptEditor &&this.scriptEditor.navigateStepEditors(this, false);
      },
      // #KeyboardShortcut Alt-Down focus next step editor
      "Alt-Down": cm => {
        this.scriptEditor &&this.scriptEditor.navigateStepEditors(this, true);
      },
      // #TODO: implement
      // #KeyboardShortcut Alt-Right inverse code folding (indent)
      "Alt-Right": cm => {
        lively.warn('\'Inverse Code Folding\' not yet implemented');
      },
      // #TODO: implement
      // #KeyboardShortcut Alt-Left inverse code folding (dedent)
      "Alt-Left": cm => {
        lively.warn('\'Inverse Code Folding\' not yet implemented');
      },      
    });
    
    this.editor.doSave = text => this.stepSaved(text);
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
    });
  }

  async stepSaved(text) {
    this.step.source = text;
    this.step.update();
  }
}