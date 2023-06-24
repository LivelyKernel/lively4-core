<script>
import { editSelf } from './helpers.js'
editSelf(this)
</script>

<script>
import { runEvaluation, renderPaths, cohensKappa } from './auswertung.js';
let results;
(async () => {
results = await runEvaluation(this);
return 'computed'
})()
</script>

<span style='background-color: #fdd49e;'>change detection</span>
<span style='background-color: #a1d99b;'>reactive behavior</span>

### main
<script>
renderPaths(results.pathsMain)
</script>

### setup
<script>
renderPaths(results.pathsSetup)
</script>

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
