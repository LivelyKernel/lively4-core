# stack-es2015-module
A simple stack data structure provided as es2015 module.

## Installation

As npm for Node.js:

```
$ npm install stack-es2015-module --save
```

Or download the [bundle.js](https://raw.githubusercontent.com/onsetsu/stack-es2015-module/master/dist/bundle.js) file.

## Building

```
$ npm run-script build
```

creates the `bundle.js` file in the `dist` folder.

## Testing

As npm package:

```
$ npm test
```

## Example

```js
import Stack from 'stack-es2015-module';

let stack = new Stack();

stack.push(42);
stack.push(17);
stack.top(); // 17
stack.pop();
stack.top(); // 42
stack.withElement(33, () => {
  stack.top(); // 33
});
```

## API

### Stack()

Initializes a new empty `Stack`.

### Stack#top()

Returns the top element of the stack.

### Stack#pop()

Pops the top element of the stack.

### Stack#push(element)

Pushes the `element` at the top of the stack.

### Stack#withElement(element, callback, context)

Pushes the `element` at the top of the stack and executes the `callback` with the optional `context`.
After successfully returning from the `callback` or upon an uncatched error, the top element is poped from the stack.

## Licence

MIT
