
# Example 1 - transform
``` javascript
import { config } from 'src/client/vivide/utils.js';

(async (input, vivideLayer) => {
  for (let item of input) {
    vivideLayer.push(await fetch(item));
  }
})::config({
  
})
```

# Example 1 - extract
``` javascript
import { config } from 'src/client/vivide/utils.js';

(async item => (
  {
  label: item.url.split('/').pop(),
  tooltip:  (await item.text()).replace(/\n/g, '<br>')
}))::config({
})
```

# Example 1 - descent
``` javascript
import { config } from 'src/client/vivide/utils.js';

(item => lively.findDependedModules(item.url))::config({
  
})
```

# Example 2 - transform
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

# Example 2 - extract
``` javascript
import { config } from 'src/client/vivide/utils.js';

(item => (
  {
  label: item.name,
  tooltip:  "type: " + item.type + "<br>size: " + item.size
}))::config({
})
```

# Example 2 - descent
``` javascript
import { config } from 'src/client/vivide/utils.js';

(async item => {
  let url = item.path === null ? lively4url + '/' + item.name : item.path;
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