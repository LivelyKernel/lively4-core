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

  getIdentity() {
    return this.identity;
  }

  setIdentity(identity) {
    if (identity === undefined) {
      delete this.identity;
    } else {
      this.identity = identity;
    }
  }

  getFlavor() {
    return this.flavor;
  }

  setFlavor(flavor) {
    if (flavor === undefined) {
      delete this.flavor;
    } else {
      this.flavor = flavor;
    }
  }

  getArtDirection() {
    return this.artDirection;
  }

  setArtDirection(artDirection) {
    if (artDirection === undefined) {
      delete this.artDirection;
    } else {
      this.artDirection = artDirection;
    }
  }

  getFlavorText() {
    return this.flavorText;
  }

  setFlavorText(flavorText) {
    if (flavorText === undefined) {
      delete this.flavorText;
    } else {
      this.flavorText = flavorText;
    }
  }

  getTypes() {
    const type = this.versions.last.type;
    
    if (!type) {
      return []
    }
    
    if (Array.isArray(type)) {
      return type
    }
    
    if (typeof type === 'string') {
      return [type]
    }
    
    throw new Error('unknown type for card type: ' + type)
  }
  
  setTypes(types) {
    this.ensureUnprintedVersion();

    if (!types) {
      delete this.versions.last.type;
      return;
    }
    
    if (!Array.isArray(types)) {
      throw new Error('"types" is not an Array, but: ' + typeof types)
    }

    if (types.length === 0) {
      delete this.versions.last.type;
    }
    
    if (types.length === 1) {
      this.versions.last.type = types.first;
    }
    
    if (types.length >= 2) {
      this.versions.last.type = types;
    }
  }

  hasType(t) {
    return this.getTypes().some(type => type.toLowerCase() === t)
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

  getCostModifier() {
    return this.versions.last.costModifier;
  }

  setCostModifier(costModifier) {
    this.ensureUnprintedVersion();
    
    if (!costModifier) {
      delete this.versions.last.costModifier;
    } else {
      this.versions.last.costModifier = costModifier;
    }
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
    return this.notes;
  }

  setNotes(notes) {
    if (notes === undefined || notes === '') {
      delete this.notes;
    } else {
      this.notes = notes;
    }
  }

  getRating() {
    return this.versions.last.rating;
  }

  setRating(rating) {
    this.ensureUnprintedVersion();

    if (rating === undefined || rating === 'unset') {
      delete this.versions.last.rating;
    } else {
      this.versions.last.rating = rating;
    }
  }

  getComprehensionComplexity() {
    return this.versions.last.cComp;
  }

  setComprehensionComplexity(cComp) {
    this.ensureUnprintedVersion();

    if (cComp === undefined || cComp === 'unset') {
      delete this.versions.last.cComp;
    } else {
      this.versions.last.cComp = cComp;
    }
  }

  getBoardComplexity() {
    return this.versions.last.cBoard;
  }

  setBoardComplexity(cBoard) {
    this.ensureUnprintedVersion();

    if (cBoard === undefined || cBoard === 'unset') {
      delete this.versions.last.cBoard;
    } else {
      this.versions.last.cBoard = cBoard;
    }
  }

  getStrategicComplexity() {
    return this.versions.last.cStrat;
  }

  setStrategicComplexity(cStrat) {
    this.ensureUnprintedVersion();

    if (cStrat === undefined || cStrat === 'unset') {
      delete this.versions.last.cStrat;
    } else {
      this.versions.last.cStrat = cStrat;
    }
  }

  getPowerLevel() {
    return this.versions.last.power;
  }

  setPowerLevel(power) {
    this.ensureUnprintedVersion();

    if (power === undefined || power === 'unset') {
      delete this.versions.last.power;
    } else {
      this.versions.last.power = power;
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

  isVisible() {
    return !this['hidden'] && !this['out-of-range']
  }
  
  toString() {
    return `Card ${this.getName() || this.getId()}`
  }
}