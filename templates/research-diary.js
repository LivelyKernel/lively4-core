import Morph from './Morph.js';

import { Graph, _ } from 'src/client/triples/triples.js';
import lively from 'src/client/lively.js';
import {promisedEvent} from "utils";

function getTodaysTitle() {
  function toStringWithTrailingZero(number) {
    return (number < 10 ? "0" : "") + number;
  }
  
  const today = new Date();
  const year = today.getFullYear();
  const month = toStringWithTrailingZero(today.getMonth() + 1);
  const day = toStringWithTrailingZero(today.getDate());
  
  const title = `Research-Diary Entry ${year}.${month}.${day}`;
  
  return title;
}

export default class ResearchDiary extends Morph {
  get currentEntryURL() { return this.getAttribute('data-current-entry-url'); }
  set currentEntryURL(url) { this.setAttribute("data-current-entry-url", url); return url; }
  
  async initialize() {
    this.windowTitle = "Research Diary";
    
    this.prepareEditor();
    this.refreshList();
    
    this.get('#new').addEventListener("click", e => {
      this.createNewEntry();
      //lively.openInspector(knot, undefined, knot.label());
    });
    
    let urlToLoad = this.currentEntryURL;
    if (urlToLoad && urlToLoad !== "") {
      let graph = await Graph.getInstance();
      let entryKnot = await graph.requestKnot(urlToLoad);
      this.loadEntry(entryKnot);
    }
    
    // this.codeEditor.editor.navigateFileStart()
  }
  
  get codeEditor() { return this.get('#ace'); }
  
  async prepareEditor() {
    // TODO: wordwrap
    let editorComp = this.codeEditor;

    await promisedEvent(editorComp, "editor-loaded");
    
    // editorComp.editor.setOptions({
    //   maxLines:Infinity,
    //   wrap: true
    // });
    // editorComp.enableAutocompletion();
    // editorComp.aceRequire('ace/ext/searchbox')

    editorComp.editor.setOption("mode", "gfm");
    editorComp.editor.setOption("lineWrapping", true);
    editorComp.doSave = async text => {
      this.save(text);
    }
  }
  
  get researchDiaryURL() { return "https://lively4/dropbox/Research_Diary.md"; }
  get entryOfURL() { return "https://lively4/dropbox/entry_of.md"; }
  async getEntries() {
    let graph = await Graph.getInstance();
    let researchDiaryKnot = await graph.requestKnot(this.researchDiaryURL);
    let entryOfKnot = await graph.requestKnot(this.entryOfURL);

    return graph.query(_, entryOfKnot, researchDiaryKnot).map(triple => triple.subject);
  }
  async refreshList() {
    function getDateString(entry) {
      return entry.label().split(' ').reverse()[0];
    }
    let entries = await this.getEntries();
    
    const ul = this.get('#nav ul');
    ul.innerHTML = "";
    
    entries
      .sort((a, b) => {
        if(getDateString(a) < getDateString(b)) { return -1; }
        if(getDateString(a) > getDateString(b)) { return 1; }
        return 0;
      })
      .reverse()
      .forEach(entry => {
        let li = document.createElement('li');
        let a = document.createElement('a');
        let label = getDateString(entry);
        a.innerHTML = label;
        a.addEventListener('click', e => {
          this.loadEntry(entry);
        })
        li.appendChild(a);
        ul.appendChild(li);
      });
  }
  
  entryTemplate() {
    return `# ${getTodaysTitle()}

## Erkenntnisse

- 

## Done

- 

## Todo

- 
`;
  }
  async createNewEntry() {
    let content = this.entryTemplate();
    this.codeEditor.editor.setValue(content);
    this.codeEditor.editor.setCursor({line: 4, ch: 0});
    this.codeEditor.editor.execCommand("goLineEnd")
    this.codeEditor.editor.focus();
    
    let graph = await Graph.getInstance();
    let newKnot = await graph.createKnot('https://lively4/dropbox/', getTodaysTitle(), 'md');
    this.currentEntryURL = newKnot.url;

    await newKnot.save(content);
    await graph.createTriple(newKnot.url, this.entryOfURL, this.researchDiaryURL);
    
    this.refreshList();
    lively.notify(`Created new diary entry.`);
  }
  loadEntry(entryKnot) {
    this.currentEntryURL = entryKnot.url;
    this.codeEditor.editor.setValue(entryKnot.content);
    this.get("#markdown").setContent(entryKnot.content)
  }
  async save(text) {
    let graph = await Graph.getInstance();
    let entry = graph.getKnots().find(knot => knot.url === this.currentEntryURL)
    if(entry) {
      this.get("#markdown").setContent(text)
      
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
