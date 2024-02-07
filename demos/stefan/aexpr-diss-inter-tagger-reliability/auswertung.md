<script>
import { editSelf } from './helpers.js'
editSelf(this)
</script>

<script>
import { runEvaluation, renderPaths, cohensKappa } from './auswertung.js';
const results = results = await runEvaluation(this);
'results computed'
</script>

### main.js
<script>
renderPaths(results.pathsMain)
</script>

### setup.js
<script>
renderPaths(results.pathsSetup)
</script>

<span style='background-color: #fdd49e; border-radius:3px; padding: 3px;'>change detection</span>
<span style='background-color: #a1d99b; border-radius:3px; padding: 3px;'>reactive behavior</span>

### cohen's kappa
cohen's kappa for binary classification:
```javascript
TP = stefan: reaction, tom: reaction
TN = stefan: detection, tom: detection
FP = stefan: detection, tom: reaction
FN = stefan: reaction, tom: detection

k = 2 * (TP * TN - FN * FP) /J
  ((TP + FP) * (FP + TN)) + ((TP + FN) * (FN + TN))
```

<script>
'k = ' + cohensKappa(results)
</script>
