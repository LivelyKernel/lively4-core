export default class InjectiveMap {

  constructor() {
    this.leftToRight = new Map();
    this.rightToLeft = new Map();
  }
  
  associate(left, right) {
    this.leftToRight.set(left, right);
    this.rightToLeft.set(right, left);
  }
  
  getRightFor(left) {
    return this.leftToRight.get(left);
  }

  hasRightFor(left) {
    return this.leftToRight.has(left);
  }

  getOrCreateRightFor(left, constructorCallback) {
    if (!this.hasRightFor(left)) {
      this.associate(left, constructorCallback(left));
    }
    return this.leftToRight.get(left);
  }

  getLeftFor(right) {
    return this.rightToLeft.get(right);
  }

  hasLeftFor(right) {
    return this.rightToLeft.has(right);
  }

  getOrCreateLeftFor(right, constructorCallback) {
    if (!this.hasLeftFor(right)) {
      this.associate(constructorCallback(right), right);
    }
    return this.rightToLeft.get(right);
  }

  clear() {
    this.leftToRight.clear();
    this.rightToLeft.clear();
  }

}
