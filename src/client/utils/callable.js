
/*MD # Callable MD*/
export default class Callable extends Function {
  constructor() {
    // there are various ways to do this, see https://hackernoon.com/creating-callable-objects-in-javascript-d21l3te1
    super('...args', 'return this._bound.__call__(...args)');
    this._bound = this.bind(this);
    return this._bound;
  }
  __call__(...args) {
    throw new Error('subclass responsibility')
  }
}
