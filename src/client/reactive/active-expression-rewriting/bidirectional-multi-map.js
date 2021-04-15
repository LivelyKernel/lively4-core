export default class BidirectionalMultiMap {

  constructor() {
    this.domainToRange = new Map();
    this.rangeToDomain = new Map();
  }

  associate(left, right) {
    this.getRightsFor(left).add(right);
    this.getLeftsFor(right).add(left);
  }

  remove(left, right) {
    const rights = this.getRightsFor(left);
    rights.delete(right);
    if(rights.size === 0) this.domainToRange.delete(left);
    
    const lefts = this.getLeftsFor(right);
    lefts.delete(left);
    if(lefts.size === 0) this.rangeToDomain.delete(right);
  }

  removeAllRightFor(left) {
    this.getRightsFor(left).forEach(right => this.remove(left, right));
  }

  removeAllLeftFor(right) {
    this.getLeftsFor(right).forEach(left => this.remove(left, right));
  }

  clear() {
    this.domainToRange.clear();
    this.rangeToDomain.clear();
  }
  
  has(left, right) {
    return this.hasLeft(left) && this.getRightsFor(left).has(right);
  }

  hasRight(val) {
    return this.rangeToDomain.has(val);
  }

  hasLeft(val) {
    return this.domainToRange.has(val);
  }

  getRightsFor(left) {
    return this.domainToRange.getOrCreate(left, () => new Set());
  }

  getLeftsFor(right) {
    return this.rangeToDomain.getOrCreate(right, () => new Set());
  }

  getAllLeft() {
    return Array.from(this.domainToRange.keys());
  }

  getAllRight() {
    return Array.from(this.rangeToDomain.keys());
  }

}