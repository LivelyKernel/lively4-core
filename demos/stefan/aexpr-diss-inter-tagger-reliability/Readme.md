# Inter-tagger Reliabilty

## Idea

- [ ] signal usage example
- [ ] prepare documents
  - [ ] plugin explorer
    - [ ] transformer
    - [ ] input file
- [ ] for participant
  - [ ] Section lesen 2.4.1? (vorher)
  - [ ] Explain signals concept and active expressions
  - [ ] Walkthrough the particular implementation
  - [ ] Tagging Task
- [ ] transfer color annotations (detection) to ast node file
- [ ] run existing counting script
- [ ] update diss

Use Plugin explorer

Detection vs Reaction lesen lassen
Signals am Beispiel/Nutzung erklären
Transformation zeigen; 2-schrittig
Implementierung zeigen, Find good starting point
Aexpr api klarmachen
Babel tree traversal + node matching erklären

Für's Coding
Change Detection
Ausgelagert auf Aexprs
Reaktion
Signals aktualisieren (glitch freedom durch topologische Sortierung)
Andere Aexprs deferren
Initialen wert setzen



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