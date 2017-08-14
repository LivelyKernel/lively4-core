import Morph from './Morph.js';
import Parser from 'https://raw.githubusercontent.com/ORCID/bibtexParseJs/master/bibtexParse.js';
import Strings from "src/client/strings.js";

export default class BibtexCleaner extends Morph {
  get fileURL() { return "https://lively4//phdthesis/references.bib"; }
  get input() { return this.get('#input'); }
  get mismatches() { return this.get('#mismatches'); }
  async initialize() {
    this.windowTitle = "BibtexCleaner";
    lively.html.registerButtons(this);
    this.input.enableAutocompletion();
    this.input.aceRequire('ace/ext/searchbox');
    this.input.doSave = async text => {
      await lively.files.saveFile(this.fileURL, text);
      this.refresh();
    }
     
    await this.refresh();
  }
  
  async refresh() {
    this.mismatches.innerHTML = "";
    
    const bibtexInput = await fetch(this.fileURL).then(res=>res.text());
    this.input.editor.setValue(bibtexInput);

    let json= Parser.toJSON(bibtexInput);

    //document.body.querySelector("#target-bibtex").value = Parser.toBibtex(json); 

    //lively.openInspector(json);
    
    function generateKey(entry) {
      const author = entry.entryTags.author || "YYY YYY and YYY YYY";
      const year = entry.entryTags.year || 'XXXX'
      const title = entry.entryTags.title || "Z Z Z";
      
      let first = author
        .split(' and ')[0]
        .replace(/[\$\\{}()"'^â`ÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂ´\/-]/g, "");
      let firstAuthorLastname;
      if(first.match(',')) {
        firstAuthorLastname= first.split(', ')[0]
      } else {
        firstAuthorLastname= _.last(first.split(' '))
      }
      firstAuthorLastname = firstAuthorLastname.replace(/ /g, '')
      
      let cleanTitle = title
        .replace(/[$\\\/ââ(){}Ã¢ÂÂ]/g, "")
        .replace(/co-/g, "co");
      let titleAcronym = cleanTitle.split(/[ -]+/)
        .filter(entry => !["the", "a", "to", "for", "an", "by", "on", "of", "with", "from", "as", "in", "and", "und", "how", "should", "at", "do", "after", "are"].includes(entry.toLowerCase()))
        .filter(entry => !entry.match(/^[0-9]+/))
        .slice(0,3).map(entry=>entry[0].toUpperCase()).join('');
      return firstAuthorLastname + year + titleAcronym;
    }
    
    const mismatches = json
      .filter(entry => entry.entryType !== "COMMENT")
      .map(entry => ({
          entry,
          generatedKey: generateKey(entry)
      }))
      .filter(({entry, generatedKey}) => entry.citationKey !== generatedKey)
    
    this.get("#number-of-mismatches").innerHTML = mismatches.length;
    mismatches.forEach(({entry, generatedKey}) => {
        const occurencesOfCitationKey = bibtexInput.split(entry.citationKey).length - 1;
        
        let item = document.createElement('div');
        item.innerHTML = `<label><input
          class="mismatch"
          type="checkbox"
          name="checkbox"
          data-citation-key-occurences=${occurencesOfCitationKey}
          data-citation-key="${entry.citationKey}"
          data-generated-key="${generatedKey}"
          value="value">${occurencesOfCitationKey} ${entry.citationKey} !== ${generatedKey} in ${entry.entryTags.title}</label>`;

        this.mismatches.appendChild(item);
      });
  }
  
  async onRefine() {
    let sourceText = await fetch(this.fileURL).then(res=>res.text());

    const mismatches = this.getAllSubmorphs('input.mismatch:checked');
    lively.notify(mismatches.length);
    
    const ambiguousInput =  mismatches.find(input => +input.dataset.citationKeyOccurences !== 1);
    if(ambiguousInput) {
      lively.notify("Aborting operation due to ambiguity:", `Found multiple occurences of citation key '${ambiguousInput.dataset.citationKey}'`);
      return;
    }
    
    const overridingInput =  mismatches.find(input => sourceText.includes(input.dataset.generatedKey));
    if(overridingInput) {
      lively.notify("Aborting operation due to overriding:", `Found occurences of generated key '${overridingInput.dataset.generatedKey}'`);
      return;
    }
    
    mismatches.forEach(input => sourceText = sourceText.replace(input.dataset.citationKey, input.dataset.generatedKey));
    
    await lively.files.saveFile(this.fileURL, sourceText);
    lively.notify(`replaced ${mismatches.length} citation key(s)`);

    this.refresh();
  }
}