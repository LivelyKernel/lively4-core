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

    editor.editorLoaded().then(async () => {
      // text
      // #VivideProperty text(String) The text to be displayed
      // #VivideProperty label(String) The text to be displayed (fallback for <text>)
      const content = model.properties.get('text') || model.properties.get('label');
      // #VivideProperty file(String) The url-string of the file you are editing
      const file = model.properties.get('file');
      if (content) {
        editor.value = content;
      } else if (file) {
        editor.value = await fetch(file).then(r => r.text());
      } else {
        editor.value = textualRepresentation(model.object);
      }

      // save
      // #VivideProperty onSave(Function<text:String>) The callback invoked when the editor is saved.
      const onSave = model.properties.get('onSave');
      if (onSave) {
        editor.doSave = onSave;
      } else if (file) {
        editor.doSave = text => lively.files.saveFile(file, text);
      }

      const cm = editor.editor;

      cm.on('focus', () => this.setSelectedData([model.object]));

      cm.addKeyMap({
        // #KeyboardShortcut Alt-Up focus previous step editor
        "Alt-Up": () => this.editorNavigation(editor, true),
        // #KeyboardShortcut Alt-Down focus next step editor
        "Alt-Down": () => this.editorNavigation(editor, false),
      });
    });
  }
  
  setSelectedData(data) {
    this._selectedData = data;
    this.selectionChanged(this._selectedData);
  }
  
  getSelectedData() {
    return this._selectedData || [];
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