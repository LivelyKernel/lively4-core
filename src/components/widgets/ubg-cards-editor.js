import Parser from 'src/external/bibtexParse.js';
import Morph from 'src/components/widgets/lively-morph.js';
import ContextMenu from 'src/client/contextmenu.js';
import Strings from 'src/client/strings.js';
import Bibliography from 'src/client/bibliography.js';

export default class UBGCardsEditor extends Morph {
  async initialize() {

    this.setAttribute("tabindex", 0);
    this.windowTitle = "UBGCardsEditor";
    this.registerButtons();
    lively.html.registerKeys(this);
    this.prepareOnChangeCallbacks();
  }

  prepareOnChangeCallbacks() {
    // 'focus', 'blur', 'keyup', 'keypress', 'change', 
    for (let eventName of ['input']) {
      this.$id.addEventListener(eventName, evt => this.modify$id(evt, eventName), false);
      this.$name.addEventListener(eventName, evt => this.modify$name(evt), false);
      this.$type.addEventListener(eventName, evt => this.modify$type(evt), false);
      this.$element.addEventListener(eventName, evt => this.modify$element(evt), false);
      this.$cost.addEventListener(eventName, evt => this.modify$cost(evt), false);
      this.$vp.addEventListener(eventName, evt => this.modify$vp(evt), false);
      this.$text.addEventListener(eventName, evt => this.modify$text(evt), false);
      this.$notes.addEventListener(eventName, evt => this.modify$notes(evt), false);
      this.$art.addEventListener(eventName, evt => this.modify$art(evt), false);
      this.$isPrinted.addEventListener(eventName, evt => this.modify$isPrinted(evt), false);
    }
    this.$text.addEventListener('keydown', evt => this.keydown$text(evt), false);
    this.$tagsInput.addEventListener('keydown', evt => this.keydown$tagInput(evt), false);
    this.get('#rating').addEventListener('change', evt => {
      if (evt.target.name === 'rating') {
        this.modify$rating(evt)
      }
    });
  }
  
  initSlider() {
    
  }

  get ubg() {
    return lively.allParents(this, undefined, true).find(ele => ele.tagName === 'UBG-CARDS');
  }

  async onDragStart(evt) {
    if (!this.table) return;
    if (this.detailsTable && lively.isActiveElement(this.detailsTable)) return;
    if (this.isMerging()) return;

    let source;
    let rows = this.selectedOrCurrentRows();
    if (rows.length == 0) {
      // nothing to drag
      evt.preventDefault();
      evt.stopPropagation();
      return;
    }

    let flatEntries = rows.map(row => this.table.rowToJSO(row));

    let entries = this.flatEntriesToBibtexEntries(flatEntries);
    source = Parser.toBibtex(entries, false);
    evt.dataTransfer.setData("text/plain", source);
    evt.dataTransfer.setDragImage(rows[0], 0, 0);
  }

  onDrop(evt) {
    if (this.isMerging()) return;
    evt.preventDefault();
    evt.stopPropagation();

    var source = evt.dataTransfer.getData("text");
    this.insertData(source);
  }

  onDragOver(evt) {
    if (this.isMerging()) return;
    // here we could show a preview of what would happen 
    evt.dataTransfer.dropEffect = "copy";
  }

  isEditingCells() {
    return this.table && this.table.isEditingCells();
  }

  onClick(evt) {
    var path = evt.composedPath
    // we already have a focus here?
    ();if (!this.isEditingCells()) {
      if (this.detailsTable && path.includes(this.detailsTable)) {
        // nothing...
      } else {

        lively.focusWithoutScroll(this.get("#copyHack"));
      }
    }
  }

  onKeyDown(evt) {
    return 
    if (evt.ctrlKey && evt.key == "s") {
      evt.stopPropagation();
      evt.preventDefault();
      this.onSave();
    }
  }

  selectedEntries() {
    return Array.from(this.querySelectorAll("lively-bibtex-entry.selected"));
  }

