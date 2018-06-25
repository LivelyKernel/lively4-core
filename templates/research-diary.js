import Morph from 'src/components/widgets/lively-morph.js';

import { Graph, _, DEFAULT_FOLDER_URL } from 'src/client/triples/triples.js';
import { promisedEvent, debounce, sortBy, last } from "utils";

function getTodaysTitle() {
  function toStringWithTrailingZero(number) {
    return (number < 10 ? "0" : "") + number;
  }
  
  const today = new Date();
  const year = today.getFullYear();
  const month = toStringWithTrailingZero(today.getMonth() + 1);
  const day = toStringWithTrailingZero(today.getDate());
  
  return `Research-Diary Entry ${year}.${month}.${day}`;
}

export default class ResearchDiary extends Morph {
  get codeEditor() { return this.get('#ace'); }
  get currentEntryURL() { return this.getAttribute('data-current-entry-url'); }
  set currentEntryURL(url) { this.setAttribute("data-current-entry-url", url); return url; }
  
  async initialize() {
    this.windowTitle = "Research Diary";
    this.windowIcon = '<i class="fa fa-book" aria-hidden="true"></i>';

    await this.prepareEditor();
    await this.refreshList();

    this.get('#new').addEventListener("click", ::this.createNewEntry);
    
    const urlToLoad = this.currentEntryURL;
    if (urlToLoad && urlToLoad !== "") {
      const graph = await Graph.getInstance();
      const entryKnot = await graph.requestKnot(urlToLoad);
      this.loadEntry(entryKnot);
    }
    
    // this.codeEditor.editor.navigateFileStart()
  }
  
  async prepareEditor() {
    const editorComp = this.codeEditor;

    await editorComp.editorLoaded();
    
    // editorComp.editor.setOptions({
    //   maxLines:Infinity,
    // });
    // editorComp.enableAutocompletion();
    // editorComp.aceRequire('ace/ext/searchbox')

    editorComp.editor.setOption("mode", "gfm");
    editorComp.editor.setOption("lineWrapping", true);
    
    this.debouncedSetPreviewText = ::this.setPreviewText::debounce(600);
    editorComp.addEventListener("change" , this.debouncedSetPreviewText);
    this.debouncedSave = ::this.save::debounce(2000);
    editorComp.addEventListener("change" , e => this.debouncedSave(this.codeEditor.value));
  }
  
  get researchDiaryURL() { return DEFAULT_FOLDER_URL + "Research_Diary.md"; }
  get entryOfURL() { return DEFAULT_FOLDER_URL + "entry_of.md"; }
  async getEntries() {
    const graph = await Graph.getInstance();
    const researchDiaryKnot = await graph.requestKnot(this.researchDiaryURL);
    const entryOfKnot = await graph.requestKnot(this.entryOfURL);

    return graph.query(_, entryOfKnot, researchDiaryKnot).map(triple => triple.subject);
  }
  async refreshList() {
    function getDateString(entry) {
      return entry.label().split(' ')::last();
    }
    const entries = await this.getEntries();
    const ul = this.get('#nav ul');
    ul.innerHTML = "";
    entries
      ::sortBy(getDateString)
      .reverse()
      .forEach(entry => {
        let a = <a>{getDateString(entry)}</a>;
        a.addEventListener('click', e => this.loadEntry(entry));

        ul.appendChild(<li>{a}</li>);
      });
  }
  
  entryTemplate() {
    return `# ${getTodaysTitle()}

## Erkenntnisse

- 

## MITs for Today

- 

## Further Tasks

- 

## Big Rocks (for the week)

- 
`;
  }
  async createNewEntry() {
    let content = this.entryTemplate();
    
    this.codeEditor.editor.setValue(content);
    this.codeEditor.editor.setCursor({line: 8, ch: 0});
    this.codeEditor.editor.execCommand("goLineEnd")
    this.codeEditor.editor.focus();
    
    this.immediatePreviewNoSave();
    
    let graph = await Graph.getInstance();
    let newKnot = await graph.createKnot(DEFAULT_FOLDER_URL, getTodaysTitle(), 'md');
    this.currentEntryURL = newKnot.url;

    await newKnot.save(content);
    await graph.createTriple(newKnot.url, this.entryOfURL, this.researchDiaryURL, DEFAULT_FOLDER_URL);
    
    this.refreshList();
    lively.notify(`Created new diary entry.`);
  }
  loadEntry(entryKnot) {
    this.currentEntryURL = entryKnot.url;
    
    this.codeEditor.editor.setValue(entryKnot.content);    
    this.immediatePreviewNoSave();
  }
  immediatePreviewNoSave() {
    this.debouncedSave.cancel();
    this.debouncedSetPreviewText.cancel();
    this.setPreviewText();
  }
  setPreviewText() {
    this.get("#markdown").setContent(this.codeEditor.value);
  }
  async save(text) {
    let graph = await Graph.getInstance();
    let entry = graph.getKnots().find(knot => knot.url === this.currentEntryURL)
    if(entry) {      
      await entry.save(text);
      lively.notify('saved diary entry');
    } else {
      lively.notify(`No knot found for ${this.currentEntryURL}`);
    }
  }

  livelyPrepareSave() {
    //this.setAttribute("data-knot-url", this.urlString);
  }
}
