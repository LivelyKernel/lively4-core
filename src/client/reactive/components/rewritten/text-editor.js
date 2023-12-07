"enable aexpr";

import { Layer, proceed } from 'src/client/ContextJS/src/Layers.js';
import { debounce } from "utils";

import Morph from 'src/components/widgets/lively-morph.js';

import { EditorWidget } from './mock-editor.js';

const randomThemeStyles = ["color:white; background-color:gray;", "color:red; background-color:gray;", "color:red; background-color:white;", "color:green; background-color:gray;", "color:green; background-color:white;", "color:blue; background-color:gray;", "color:blue; background-color:white;"];
let randomThemeStyle = "color:white; background-color:gray;";

export default class TextEditor extends Morph {
  async initialize() {
    this.aexprs = [];
    this.windowTitle = "Text Editor";
    this.file = "test.txt";
    this.editor = new EditorWidget(this.file, this.text);

    this.aexprs.push(aexpr(() => this.text.value).dataflow(v => {
      this.editor.save(v);
      this.characters = v.length;
      this.words = v.split(/\s+/).length;
      this.sentences = v.split(/[.!?]/).length;
    }));

    this.setupMetrics();


    always: this.text.style = this.editor.style();
    
    always: this.metrics.innerHTML = 
`${this.avgWordsPerSentence} Wörter/Satz
${this.avgCharactersPerWord} Buchstaben/Wort
${this.flenschKincaidIndex} Sprachlevel (Flensch Kincaid)
`

    this.discoLayer = new Layer("disco mode");

    this.discoLayer.refineObject(this.editor, {
      style() {
        return `${randomThemeStyle} ${proceed()}`;
      }
    });

    this.discoLayer.activeWhile(() => this.discoModeCheckbox.checked);
    this.discoLayer.onActivate(() => this.intervalID = setInterval(() => {
      randomThemeStyle = randomThemeStyles[Math.floor(Math.random() * 6.999)];
    }, 100));
    this.discoLayer.onDeactivate(() => clearInterval(this.intervalID));
  }
  
  setupMetrics() {
    always: this.avgWordsPerSentence = this.words / this.sentences;
    always: this.avgCharactersPerWord = this.characters / this.words;

    always: this.flenschKincaidIndex = 200 - this.avgWordsPerSentence - 25 * this.avgCharactersPerWord;
  }

  
  
  registerDatabinding(aexpr, name) {
    this.aexprs.push(aexpr);
  }

  livelyPreMigrate(other) {
    this.disposeBindings();
  }

  disconnectedCallback() {
    this.disposeBindings();
  }

  disposeBindings() {
    this.aexprs.forEach(ae => ae.dispose());
    this.discoLayer.remove();
  }

  merge(text) {
    this.editor.localStorage.merge(text);
  }

  get workRemoteButton() {
    return this.get("#workRemoteButton");
  }

  get metrics() {
    return this.get("#metrics");
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

  get discoModeCheckbox() {
    return this.get('#disco');
  }
}