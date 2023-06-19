here we go....

cohen's kappa for binary classification:
```javascript
var TP = 1
var TN = 1
var FP = 1
var TN = 1

var k = 2 * (TP * TN - FN * FP) /
  ((TP + FP) * (FP + TN)) + ((TP + FN) * (FN + TN))
```