  onContextMenu(evt) {
    if (!evt.shiftKey) {
      evt.stopPropagation();
      evt.preventDefault();
      return;
    }
  }

  isEditing() {
    return this.currentEntry && this.currentEntry.getAttribute("mode") == "edit";
  }

  get src() {
    return this.card;
  }

  set src(card) {
    this.card = card;
    this.updateView();
  }

  get merge() {
    return this.getAttribute("merge");
  }

  set merge(url) {
    this.setAttribute("merge", url);
  }

  findEntryInPath(path) {
    return path.find(ea => ea.tagName == "lively-bibtex-entry".toUpperCase());
  }

  fixKeyCases(json) {
    return json.map(ea => {
      var result = { citationKey: ea.citationKey, entryType: ea.entryType, entryTags: {} };
      if (ea.entryTags) {
        for (var key in ea.entryTags) {
          result.entryTags[key.toLowerCase()] = ea.entryTags[key];
        }
      }
      return result;
    });
  }

  bibtexToFlatEntries(source) {
    var json = Parser.toJSON(source);
    var entries = this.fixKeyCases(json);
    var flatEntries = entries.map(ea => {
      var row = { citationKey: ea.citationKey, entryType: ea.entryType };
      for (var key in ea.entryTags) {
        if (key && ea.entryTags[key]) {
          row[key] = ea.entryTags[key];
        }
      }
      return row;
    });
    return flatEntries;
  }

  flatEntryToBibtexEntry(ea) {
    var row = {
      citationKey: ea.citationKey,
      entryType: ea.entryType,
      entryTags: []
    };
    for (var key of Object.keys(ea).sort()) {
      if (key !== "citationKey" && key !== "entryType" && key !== "entryTags" && key && ea[key]) {
        row.entryTags[key] = ea[key];
      }
    }
    return row;
  }

  flatEntriesToBibtexEntries(flatEntries) {
    return flatEntries.map(ea => {
      return this.flatEntryToBibtexEntry(ea);
    });
  }

  flatEntriesToBibtex(flatEntries) {
    var entries = this.flatEntriesToBibtexEntries(flatEntries);
    return Parser.toBibtex(entries, false);
  }

  async loadEntries(url) {
    var source = await lively.files.loadFile(url);
    try {
      var flatEntries = this.bibtexToFlatEntries(source);
    } catch (e) {
      lively.error("Could not load " + url);
      return;
    }
    return flatEntries;
  }

  get $id() {
    return this.get('#id');
  }
  get $name() {
    return this.get('#name');
  }
  get $type() {
    return this.get('#type');
  }
  get $element() {
    return this.get('#element');
  }
  get $cost() {
    return this.get('#cost');
  }
  get $vp() {
    return this.get('#vp');
  }
  get $text() {
    return this.get('#text');
  }
  get $tagsInput() {
    return this.get('#tags-input');
  }
  get $tagsList() {
    return this.get('#tags-list');
  }
  get $rating() {
    return this.get('#rating');
  }
  get $notes() {
    return this.get('#notes');
  }
  get $art() {
    return this.get('#art');
  }
  get $isPrinted() {
    return this.get('#isPrinted');
  }

  modify$id(evt) {
    const id = this.$id.value;
    const intId = parseInt(id);

    if (_.isNaN(intId)) {
      this.card.setId();
    } else {
      this.card.setId(intId);
    }

    this.propagateChange()
  }
  display$id() {
    const id = this.card.getId();

    if (id === undefined) {
      this.$id.value = '';
      return;
    }

    this.$id.value = id;
  }

  modify$name(evt) {
    const name = this.$name.value;
    if (name === '') {
      this.card.setName();
    } else {
      this.card.setName(name);
    }

    this.propagateChange()
  }
  display$name() {
    const name = this.card.getName();
    this.$name.value = name === undefined ? '' : name;
  }

  modify$type(evt) {
    const type = this.$type.value;
    if (type === '') {
      this.card.setType();
    } else {
      this.card.setType(type);
    }

    this.propagateChange()
  }
  display$type() {
    const type = this.card.getType();
    this.$type.value = type === undefined ? '' : type;
  }

