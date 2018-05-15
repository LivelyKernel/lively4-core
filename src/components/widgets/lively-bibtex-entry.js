import Morph from 'src/components/widgets/lively-morph.js';
import Parser from 'src/external/bibtexParse.js';
import latexconv from "src/external/latex-to-unicode-converter.js"

export default class LivelyBibtexEntry extends Morph {
  async initialize() {
    this.windowTitle = "LivelyBibtexEntry";
  }
  
  get value() {
    return this._value
  }
  
  set value(obj) {
    this._value = obj
    this.updateView()
  }
  

  livelyMigrate(other) {
    this.value = other.value
  }
  updateView() {
    if (!this.value) return;
    this.get("#key").textContent = this.key
    this.get("#author").textContent = latexconv.convertLaTeXToUnicode(this.author)
    this.get("#year").textContent = this.year
    this.get("#title").textContent = latexconv.convertLaTeXToUnicode(this.title)
  }
  
    
  
  // #TODO refactor those accessors
  get key() {
    return this.value.citationKey
  }

  set key(string) {
    this.value.citationKey = string
  }
  
  get author() {
    return this.value.entryTags.Author || this.value.entryTags.author 
  }

  set author(string) {
    if (this.value.entryTags.Author) {
      this.value.entryTags.Author = string
    } else {
      this.value.entryTags.author = string
    }
  }

  get year() {
    return this.value.entryTags.Year || this.value.entryTags.year 
  }
  
  set year(string) {
    if (this.value.entryTags.Year) {
      this.value.entryTags.Year = string
    } else {
      this.value.entryTags.year = string
    }
  }

  get title() {
    return this.value.entryTags.Title || this.value.entryTags.title 
  }
  
  set title(string) {
    if (this.value.entryTags.Title) {
      this.value.entryTags.Title = string
    } else {
      this.value.entryTags.title = string
    }
  }
  
  setFromBibtex(string) {
    this.value = Parser.toJSON(string)[0]
    this.updateView()
  }
  
  
  livelyInspect(contentNode, inspector) {
     if (this.value) {
      contentNode.appendChild(inspector.display(this.value, false, "#value", this));
    }
  }

  
  async livelyExample() {
    this.setFromBibtex(`@Article{Ingalls1997BFS,
  author        = {Ingalls, Dan and Kaehler, Ted and Maloney, John and Wallace, Scott and Kay, Alan},
  title         = {{Back to the Future: The Story of Squeak, a Practical Smalltalk Written in Itself}},
  journal       = {ACM SIGPLAN Notices},
  year          = {1997},
  volume        = {32},
  number        = {10},
  pages         = {318--326},
  date-added    = {2014-09-22 19:20:23 +0000},
  date-modified = {2014-09-22 19:20:23 +0000},
  doi           = {http://doi.acm.org/10.1145/263700.263754},
  file          = {IngallsKaehlerMaloneyWallace_1997_BackToTheFutureTheStoryOfSqueakAPracticalSmalltalkWrittenInItself.pdf:IngallsKaehlerMaloneyWallace_1997_BackToTheFutureTheStoryOfSqueakAPracticalSmalltalkWrittenInItself.pdf:PDF},
  keywords      = {VirtualMachines, ProgrammingEnvironment, ProgrammingLanguage, Smalltalk},
  owner         = {Jens},
  publisher     = {ACM Press New York, NY, USA},
  rating        = {5},
  read          = {Yes},
  timestamp     = {2017.08.09},
}`)
  }
}