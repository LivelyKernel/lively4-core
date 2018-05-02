
/**
 *
 * @class Annotations
 * @classdesc Stores and combines multiple plain JavaScript objects for configuration or preferences.
 * @example Usage of the Annotations utility
 * import Annotations from 'src/client/reactive/active-expressions/active-expressions/src/annotations.js';
 *
 * const ann = new Annotations();
 * ann.add({ name: 'Lively4' });
 * ann.add({ name: 'Annotations', color: 'green' });
 *
 * ann.keys(); // ['name', 'color']
 * ann.has('value'); // true
 * ann.get('name'); // 'Lively4'
 * ann.getAll('value'); // ['Lively4', 'Annotations']
 */
export default class Annotations {
  constructor() {
    this._annotations = [];
  }
  
  /**
   * Stores a new annotation object.
   * @function Annotations#add
   * @param {Object} obj - A plain JavaScript object to add as annotation.
   */
  add(obj) {
    this._annotations.push(obj);
  }

  /**
   * Checks whether there is some value stored for a given property.
   * @function Annotations#has
   * @param {String} prop - The property name we search values for.
   * @return {Boolean} True, if there is a value for the key, false otherwise.
   */
  has(prop) {
    return !!this._annotations.find(obj => obj.hasOwnProperty(prop));
  }

  /**
   * Get all properties for which we have at least one value.
   * @function Annotations#keys
   * @return {Array<String>} An array containing all properties for which values are currently defined.
   */
  keys() {
    return Object.keys(Object.assign({}, ...this._annotations));
  }
  
  /**
   * Get a value associated to the given property.
   * @function Annotations#get
   * @param {String} prop - The property name we search values for.
   * @return {any} A value previously added to the property, or undefined if no value was defined previously.
   */
  get(prop) {
    return this.getAll(prop)[0];
  }
  
  /**
   * Get all values associated to the given property.
   * @function Annotations#getAll
   * @param {String} prop - The property name we search values for.
   * @return {Array<any>} An array containing all values associated to the property.
   */
  getAll(propName) {
    return this._annotations
      .filter(obj => obj.hasOwnProperty(propName))
      .map(obj => obj[propName]);
  }
}
