# Example Scripts

Useful scripts and examples to put into a Markdown file.

## Auto-generated Navigation


```javascript {.navigationExample}
  // #Example #File #Navigation
  var container =   lively.query(this, "lively-container");
  var url = container.getURL().toString();
  var base = url.replace(/[^/]*$/, "");

  (async () => {
    // fetch file structure information
    var json = await (fetch(base, {
        method: "OPTIONS"
      }).then(r => r.json()))
    var files = json.contents
    // generate links
    var list =  <ul>{...
      files
        .sortBy(ea => ea.name)
        .filter(ea => ! ea.name.match(/^\./))
        .map(ea => <li><a href={ea.name + (ea.type == "directory" ? "/" : "")}>{ea.name}</a></li>)
    }</ul>
    // replace normal link behavior with our own, #TODO hide this more....
    lively.html.fixLinks([list], base, link => container.followPath(link))
    return list
  })()
```

Which will produce this...

<script>
import boundEval from "src/client/bound-eval.js";
var source = lively.query(this, ".navigationExample").textContent
boundEval(source, this).then(r => r.value)
</script>


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



