
## Meta reflection of Scripts in Markdown

If you not only want to execute a script, but show it's source and you shy away from copying...
here is the magic that help you along your chosen path of meta reflection.. SCRIPT EDITION!

### (A) Execute  Code Listing....

```markdown
 ```javascript {.myscript}
 var a = 4
 alert(a + 3)
 ```​
```
<!-- Meta Meta Hack a zero width whitespace (​)... to mess around with quotes (​) -->

with a script tag

```javascript
<script>
import boundEval from "src/client/bound-eval.js";
var source = lively.query(this, ".navigationExample").textContent
boundEval(source, this).then(r => r.value)
</script>
```


### (A) Execute  Code Listing....

```markdown
 ```javascript {.myscript}
 var a = 4
 alert(a + 3)
 ```​
```
<!-- Meta Meta Hack a zero width whitespace (​)... to mess around with quotes (​) -->

with a script tag

```javascript
<script>
import boundEval from "src/client/bound-eval.js";
var source = lively.query(this, ".myscript").textContent
boundEval(source, this).then(r => r.value)
</script>
```

resulting in:

```javascript {.myscript}
var a = 4
a + 3
```

<script>
import boundEval from "src/client/bound-eval.js";
var source = lively.query(this, ".myscript").textContent
boundEval(source, this).then(r => r.value)
</script>



### (B) Show Source Code of Script ... or class or method

```javascript
<script id="myScript2">
var a = 4
a + 3
</script>

<script>
var s = lively.query(this, "#myScript2");
(<pre>{s.textContent}</pre>)
</script>
```

The evaluated script:

<script id="myScript2">
var a = 4
a + 3
</script>

And it's source:

<script>
var s = lively.query(this, "#myScript2");
(<pre>{s.textContent}</pre>)
</script>



## How to embed active content in Markdown?

```html
<script>
(async () => {
  var comp = await (<lively-editor></lively-editor>)
  return comp
})()
</script>
```

<script>
(async () => {
  var comp = await (<lively-editor></lively-editor>)
  return comp
})()
</script>