# babel-plugin-aexpr-source-transformation
3rd implementation strategy of active expressions, via a babel transformation

## Example

Transforms
```js
something
```

to
```js
something else
```

## Installation

```sh
$ npm install babel-plugin-aexpr-source-transformation
```

## Usage

### Via `.babelrc` (Recommended)

**.babelrc**

```json
{
  "plugins": ["aexpr-source-transformation"]
}
```

### Via CLI

```sh
$ babel --plugins aexpr-source-transformation script.js
```

### Via Node API

```javascript
require("babel-core").transform("code", {
  plugins: ["aexpr-source-transformation"]
});
```
