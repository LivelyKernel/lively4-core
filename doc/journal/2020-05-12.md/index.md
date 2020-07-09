## 2020-05-12 And #Annotations again
*Author: @JensLincke*

Solving a conflict...

```javascript
import {default as AnnotationSet, AnnotatedText} from "src/client/annotations.js"


var annotationsURL = "https://lively-kernel.org/lively4/lively4-dummyD/writetest2.txt.l4a"  
var textURL = annotationsURL.replace(/\.l4a$/,"")

AnnotatedText.solveAnnotationConflict(textURL, annotationsURL)
  .then(a => a.saveToURL(textURL, annotationsURL))
```

