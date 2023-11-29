import Morph from 'src/components/widgets/lively-morph.js';
import Parser from 'src/external/bibtexParse.js';
import latexconv from "src/external/latex-to-unicode-converter.js";
import Strings from 'src/client/strings.js';

export default class UBGCardEntry extends Morph {
  async initialize() {
    this.windowTitle = "UBGCardEntry";
    this.registerButtons();
    this.addEventListener('click', evt => this.clicked(evt));
    this.updateView();
  }

  get ubg() {
    return lively.allParents(this, undefined, true).find(ele => ele.tagName === 'UBG-CARDS');
  }

  clicked(evt) {
    this.ubg.selectEntry(this);
  }

  async onDragStart(evt) {
    evt.dataTransfer.setData("application/lively4id", lively.ensureID(this));

    if (evt.ctrlKey) {
      evt.dataTransfer.setData("text/plain", `[@${this.key}]`);
    } else {
      evt.dataTransfer.setData("text/plain", this.innerHTML);
    }
  }

  disableEditing() {
    var newvalue;
    try {
      newvalue = Parser.toJSON(this.editor.value);
    } catch (e) {
      lively.notify("could not parse bibtex entry: " + e);
    }
    if (newvalue && newvalue[0]) {
      this.value = newvalue[0];
      this.mode = "view";
    }
    this.updateView();
  }

  get mode() {
    return this.getAttribute("mode");
  }

  set mode(mode) {
    // mode: default, edit, readonly
    this.setAttribute("mode", mode);
  }

  enableEditing() {
    this.setAttribute("mode", "edit");
    this.updateView();
  }

  get value() {
    return this._value;
  }

  parseAuthors(bibtexAuthors) {
    return bibtexAuthors.split(/ and /).map(ea => ea.split(/, /).reverse().join(" "));
  }

  set value(cardData) {
    if (cardData) {
      this.textContent = JSON.stringify(cardData, undefined, 2);
    } else {
      this.textContent = "{}";
    }
    this._value = cardData;
    this.updateView();
  }

  get card() {
    return this.value;
  }

  toBibtex() {
    return this.textContent;
  }

  onCancel() {
    this.disableEditing();
  }

  get pane() {
    return this.get("#pane");
  }

  getAuthors() {
    return this.parseAuthors(latexconv.convertLaTeXToUnicode(this.author));
  }

  async showEditor() {
    const ed = <lively-code-mirror id="editor" mode="plain"></lively-code-mirror>;
    this.editor = await ed;
    this.editor.value = this.textContent;

    if (this.mode != "edit") return; // we have changed in the background...
    this.pane.innerHTML = "";
    this.pane.appendChild(this.editor);
  }

  updateView() {
    const card = this.value;
    if (!card) {
      lively.notify('no value for ubg entry');
      return;
    }
    
    this.classList.toggle('is-bad', !!(card.hasTag('bad') || card.hasTag('deprecated')))

    const v = card.versions.last;

    this.get('#id').innerHTML = card.id || '???';

    const type = v.type && v.type.toLowerCase();
    this.get('#type').className = {
      spell: 'fa fa-magic',
      gadget: 'fa fa-gear',
      goal: 'fa fa-map-marker',
      character: 'fa fa-user',
      trap: 'fa fa-bug'
    }[type && type.toLowerCase()] || 'fa fa-question';

    this.renderElement(v);

    this.get('#cost').innerHTML = v.cost || '/';
    this.get('#vp').innerHTML = card.getBaseVP() || '-';

    this.get('#name').innerHTML = card.versions.last.name || 'no name yet';
    this.get('#text').innerHTML = card.versions.last.text || 'no text';
    this.get('#art').innerHTML = card.getArtDirection() || '-';
  }

