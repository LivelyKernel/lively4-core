
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