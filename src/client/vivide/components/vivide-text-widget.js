import VivideWidget from 'src/client/vivide/components/vivide-widget.js';
import { textualRepresentation } from 'utils';

export default class VivideTextWidget extends VivideWidget {
  async initialize() {
    this.windowTitle = "VivideTextWidget";
  }

  async display(forest, config) {
    super.display(forest, config);
    
    for (let model of forest) {
      await this.processObject(model);
    }
  }
  
  get list() { return this.get('#content'); }
  get shownEditors() { return Array.from(this.list.childNodes);}
  get editorPool() { return this.get('#editor-pool'); }
  get hiddenEditors() { return Array.from(this.editorPool.childNodes);}

  async createEditor() {
    const textEditor = await lively.create('lively-code-mirror');
    this.list.appendChild(textEditor);
    return textEditor;
  }
  
  async processObject(model) {
    const editor = await this.createEditor();
    this.list.appendChild(editor);

    const text = model.properties.get('text') || textualRepresentation(model.object);
    editor.value = text;
    
    editor.editorLoaded().then(x => {
      editor.doSave = text => this.stepSaved(text);

      const cm = editor.editor;

      cm.addKeyMap({
        // #KeyboardShortcut Alt-Up focus previous step editor
        "Alt-Up": () => this.editorNavigation(editor, true),
        // #KeyboardShortcut Alt-Down focus next step editor
        "Alt-Down": () => this.editorNavigation(editor, false),
      });
    });
  }
  
  async editorNavigation(currentEditor, up) {
    const editors = this.shownEditors;
    let index = editors.indexOf(currentEditor) + (up ? -1 : 1);
    index = index.clamp(0, editors.length - 1);
    this.focusEditor(editors[index]);
  }
  
  async focusEditor(editor) {
    await editor.editorLoaded()
    const cm = editor.editor;
    cm.focus();
  }
  
  livelyMigrate(other) {
    this.display(other.model, other.config)
  }

  livelyExample() {
    // Displaying a vivide tree widget is only meaningful in a vivide view
  }  
}