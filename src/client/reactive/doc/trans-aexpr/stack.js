'enable aexpr';

class Stack {
  constructor() {
    this.elements = [];
    this.index = -1;
  }

  top() {
    if(this.index >= this.elements.length)
      throw new Error('Inconsistency Detected');
    return this.elements[this.index];
  }

  push(element) {
    this.index += 1;
    this.elements[this.index] = element;
  }

  pop() {
    if(this.index >= 0) {
      const element = this.elements[this.index];
      this.index -= 1;
      return element;
    }
  }
}

let myStack = new Stack();
aexpr(() => {return myStack.top();}).onChange(v => lively.notify(v));
myStack.push(42);
myStack.pop();
