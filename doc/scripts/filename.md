# Filename Cleanup


```javascript

import Strings from 'src/client/strings.js'

var input = document.querySelector("lively-dialog").get("input");


var ignore = new Set(["A"]);

input.value = input.value.split(" ")
  .map(ea => ea.replace(/[,:;\-]/,""))
  .filter(ea => ea.length > 0)
  .map(ea => Strings.toUpperCaseFirst(ea))
  .filter(ea => !ignore.has(ea))
  .join("")

```