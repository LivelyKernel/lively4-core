
import sourcemap from 'src/external/source-map.min.js';

/*MD # Callable MD*/
export default class Callable extends Function {
  constructor() {
    super('...args', 'return this._bound.__call__(...args)');
    this._bound = this.bind(this);
    return this._bound;
  }
  __call__(...args) {
    throw new Error('subclass responsibility')
  }
}
