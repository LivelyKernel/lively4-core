## 2019-03-20 Destructuring Parameters

<script>
function execPrevElement(refElement) {
  var tags = []
  while (refElement = refElement.previousElementSibling) {
    if(refElement.localName !== 'pre') { continue; }
    
    var child0 = refElement.childNodes[0];
    if (!child0 || child0.localName !== 'code') { continue; }

    if (child0.classList.contains('language-javascript')) {
      break;
    }
  }
  
  if (!refElement) {
    return <div style="background-color: red">Found no Element to execute.</div>;
  }
  
  return refElement.textContent.boundEval()
}
</script>

Deconstructing parameters might not be as simple as you think it is:

```javascript
function foo({ editMode = false } = {}) {
  return editMode
}

foo()
```
<script>execPrevElement(this);</script>


```javascript
foo({})
```
<script>execPrevElement(this);</script>


```javascript
foo({ editMode: true })
```
<script>execPrevElement(this);</script>


## Fixing Plex after PolymorphicIdentifier demo

![](plex_demo.png)



