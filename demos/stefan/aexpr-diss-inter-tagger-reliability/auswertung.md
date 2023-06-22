<script>
import { editSelf } from './helpers.js'
editSelf(this)
</script>
<script>
import babelDefault from 'src/external/babel/babel7default.js'
const babel = babelDefault.babel;
const t = babel.types;

(async () => {
const url = 'https://lively-kernel.org/lively4/aexpr/demos/stefan/aexpr-diss-inter-tagger-reliability/signals-aexpr-main.js';

  const code = await url.fetchText()
  
  let numASTNodes = 0;
  code.traverseAsAST({
    enter(path) {
      numASTNodes++
    },
  })
  
  const url2 = 'https://lively-kernel.org/lively4/aexpr/demos/stefan/aexpr-diss-inter-tagger-reliability/signals-aexpr-setup.js';

  const code2 = await url2.fetchText()
  
  let numASTNodes2 = 0;
  code2.traverseAsAST({
    enter(path) {
      numASTNodes2++
    },
  })
  
  return numASTNodes + " " + numASTNodes2 + ' = ' + (numASTNodes + numASTNodes2)
})()
</script>

cohen's kappa for binary classification:
```javascript
var TP = 1
var TN = 1
var FP = 1
var TN = 1

var k = 2 * (TP * TN - FN * FP) /
  ((TP + FP) * (FP + TN)) + ((TP + FN) * (FN + TN))
```