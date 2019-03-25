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
  
  async processObject(model) {
    const text = model.properties.get('text') || textualRepresentation(model.object);
    
    const textEditor = await lively.create('lively-code-mirror');
    textEditor.value = text;
    this.list.appendChild(textEditor);
  }
  
  livelyMigrate(other) {
    this.display(other.model, other.config)
  }

  livelyExample() {
    // Displaying a vivide tree widget is only meaningful in a vivide view
  }  
}