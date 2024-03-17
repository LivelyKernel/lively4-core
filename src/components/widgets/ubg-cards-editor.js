import Morph from 'src/components/widgets/lively-morph.js';

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
  
  get ubg() {
    return lively.allParents(this, undefined, true).find(ele => ele.tagName === 'UBG-CARDS');
  }

  onKeyDown(evt) {
    return;
    if (evt.ctrlKey && evt.key == "s") {
      evt.stopPropagation();
      evt.preventDefault();
      lively.warn(evt.key, 'key from editor')
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

  get src() {
    return this.card;
  }

  set src(card) {
    this.card = card;
    this.updateView();
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

  focusOnText() {
    this.$text.focus()
  }
  
  livelyMigrate(other) {
    this.src = other.src;
  }
}