  updateToFilter(filter) {
    filter = filter.toLowerCase();

    const card = this.card;
    const id = card.getId();
    const name = card.getName();
    const cardType = card.getType()
    const element = card.getElement();
    const cost = card.getCost();
    const text = card.getText();
    const notes = card.getNotes();
    const aspects = [id, name, cardType, element, cost, text, notes];
    
    const matching = aspects.some(aspect => (aspect + '').toLowerCase().match(new RegExp(filter, 'gmi')));

    this.classList.toggle('match', matching);
    this.classList.toggle('hidden', !matching);

    return;

    const { type, desc } = item;
    const descLabel = NodeDescriptions.getUserFacingLabelFor(type, desc);

    const conditionSatisfied = (this.nodeCondition || (() => true))(item.desc);
    if (!conditionSatisfied) {
      item.classList.add('hidden');
      return;
    }

    const itemLabel = item.querySelector('#item-label');
    itemLabel.innerHTML = '';

    const searchTerm = this.filter.value;
    if (searchTerm === '') {
      item.classList.remove('hidden');
      itemLabel.append(<span>{descLabel}</span>);
      return;
    }

    function matches(searchStr, str) {
      return str.toLowerCase().includes(searchStr.toLowerCase());
    }

    function renderMatch(word, search) {
      let searchStrLen = search.length;
      if (searchStrLen === 0) {
        return <span>{word}</span>;
      }

      function getIndicesOf(searchStr, str, caseSensitive) {
        let searchStrLen = searchStr.length;
        if (searchStrLen == 0) {
          return [];
        }
        let startIndex = 0,
            index,
            indices = [];
        if (!caseSensitive) {
          str = str.toLowerCase();
          searchStr = searchStr.toLowerCase();
        }
        while ((index = str.indexOf(searchStr, startIndex)) > -1) {
          indices.push(index);
          startIndex = index + searchStrLen;
        }
        return indices;
      }

      let realStart = 0;
      const fragments = [];
      getIndicesOf(search, word).forEach(index => {
        fragments.push(<span style="border-right: solid red 0px">{word.substring(realStart, index)}</span>);
        fragments.push(<span style="border-right: solid red 0px; color: red">{search}</span>);
        realStart = index + search.length;
      });
      fragments.push(<span style="border-right: solid red 0px">{word.substring(realStart, word.length)}</span>);
      return <span>{...fragments}</span>;
    }

    // label;
    const match = matches(searchTerm, descLabel);
    if (match) {
      item.classList.remove('hidden');
      itemLabel.append(renderMatch(descLabel, searchTerm));
      return;
    }

    // aliases;
    const matchingAlias = (item.desc.aliases || []).find(alias => {
      return matches(searchTerm, alias);
    });
    if (matchingAlias) {
      item.classList.remove('hidden');
      itemLabel.append(<span>{descLabel} <i class="fa-regular fa-left-long"></i> {renderMatch(matchingAlias, searchTerm)}</span>);
      return;
    }

    item.classList.add('hidden');
    return;
  }

  renderElement(v) {
    const element = v.element;

    if (!element) {
      if (v.type && v.type.toLowerCase() === 'goal') {
        this.get('#element').className = 'fa fa-circle';
        this.get('#element').style.color = 'goldenrod';
        return;
      }

      this.get('#element').className = 'fa fa-question';
      this.get('#element').style.color = 'darkgray';
      return;
    }

    if (Array.isArray(element)) {
      this.get('#element').className = 'fa fa-square';
      this.get('#element').style.color = 'white';
      return;
    }

    this.get('#element').className = 'fa fa-circle';
    this.get('#element').style.color = {
      fire: 'red',
      water: 'blue',
      earth: 'yellow',
      wind: 'green'
    }[element && element.toLowerCase()];
  }

  generateFilename() {
    try {
      var authors = Strings.fixUmlauts(this.parseAuthors(latexconv.convertLaTeXToUnicode(this.author)).map(ea => _.last(ea.split(" "))).join(""));

      var words = latexconv.convertLaTeXToUnicode(this.title).replace(/-on /g, "on " // e.g. hands-on 
      ).split(/[ _-]/g).map(ea => ea.replace(/[:,\-_'"\`\$\%{}()\[\]\\\/.]/g, "")).map(ea => ea.toLowerCase()).filter(ea => ea != "a").map(ea => Strings.toUpperCaseFirst(ea));
      var title = words.join("");
      return authors + `_${this.year}_${title}`;
    } catch (e) {
      return "";
    }
  }

  // #TODO refactor those accessors
  get key() {
    return this.value.citationKey;
  }

  set key(string) {
    this.value.citationKey = string;
  }

  get author() {
    return this.value.entryTags && (this.value.entryTags.Author || this.value.entryTags.author);
  }

  set author(string) {
    if (this.value.entryTags.Author) {
      this.value.entryTags.Author = string;
    } else {
      this.value.entryTags.author = string;
    }
  }

  get year() {
    return this.value.entryTags.Year || this.value.entryTags.year;
  }

  set year(string) {
    if (this.value.entryTags.Year) {
      this.value.entryTags.Year = string;
    } else {
      this.value.entryTags.year = string;
    }
  }

  get title() {
    return this.value.entryTags.Title || this.value.entryTags.title;
  }

  set title(string) {
    if (this.value.entryTags.Title) {
      this.value.entryTags.Title = string;
    } else {
      this.value.entryTags.title = string;
    }
  }

  setFromBibtex(string) {
    this.value = Parser.toJSON(string)[0];
  }

  livelyMigrate(other) {
    this.value = other.value;
    this.updateView();
  }
}