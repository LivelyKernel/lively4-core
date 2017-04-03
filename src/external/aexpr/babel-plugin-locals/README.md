# babel-plugin-locals

Python locals() in JavaScript.

## Example

Transforms
```js
var x;
let y = 42;

function z() {}

locals;
```

to
```js
var x;
let y = 42;

function z() {}

({
  x,
  y,
  z
});
```

This transformation has potential usages for meta programming(e.g. interpreting a function using a JavaScript interpreter requires explicit access to the local scope of the function).

## Installation

```sh
$ npm install babel-plugin-locals
```

## Usage

### Via `.babelrc` (Recommended)

**.babelrc**

```json
{
  "plugins": ["locals"]
}
```

### Via CLI

```sh
$ babel --plugins locals script.js
```

### Via Node API

```javascript
require("babel-core").transform("code", {
  plugins: ["locals"]
});
```
