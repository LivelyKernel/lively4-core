# Introduction

The following scripts have to be executed either with ctrl+alt+v or with letsScript() in Lively4.

# Example 1 - Initial Example

```javascript
[
  {name: "object", subclasses:[{name: "morph"},]},
  {name: "list", subclasses:[{name: "linkedlist", subclasses:[{name: "stack"}]}, {name: "arraylist"}]},
  {name: "usercontrol", subclasses:[{name: "textbox"}, {name: "button"}, {name: "label"}]},
]
```

## extract

``` javascript
import { config } from 'src/client/vivide/utils.js';

(async item => (
  {
  label: item.name
}))::config({
})
```

# Example 2 - Async Example

```javascript
lively.findDependedModules('https://lively-kernel.org/lively4/lively4-thulur/src/client/lively.js')
```

## transform
``` javascript
import { config } from 'src/client/vivide/utils.js';

(async (input, vivideLayer) => {
  for (let item of input) {
    vivideLayer.push(await fetch(item));
  }
})::config({
  
})
```

## extract
``` javascript
import { config } from 'src/client/vivide/utils.js';

(async item => (
  {
  label: item.url.split('/').pop(),
  tooltip:  (await item.text()).replace(/\n/g, '<br>')
}))::config({
})
```

## descent
``` javascript
import { config } from 'src/client/vivide/utils.js';

(item => lively.findDependedModules(item.url))::config({
  
})
```
# Example 3 - Multilevel Hierarchy Example

```javascript
fetch('https://lively-kernel.org/lively4/lively4-thulur/', {method: 'OPTIONS'})
  .then(r => r.json())
  .then(j => j.contents);
```

## transform
``` javascript
import { config } from 'src/client/vivide/utils.js';

((input, vivideLayer) => {
  input.sort((a, b) => {
    if (a.type === 'directory' && b.type === 'file') {
      return -1;
    } else if (a.type === 'file' && b.type === 'directory') {
      return 1;
    } else {
      return 0;
    }
  })
  
  for (let item of input) {
    if (item.name.startsWith('.')) continue;
    vivideLayer.push(item);
  }
})::config({
  
})
```

## transform (with utils)
``` javascript
import { config } from 'src/client/vivide/utils.js';
import { sortDirectoriesAndFiles } from 'doc/RP2018/vivide-js/presentation/presentation-utils.js'

((input, vivideLayer) => {
  sortDirectoriesAndFiles(input);
  
  for (let item of input) {
    if (item.name.startsWith('.')) continue;
    vivideLayer.push(item);
  }
})::config({
  
})
```

## extract
``` javascript
import { config } from 'src/client/vivide/utils.js';

(item => (
  {
  label: item.name,
  tooltip:  "type: " + item.type + "<br>size: " + item.size
}))::config({
})
```

## descent
``` javascript
import { config } from 'src/client/vivide/utils.js';

(async item => {
  let url = item.path == null ? lively4url + '/' + item.name : item.path;
  let response = await fetch(url, {method: 'OPTIONS'});
  let json = await response.json();
  let content = json.contents;
  
  if (!content) return [];
  
  for (let child of content) {
    if (item.path !== null) {
      child.path = item.path + '/' + child.name;
    } else {
      child.path = lively4url + '/' + item.name + '/' + child.name;
    }
  }
  return content;
  })::config({
})
```

## descent (with utils)
``` javascript
import { config } from 'src/client/vivide/utils.js';
import { optionsResult, getPath } from 'doc/RP2018/vivide-js/presentation/presentation-utils.js'

(async item => {
  let content = await optionsResult(item);
  
  if (!content) return [];
  
  for (let child of content) {
    child.path = getPath(child, item);
  }
  return content;
  })::config({
})
```