  modify$element(evt) {
    const element = this.$element.value;
    if (element === '') {
      this.card.setElement();
    } else if (element.includes(',')) {
      this.card.setElement(element.split(','));
    } else {
      this.card.setElement(element);
    }

    this.propagateChange()
  }
  display$element() {
    const element = this.card.getElement();

    if (element === undefined) {
      this.$element.value = '';
      return;
    }

    if (Array.isArray(element)) {
      this.$element.value = element.join(',');
      return;
    }

    this.$element.value = element;
  }

  modify$cost(evt) {
    const cost = this.$cost.value;

    if (cost === '') {
      this.card.setCost();
    } else if (cost.includes(',')) {
      const costs = cost.split(',');
      const parsedCosts = costs.map(c => parseInt(c)).filter(cost => !_.isNaN(cost));
      if (parsedCosts.length >= 1) {
        this.card.setCost(parsedCosts);
      } else {
        this.card.setCost();
      }
    } else {
      const intCost = parseInt(cost);
      if (_.isNaN(intCost)) {
        this.card.setCost();
      } else {
        this.card.setCost(intCost);
      }
    }

    this.propagateChange()
  }
  display$cost() {
    const cost = this.card.getCost();

    if (cost === undefined) {
      this.$cost.value = '';
      return;
    }

    if (Array.isArray(cost)) {
      this.$cost.value = cost.join(',');
      return;
    }

    this.$cost.value = cost;
  }

  modify$vp(evt) {
    const vp = this.$vp.value;
    
    if (vp === '') {
      this.card.setBaseVP();
    } else if ('*+-'.split('').some(char => vp.endsWith(char))) {
      this.card.setBaseVP(vp);
    } else {
      const intCost = parseInt(vp);
      if (_.isNaN(intCost)) {
        this.card.setBaseVP();
      } else {
        this.card.setBaseVP(intCost);
      }
    }

    this.propagateChange()
  }
  display$vp() {
    const vp = this.card.getBaseVP();

    if (vp === undefined) {
      this.$vp.value = '';
      return;
    }

    this.$vp.value = vp;
  }


  keydown$text(evt) {
    if (evt.key === 'Delete'  && evt.ctrlKey) {
      evt.stopPropagation()
      return
    }    
  }
  modify$text(evt) {
    const text = this.$text.value;
    if (text === '') {
      this.card.setText();
    } else {
      this.card.setText(text);
    }

    this.propagateChange()
  }
  display$text() {
    const text = this.card.getText();
    this.$text.value = text === undefined ? '' : text;
  }
  
  keydown$tagInput(evt) {
    const input = this.$tagsInput;
    if (evt.key === 'Escape') {
      input.value = ''
      return
    }
    if (evt.key === 'Enter') {
      const value = input.get('input').value;
      if (value) {
        this.card.addTag(value);
        input.value = ''
        this.propagateChange()
      } else {
        lively.warn('no tag to add.')
      }
      return
    }
  }
  display$tags() {
    const tags = _.sortBy(this.card.getTags());
    const editor = this;
    let previouslyFocussed = this.$tagsList.childNodes.find(n => n.matches(':focus'))
    previouslyFocussed = previouslyFocussed && previouslyFocussed.textContent
    
    function getElementIndex(element) {
      // Get all children of the parent element
      var children = Array.from(element.parentNode.children);

      // Find the index of 'element' among its siblings
      var index = children.indexOf(element);

      return index;
    }
    
    function onkeydown (evt) {
      function getDeepActiveElement() {
        let active = document.activeElement;
        while (active && active.shadowRoot && active.shadowRoot.activeElement) {
          active = active.shadowRoot.activeElement;
        }
        return active;
      }
      
      if (evt.key === 'Delete' || evt.key === 'Backspace') {
        evt.stopPropagation()
        evt.preventDefault()
        if (evt.repeat) {
          return;
        }
        
        if (getDeepActiveElement() === this) {
          lively.notify(123)
          const sibling = this.nextElementSibling || this.previousElementSibling
          if (sibling) {
            sibling.focus()
          } else {
            editor.$tagsInput.focus()
          }
        }
        
        editor.card.removeTag(this.textContent)
        editor.propagateChange()
        return
      }
    }

    this.$tagsList.innerHTML = ''
    this.$tagsList.append(...tags.map(tag => {
      return <span class='tag' tabindex ='0' keydown={onkeydown}>{tag}</span>
    }));
    
    if (previouslyFocussed) {
      const tagElements = this.$tagsList.childNodes;
      if (tagElements.length === 0) {
        this.$tagsInput.focus()
      } else {
        // get best match from childnodes
        for (let tagElement of tagElements) {
          if (tagElement.textContent >= previouslyFocussed) {
            tagElement.focus()
            return
          }
          tagElements[tagElements.length - 1].focus()
        }
      }
    }
  }

