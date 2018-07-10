import Morph from 'src/components/widgets/lively-morph.js';
import Parser from 'src/external/bibtexParse.js';
import latexconv from "src/external/latex-to-unicode-converter.js"
import Strings from 'src/client/strings.js'

export default class LivelyBibtexEntry extends Morph {
  async initialize() {
    this.windowTitle = "LivelyBibtexEntry";
    this.value = Parser.toJSON(this.textContent)[0];
    this.addEventListener("dblclick", evt => this.onDblClick(evt))
    
    this.get("#entry").addEventListener("dragstart", evt => this.onDragStart(evt))
    this.get("#entry").draggable = true;
    
  }

  async onDragStart(evt) {
    
    if (evt.ctrlKey) {
      evt.dataTransfer.setData("text/plain", this.innerHTML)
    } else {
      evt.dataTransfer.setData("text/plain", "[@" + this.key + "]")
    }

  }
  
  onDblClick(evt) {
    if (this.getAttribute("mode") == "edit") {
      var newvalue 
      try {
        newvalue = Parser.toJSON(this.textContent)
      } catch(e) {
        lively.notify("could not parse bibtex entry: " + e)
      }
      if (newvalue && newvalue[0]) {
        this.value = newvalue[0]
        this.setAttribute("mode", "view")
        this.removeAttribute("contenteditable")
      } 
    } else {
      this.setAttribute("mode", "edit")
      this.setAttribute("contenteditable", "true")      
    }
  }
  
  get value() {
    return this._value
  }
  
  parseAuthors(bibtexAuthors) {
    return bibtexAuthors.split(/ and /).map(ea => ea.split(/, /).reverse().join(" "))
  }
  
  set value(obj) {
    if (obj) {
      this.textContent = Parser.toBibtex([obj], false)
    } else {
      this.textContent = ""
    }
    this._value = obj
    this.updateView()
  }
  

  livelyMigrate(other) {
    this.value = other.value
  }
  updateView() {
    if (!this.value || !this.value.entryTags ) return;
    this.get("#key").textContent = this.key
    try {
      this.get("#author").textContent = this.parseAuthors(latexconv.convertLaTeXToUnicode(this.author)).join(", ")
    } catch(e) {
      this.get("#author").textContent = this.author
    }
    this.get("#year").textContent = this.year
    try {
      this.get("#title").textContent = latexconv.convertLaTeXToUnicode(this.title)
    } catch(e) {
      this.get("#title").textContent = this.title
                                                                       
    }
    
    
    this.get("#filename").textContent = "// " + this.generateFilename() +""
  }
  
  generateFilename() {
    try {
      return this.parseAuthors(latexconv.convertLaTeXToUnicode(this.author)).map(ea => _.last(ea.split(" "))).join("") +`_${this.year}_${Strings.toUpperCaseFirst(Strings.toCamelCase(latexconv.convertLaTeXToUnicode(this.title).replace(/(^| )[aA] /,"")).replace(/[:,\-_'"\`\$\%{}()\[\]\\\/.]/g,""))}` 
    } catch(e) {
      return ""
    }
  }
  
  
  // #TODO refactor those accessors
  get key() {
    return this.value.citationKey
  }

  set key(string) {
    this.value.citationKey = string
  }
  
  get author() {
    return this.value.entryTags && 
      (this.value.entryTags.Author || this.value.entryTags.author) 
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