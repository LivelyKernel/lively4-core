export default class Card {

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

  getText() {
    return this.versions.last.text;
  }

  setText(text) {
    this.ensureUnprintedVersion();
    this.versions.last.text = text;
  }

  getNotes() {
    return this.versions.last.notes;
  }

  setNotes(notes) {
    this.ensureUnprintedVersion();

    if (notes === undefined) {
      delete this.notes;
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

  ensureUnprintedVersion() {
    if (this.versions.last.isPrinted) {
      const newLastVersion = _.omit(_.cloneDeep(this.versions.last), 'isPrinted');
      this.versions.push(newLastVersion);
    }
  }

}