# Auto-generated Navigation


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