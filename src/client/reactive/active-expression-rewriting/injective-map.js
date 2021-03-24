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

  hasLeft(left) {
    return this.leftToRight.has(left);
  }

  getOrCreateRightFor(left, constructorCallback) {
    if (!this.hasLeft(left)) {
      this.associate(left, constructorCallback(left));
    }
    return this.leftToRight.get(left);
  }
  
  removeRight(right) {
    const left = this.rightToLeft.get(right);
    if(left) {
      this.leftToRight.delete(left);
    }
    this.rightToLeft.delete(right);
  }

  getLeftFor(right) {
    return this.rightToLeft.get(right);
  }

  hasRight(right) {
    return this.rightToLeft.has(right);
  }

  getOrCreateLeftFor(right, constructorCallback) {
    if (!this.hasRight(right)) {
      this.associate(constructorCallback(right), right);
    }
    return this.rightToLeft.get(right);
  }
  
  removeLeft(left) {
    const right = this.leftToRight.get(left);
    if(right) {
      this.rightToLeft.delete(right);
    }
    this.leftToRight.delete(left);
  }

  clear() {
    this.leftToRight.clear();
    this.rightToLeft.clear();
  }

}