  modify$rating(evt) {
    const rating = evt.target.value;
    if (rating === '') {
      this.card.setRating();
    } else {
      this.card.setRating(rating);
    }

    this.propagateChange()
  }
  display$rating() {
    const rating = this.card.getRating() || 'unset';

    const selectedOption = this.$rating.querySelector(`[value='${rating}']`)
    if (selectedOption) {
      selectedOption.checked = true;
    } else {
      lively.warn('Unknown rating ' + rating)
    }
  }

  modify$notes(evt) {
    const notes = this.$notes.value;
    if (notes === '') {
      this.card.setNotes();
    } else {
      this.card.setNotes(notes);
    }

    this.propagateChange()
  }
  display$notes() {
    const notes = this.card.getNotes();
    this.$notes.value = notes === undefined ? '' : notes;
  }
  
  modify$art(evt) {
    const art = this.$art.value;
    if (art === '') {
      this.card.setArtDirection();
    } else {
      this.card.setArtDirection(art);
    }

    this.propagateChange()
  }
  display$art() {
    const art = this.card.getArtDirection();
    this.$art.value = art === undefined ? '' : art;
  }

  modify$isPrinted(evt) {
    const isPrinted = this.$isPrinted.checked;
    if (isPrinted) {
      this.card.setIsPrinted(true);
    } else {
      this.card.setIsPrinted();
    }

    this.ubgMarkMyCardAsChanged()
  }
  display$isPrinted() {
    // lively.notify('update printed')
    const isPrinted = this.card.getIsPrinted();
    this.$isPrinted.checked = isPrinted === undefined ? false : isPrinted;
  }
  
  propagateChange() {
    this.ubgMarkMyCardAsChanged();
    this.display$isPrinted();
    this.display$tags();
    this.delayedUpdateCardPreview();
  }
  
  ubgMarkMyCardAsChanged() {
    this.ubg.markCardAsChanged(this.card);
  }

  updateTagSelection() {
    const tags = this.ubg.getAllTags()
    this.$tagsInput.setOptions(tags)
  }
  
  async updateView() {
    this.updateTagSelection();
    
    this.display$id();
    this.display$name();
    this.display$type();
    this.display$element();
    this.display$cost();
    this.display$vp();
    this.display$text();
    this.display$tags();
    this.display$rating();
    this.display$notes();
    this.display$art();
    this.display$isPrinted();

    await this.updateCardPreview();
  }

  async delayedUpdateCardPreview() {
    this.setAttribute('preview-queued', true);
    this._delayedUpdateCardPreview = this._delayedUpdateCardPreview || _.debounce(() => this.updateCardPreview(), 500);

    this._delayedUpdateCardPreview();
  }

  async updateCardPreview() {
    this.removeAttribute('preview-queued');
    delete this._delayedUpdateCardPreview;

    const card = this.card;
    const ubg = this.ubg;
    const pdf = await ubg.buildSingleCard(card);
    this.get('#preview').replaceWith(<div id='preview'><div id='previewViewer'></div></div>)
    await ubg.showPDFData(pdf.output('dataurlstring'), this.get('#preview'), this.get('#previewViewer'), 'ubg-cards-editor');
  }

