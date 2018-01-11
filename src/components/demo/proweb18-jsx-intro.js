import Morph from 'src/components/widgets/lively-morph.js';
import { flatMap, upperFirst } from 'utils';

export default class Proweb18JsxIntro extends Morph {
  get content() { return this.get('#content'); }
  async initialize() {
    this.windowTitle = "Proweb18JsxIntro";
    
    this.innerHTML = "";

    this.simpleButton();
    this.codeMirrorWithSaveButton();
  }
  simpleButton() {
    this.buttonInnerHTML();
    this.buttonDOMAPI();
    this.buttonJSX();
  }
  buttonInnerHTML() {
    // innerHTML
    let button = document.createElement('button');
    button.innerHTML = '<i class="fa fa-save"></i> Save';
    this.content.appendChild(button);
  }
  buttonDOMAPI() {
    // DOM API
    let faIcon = document.createElement('i');
    faIcon.classList.add('fa', 'fa-save');
    
    let button = document.createElement('button');
    button.appendChild(faIcon);
    button.appendChild(document.createTextNode(' Save'));

    this.content.appendChild(button);
  }
  buttonJSX() {
    // JSX
    this.content.appendChild(<button><i class="fa fa-save"></i> Save</button>)
  }
  async codeMirrorWithSaveButton() {
    let content = 'Edit this File!'
    function save() { lively.notify("SAVE"); }
    
    // DOM API
    let cm = document.createElement('lively-code-mirror');
    cm.classList.add("content");
    cm.value = content;
    this.appendChild(cm);

    // JSX
    let editor= await (<lively-code-mirror />);
    editor.value = content+2;
    this.appendChild(<div>{editor}
      <button click={save}><i class="fa fa-save"></i> Save</button>
    </div>);
  }
}