/**
 * @class Stack
 *
 * @example
 * import Stack from 'stack-es2015-module';
 *
 * let stack = new Stack();
 *
 * stack.push(42);
 * stack.push(17);
 * stack.top(); // 17
 * stack.pop();
 * stack.top(); // 42
 * stack.withElement(33, () => {
 *   stack.top(); // 33
 * });
 */
export default class Stack {
  /**
   * Initializes a new empty `Stack`.
   * @method constructor
   */
  constructor() {
    this.arr = [];
  };

  /**
   * Pushes the `element` at the top of the stack.
   * @method push
   * @param {any} element - The element to be pushed on top of the stack.
   */
  push(element) {
    this.arr.push(element);
  }

  /**
   * Pops the top element of the stack.
   * @method pop
   */
  pop() {
    this.arr.length--;
  }

  /**
   * Returns the top element of the stack.
   * @method top
   * @return {any} The value on top of the stack.
   */
  top() {
    // TODO: .last() not defined in older node versions
    // return this.arr.last();
    return this.arr[this.arr.length - 1];
  }

  /**
   * Pushes the `element` at the top of the stack and executes the `callback` with the optional `context`.
   * After successfully returning from the `callback` or upon an uncatched error, the top element is poped from the stack.
   * @method withElement
   * @param {any} el - The element temporarily on stack.
   * @param {function} callback - The function to be called.
   * @param {Object} context - The this reference use for the call.
   */
  withElement(el, callback, context) {
    this.push(el);
    try {
      callback.call(context);
    } finally {
      this.pop();
    }
  }

  /**
   * Returns an element from the stack that satisfies the given condition, search fron bottom to top.
   * @method findUp
   * @param {function} callback - The condition to be called.
   * @param {any} thisArg - This object passed as `this` into the `callback`.
   * @return {any} The element satisfying the condition.
   */
  findUp(...args) {
    return this.arr.reverse().find(...args);
  }

  /**
   * Returns an element from the stack that satisfies the given condition, search from top to bottom.
   * @method findDown
   * @param {function} callback - The condition to be called.
   * @param {any} thisArg - This object passed as `this` into the `callback`.
   * @return {any} The element satisfying the condition.
   */
  findDown(...args) {
    return this.arr.find(...args);
  }

}