  selectedEntry() {
    return this.table.asJSO()[this.table.currentRowIndex - 1];
  }

  applyDetails() {
    var entry = this.getDetailsEntry();
    if (!entry) return;
    var all = this.table.asJSO();
    all[this.table.currentRowIndex - 1] = entry;
    this.table.setFromJSO(all, true);
    if (this.isMerging()) {
      this.colorMergeTable();
      this.colorDetailsTable();
    }
  }

  toBibtex() {
    var flatEntries = this.table.asJSO();
    var bibtex = this.flatEntriesToBibtex(flatEntries);
    return bibtex;
  }

  detailsToJSON() {
    var entry = this.getDetailsEntry();
    return entry && JSON.stringify(entry);
  }

  isEditingDetails() {
    return lively.allParents(lively.activeElement()).includes(this.detailsTable);
  }

  selectedOrCurrentCells() {
    var cells = [];
    if (this.table.selectedCells) {
      cells.push(...this.table.selectedCells);
    } else if (this.currentCell) {
      cells.push(this.currentCells);
    }
    return cells;
  }

  selectedOrCurrentRows() {
    var rows = this.selectedOrCurrentCells().map(ea => this.table.rowOfCell(ea)).uniq().map(ea => this.table.rows()[ea]);
    return rows;
  }

  async onSave() {
    if (this.isMerging()) return lively.notify("Merge in process");
    if (this.isEditingDetails()) {
      this.applyDetails();
    } else {
      this.setDetailsEntry(this.selectedEntry());
    }
    if (!this.table) return;

    try {
      var bibtex = this.toBibtex();
      Parser.toJSON(bibtex // just try to parse it again  
      );
    } catch (e) {
      lively.error("BibtexEditor", "Could not save because of rror: " + e);
      return;
    }
    if (!this.src) throw new Error("BibtexEditor src missing");
    await lively.files.saveFile(this.src, bibtex);
    lively.success("saved bibtex", this.src, 5, () => lively.openBrowser(this.src));

    this.get('#content-change-indicator').reset();
    this.get('#details-change-indicator').reset();
  }

  onSaveButton() {
    this.onSave();
  }

  sortByField(fieldName) {
    if (!this.table) return;
    var flatEntries = this.table.asJSO();
    flatEntries = flatEntries.sortBy(ea => ea[fieldName]);
    this.table.setFromJSO(flatEntries, true);
    this.setDetailsEntry(null);
  }

  onSortByKeyButton() {
    this.sortByField("citationKey");
  }

  onSortByYearButton() {
    this.sortByField("year");
  }

  async onCancelButton() {
    /*MD  #Refactor #Duplication with <edit://src/components/widgets/lively-bibtex.js#onEditButton> MD*/
    if (this.style.position) {
      var pos = lively.getPosition(this);
      var extent = lively.getExtent(this);
    }
    var bibtex = 123; // await (<lively-bibtex></lively-bibtex>)
    if (this.src) {
      bibtex.setAttribute("src", this.src);
    } else {
      bibtex.textContent = this.textContent;
    }
    this.parentElement.insertBefore(bibtex, this);
    bibtex.updateView();
    this.remove();
    if (pos) {
      lively.setPosition(bibtex, pos);
      lively.setExtent(bibtex, extent);
    }
  }

  async onTableCellSelected(evt) {
    this.setDetailsEntry(this.selectedEntry());
    if (this.isMerging()) this.colorMergeTable();
  }

