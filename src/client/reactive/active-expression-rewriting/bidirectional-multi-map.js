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
    this.getRightsFor(left).delete(right);
    this.getLeftsFor(right).delete(left);
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
