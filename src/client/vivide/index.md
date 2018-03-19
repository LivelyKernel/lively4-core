Vivide stuff


```javascript
((input, output) => {
  
})::config({
  
})
```

```javascript
import { config } from './../utils.js';
import { VivideListView } from './../components/vividelistview.js';

export default ((input, output) => {
  input.forEach(item => output.push(item));
})::config({
  widget: VivideListView
})
```