  async setDetailsEntry(entry) {
    this.get("#details").innerHTML = "";
    if (entry) {
      var detailsTable = 123; // await (<lively-table></lively-table>)
      this.detailsTable = detailsTable;
      this.get('#details').appendChild(detailsTable);
      var a = [];
      if (this.isMerging()) {
        a.push(["", "A", "M", "B"]);
        let original = this.originalEntries.find(ea => ea.citationKey == entry.citationKey) || {};
        let other = this.otherEntries.find(ea => ea.citationKey == entry.citationKey) || {};
        let allKeys = Object.keys(original).concat(Object.keys(other)).uniq();
        for (let key of allKeys) {
          if (key == 0) {} else {
            a.push([key, original[key], entry[key], other[key]]);
          }
        }
      } else {
        for (var key in entry) {
          if (key && entry[key]) {
            a.push([key, entry[key]]);
          }
        }
      }

      this.detailsTable.addEventListener("finish-editing-cell", evt => this.onFinishDetailsEditingCell(evt));

      detailsTable.setFromArray(a);
    }
    this.get('#details-change-indicator').reset();

    if (this.isMerging()) {
      this.colorDetailsTable();
    }
  }

  getDetailsEntry() {
    if (!this.detailsTable) return;
    var a = this.detailsTable.asArray();
    var entry = {};
    var column = this.isMerging() ? 2 : 1;
    for (var ea of a) {
      if (ea[0]) {
        entry[ea[0]] = ea[column];
      }
    }
    return entry;
  }

  onFinishEditingCell() {
    lively.notify("update details");
    this.setDetailsEntry(this.selectedEntry());
  }

  onFinishDetailsEditingCell() {
    lively.notify("update table");
    this.applyDetails();
  }

  async onMergeButton() {
    var otherURL = this.getAttribute("merge");
    if (!otherURL) {
      otherURL = await lively.prompt("merge other url", "");
      if (!otherURL) {
        return lively.notify("cannot merge without url");
      } else {
        this.merge = otherURL;
      }
    }
    this.mergeOtherURL(otherURL);
  }

  onBrowseButton() {
    if (!this.detailsTable) return;
    var flatEntry = this.getDetailsEntry();
    if (!flatEntry) return;
    lively.openBrowser("bib://" + flatEntry.citationKey);
  }

  /*MD ## Copy and Paste MD*/
  onCopy(evt) {
    if (this.isEditingCells()) return;
    if (this.detailsTable && lively.isActiveElement(this.detailsTable)) return;

    let source;
    let rows = this.selectedOrCurrentRows();
    let flatEntries = rows.map(row => this.table.rowToJSO(row));
    let entries = this.flatEntriesToBibtexEntries(flatEntries);
    source = Parser.toBibtex(entries, false);

    evt.clipboardData.setData('application/bibtex', source);
    evt.clipboardData.setData('text/plain', source);
    evt.stopPropagation();
    evt.preventDefault();
  }

  onCut(evt) {
    if (this.isEditingCells()) return;
    if (this.detailsTable && lively.isActiveElement(this.detailsTable)) return;

    lively.notify("on Cut");
    this.onCopy(evt);
    var rows = this.selectedOrCurrentRows();
    for (var row of rows) {
      row.remove();
    }
  }

  insertData(data) {
    function insert(arr, index, newitems) {
      return [...arr.slice(0, index), ...newitems, ...arr.slice(index)];
    }

    var all = this.table.asJSO();
    let rowInsert;

    if (this.table.currentRowIndex) {
      rowInsert = this.table.currentRowIndex;
    } else {
      rowInsert = all.length;
    }

    try {
      var entries = this.bibtexToFlatEntries(data);
    } catch (e) {
      lively.warn("could not inssert data", data);
      return;
    }

    var newentries = insert(all, rowInsert, entries);
    this.table.setFromJSO(newentries);

    lively.notify("new entries", "", 10, () => lively.openInspector(newentries));
  }

  onPaste(evt) {
    if (this.isEditingCells()) return;
    if (this.detailsTable && lively.isActiveElement(this.detailsTable)) return;

    evt.stopPropagation();
    evt.preventDefault();

    this.insertData(evt.clipboardData.getData('text/plain'));
  }

  /*MD ## Merge MD*/

  isMerging() {
    return this.originalEntries && true;
  }

