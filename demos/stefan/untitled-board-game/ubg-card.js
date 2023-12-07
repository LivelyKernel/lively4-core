export default class Card {
  
  constructor() {
    this.versions = [{}];
  }

  static foo() {}

  getId() {
    return this.id;
  }

  setId(id) {
    if (id === undefined) {
      delete this.id;
    } else {
      this.id = id;
    }
  }

  getName() {
    return this.versions.last.name;
  }

  setName(name) {
    this.ensureUnprintedVersion();
    this.versions.last.name = name;
  }

  getType() {
    return this.versions.last.type;
  }

  setType(type) {
    this.ensureUnprintedVersion();
    this.versions.last.type = type;
  }

  getElement() {
    return this.versions.last.element;
  }

  setElement(element) {
    this.ensureUnprintedVersion();
    this.versions.last.element = element;
  }

  getCost() {
    return this.versions.last.cost;
  }

  setCost(cost) {
    this.ensureUnprintedVersion();
    this.versions.last.cost = cost;
  }

  getBaseVP() {
    return this.versions.last.baseVP;
  }

  setBaseVP(baseVP) {
    this.ensureUnprintedVersion();

    if (!baseVP) {
      delete this.versions.last.baseVP;
    } else {
      this.versions.last.baseVP = baseVP;
    }
  }

  getText() {
    return this.versions.last.text;
  }

  setText(text) {
    this.ensureUnprintedVersion();
    
    if (text) {
      this.versions.last.text = text;
    } else {
      delete this.versions.last.text;
    }
  }

  getNotes() {
    return this.versions.last.notes;
  }

  setNotes(notes) {
    this.ensureUnprintedVersion();

    if (notes === undefined) {
      delete this.versions.last.notes;
    } else {
      this.notes = notes;
      this.versions.last.notes = notes;
    }
  }

  getIsPrinted() {
    return this.versions.last.isPrinted;
  }

  setIsPrinted(isPrinted) {
    if (!isPrinted) {
      delete this.versions.last.isPrinted;
    } else {
      this.versions.last.isPrinted = isPrinted;
    }
  }

  getArtDirection() {
    return this.artDirection;
  }

  setArtDirection(value) {
    if (value === undefined || value === '') {
      delete this.artDirection;
    } else {
      this.artDirection = value;
    }
  }

  getTags() {
    return this.versions.last.tags || [];
  }

  hasTag(tag) {
    return this.getTags().includes(tag)
  }

  addTag(value) {
    this.ensureUnprintedVersion();

    if (value === undefined || value === '' || !_.isString(value)) {
      return;
    }

    if (!this.versions.last.tags) {
      this.versions.last.tags = []
    }
    if (this.hasTag(value)) {
      return;
    }
    
    this.versions.last.tags.push(value);
  }

  removeTag(value) {
    this.ensureUnprintedVersion();

    if (!this.versions.last.tags) {
      this.versions.last.tags = []
    }

    this.versions.last.tags = this.versions.last.tags.filter(tag => tag !== value)

    if (this.versions.last.tags.length === 0) {
      delete this.versions.last.tags
    }
  }

  // #important
  ensureUnprintedVersion() {
    if (this.versions.last.isPrinted) {
      const newLastVersion = _.omit(_.cloneDeep(this.versions.last), 'isPrinted');
      this.versions.push(newLastVersion);
    }
  }

  getHighestVersion() {
    return this.versions.length;
  }

}