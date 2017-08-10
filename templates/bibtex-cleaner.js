import Morph from './Morph.js';
import Parser from 'https://raw.githubusercontent.com/ORCID/bibtexParseJs/master/bibtexParse.js';
import Strings from "src/client/strings.js";

export default class BibtexCleaner extends Morph {
  get input() { return this.get('#input'); }
  get mismatches() { return this.get('#mismatches'); }
  async initialize() {
    this.windowTitle = "BibtexCleaner";
    lively.html.registerButtons(this);
    
    await this.refresh();
  }
  
  async refresh() {
    this.mismatches.innerHTML = "";
    
    const bibtexInput = await fetch("https://lively4//phdthesis/references.bib").then(res=>res.text());
    this.input.editor.setValue(bibtexInput);

    let json= Parser.toJSON(bibtexInput);

    //document.body.querySelector("#target-bibtex").value = Parser.toBibtex(json); 

    //lively.openInspector(json);
    
    function generateKey(entry) {
      const author = entry.entryTags.author || "XXX XXX and XXX XXX";
      const year = entry.entryTags.year || 'YYYY'
      const title = entry.entryTags.title || "Z Z Z";
      
      let first = author
        .split(' and ')[0]
        .replace(/[{\\}"'^`ÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂ´\/-]/g, "");
      let firstAuthorLastname;
      if(first.match(',')) {
        firstAuthorLastname= first.split(', ')[0]
      } else {
        firstAuthorLastname= _.last(first.split(' '))
      }
      
      let cleanTitle = title
        .replace(/[{}]/g, "")
        .replace(/co-/g, "co");
      let titleAcronym = cleanTitle.split(/[ -]+/)
        .filter(entry => !["the", "a", "to", "for", "an", "by", "on", "of", "with", "from", "as", "in", "and"].includes(entry.toLowerCase()))
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
  
  onRefine() {
    const mismatches = this.getAllSubmorphs('input.mismatch:checked');
    lively.notify(mismatches.length);
    
  }
}