  async mergeOtherURL(otherURL) {
    if (this.isMerging()) throw new Error("Merge in process");
    if (!otherURL) throw new Error("missing other URL");

    var entries = await this.loadEntries(otherURL);
    return this.mergeOtherEntries(entries);
  }

  async mergeOtherEntries(entries) {
    this.originalEntries = this.table.asJSO();
    this.otherEntries = entries;

    var merged = [];
    this.mergedEntries = merged;
    for (let ea of this.originalEntries) {
      let entry = Object.assign({ "0": "A" }, ea);
      merged.push(entry);
    }
    for (let ea of this.otherEntries) {
      let entry = merged.find(originalEntry => originalEntry.citationKey == ea.citationKey);
      if (entry) {
        entry[0] = "M";
        for (let key in ea) {
          if (ea[key] && !entry[key]) {
            entry[key] = ea[key];
          }
        }
      } else {
        entry = Object.assign({ "0": "B" }, ea);
        merged.push(entry);
      }
    }
    this.table.setFromJSO(merged, true);
    this.setDetailsEntry(null);

    this.colorMergeTable();

    this.get("#saveButton").hidden = true;
    this.get("#mergeButton").hidden = true;
    this.get("#finishButton").hidden = false;
  }

  colorMergeTable() {
    let colorA = "yellow";
    let colorB = "lightblue";
    let colorM = "orange";

    // #TODO this should be pulled into the table....
    let rows = this.table.rows();
    let header = rows.shift();
    header = Array.from(header.querySelectorAll("th")).map(ea => ea.textContent);
    var indexOf = {};
    for (let i in header) {
      indexOf[header[i]] = i;
    }

    let mergedEntries = this.table.asJSO();
    for (let row of rows) {

      let cells = row.querySelectorAll("td");

      var citationKey = cells[indexOf["citationKey"]].textContent;
      var a = this.originalEntries.find(ea => ea.citationKey == citationKey);
      var m = mergedEntries.find(ea => ea.citationKey == citationKey);
      var b = this.otherEntries.find(ea => ea.citationKey == citationKey);
      if (a && b) {
        cells[0].style.backgroundColor = colorM;
      } else if (a) {
        cells[0].style.backgroundColor = colorA;
      } else if (b) {
        cells[0].style.backgroundColor = colorB;
      }
      for (let name of header) {
        let cell = cells[indexOf[name]];
        if (a && b) {
          if (a[name] != b[name] || a[name] != m[name]) {
            if (a[name] == m[name]) {
              cell.style.backgroundColor = colorA;
            } else if (b[name] == m[name]) {
              cell.style.backgroundColor = colorB;
            } else {
              cell.style.backgroundColor = colorM;
            }
          } else {
            cell.style.backgroundColor = "";
          }
        }
      }
    }
  }

  colorDetailsTable() {
    if (!this.isMerging() || !this.detailsTable) return;

    let colorA = "yellow";
    let colorB = "lightblue";
    let colorM = "orange";

    let rows = this.detailsTable.rows();
    let header = this.detailsTable.column(0).map(ea => ea.textContent);

    let columnTitles = rows[0].querySelectorAll("th");
    if (columnTitles[1]) columnTitles[1].style.backgroundColor = colorA;
    if (columnTitles[2]) columnTitles[2].style.backgroundColor = colorM;
    if (columnTitles[3]) columnTitles[3].style.backgroundColor = colorB;

    for (let row of rows) {
      let cells = row.querySelectorAll("td");
      var a = cells[1];
      var m = cells[2];
      var b = cells[3];
      if (a && m && b) {

        if (a.textContent != m.textContent && b.textContent !== m.textContent) {
          m.style.backgroundColor = colorM;
        } else if (a.textContent == m.textContent) {
          m.style.backgroundColor = colorA;
        } else if (a.textContent == m.textContent) {
          m.style.backgroundColor = colorA;
        } else if (b.textContent == m.textContent) {
          m.style.backgroundColor = colorB;
        }
      }
    }
  }

  focusOnText() {
    this.$text.focus()
  }
  
  livelyMigrate(other) {
    this.src = other.src;
  }
}