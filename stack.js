export default class Stack {
    constructor() {
        this.arr = [];
    };

    push(el) {
        this.arr.push(el);
    }

    pop() {
        this.arr.length--;
    }

    top() {
        // TODO: .last() not defined in older node versions
        // return this.arr.last();
        return this.arr[this.arr.length - 1];
    }

    withElement(el, callback, context) {
        this.push(el);
        try {
            callback.call(context);
        } finally {
            this.pop();
        }
    }
}
