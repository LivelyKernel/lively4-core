export default class BidirectionalMultiMap {

  constructor() {
    this.leftToRight = new Map();
    this.rightToLeft = new Map();
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
    this.leftToRight.clear();
    this.rightToLeft.clear();
  }

  getRightsFor(left) {
    return this.leftToRight.getOrCreate(left, () => new Set());
  }

  getLeftsFor(right) {
    return this.rightToLeft.getOrCreate(right, () => new Set());
  }

}
