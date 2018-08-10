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
      this.editor.value = 'Initializing Script...';
    }
    this.editor.setOption("extraKeys", {
      // #KeyboardShortcut Alt-N insert new vivide script step after this one 
      "Alt-N": cm => {
        this.showTypeMenu();
      },
      // #TODO: implement
      // #KeyboardShortcut Alt-Shift-N insert new vivide script step before this one 
      "Alt-Shift-N": cm => {
        lively.warn("'Insert Before' not yet implemented");
      },
      // #KeyboardShortcut Alt-D remove this step from vivide script
      "Alt-D": cm => {
        this.onRemoveStep();
      },
      // #KeyboardShortcut Alt-Up focus previous step editor
      "Alt-Up": cm => {
        lively.warn("'Up");
        this.scriptEditor &&this.scriptEditor.navigateStepEditors(this, false);
      },
      // #KeyboardShortcut Alt-Down focus next step editor
      "Alt-Down": cm => {
        lively.warn("'Down");
        this.scriptEditor &&this.scriptEditor.navigateStepEditors(this, true);
      },
    });
    
    this.editor.doSave = text => this.stepSaved(text);
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
      this.cm.setCursor(this.cm.lineCount(), 0);
    });
  }

  async stepSaved(text) {
    this.step.source = text;
    this.step.update();
  }
}