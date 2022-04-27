"enable aexpr";
import { Layer, proceed } from 'src/client/ContextJS/src/Layers.js';

import Morph from 'src/components/widgets/lively-morph.js';

import {Server, EditorWidget} from './mock-editor.js'

export default class RemoteEditor extends Morph {
  async initialize() {
    this.windowTitle = "RemoteEditor";
    this.file = await lively.prompt("file to edit");
    
    this.save.addEventListener("click", () => {this.editor.save(this.text.value)})
    
    this.server = new Server(() => this.serverCheckbox.checked);
    this.editor = new EditorWidget(this.file);
    
    this.server.onFileChange(this.file, (text) => this.merge(text))
    
    always: this.content.innerHTML = this.editor.render().outerHTML;
    
    this.onlineLayer = new Layer("onlineEditor");
    this.onlineLayer.onActivate(() => this.merge(this.server.read(this.file)));
    /**/
    this.darkThemeLayer = new Layer("dark theme");

    const server = this.server;
    this.onlineLayer.refineObject(this.editor, {  
      save(text) {
        server.send(this.file, text)
        proceed(text)
      },
      render() {
        return <div style="border:2px solid blue">
          {proceed()}
        </div>
      }
    })

    this.darkThemeLayer.refineObject(this.editor, {  
      render() {
        const content = proceed();
        content.theme = "dark";
        return content;
      }
    })
    
    this.darkThemeLayer.activeWhile(() => true);
    this.darkThemeLayer.onActivate(() => {});
    /**/

    this.onlineLayer.activeWhile(() => this.workRemoteButton.checked && this.server.connected);
    
  }
  
  merge(text) {
    this.editor.localStorage.merge(text);
  }
  
  get workRemoteButton() {
    return this.get("#workRemoteButton");
  }
  
  get content() {
    return this.get('#content');
  }
  
  get save() {
    return this.get('#save');
  }
  
  get text() {
    return this.get('#text');
  }
  
  // Button that "enables"/"disables" our mock server
  get serverCheckbox() {
    return this.get('#server');
  }
}