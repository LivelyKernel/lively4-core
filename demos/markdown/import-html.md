# Import HTML Example


## Use HTML like Images

like this:

```markdown
![](../../src/parts/ConnectorExample.html)
```


![](../../src/parts/ConnectorExample.html){#ConnectorExampleImport}


Make sure, that the content int this HTML file can be positioned either automatically or relative.
E.g. if there are "absolute" positioned element. User "position:relative" to ensure a new coordinates origin.

The included HTML has to look like this in the top level element:

```html
<div style="position: relative; left: 0px; top: 0px; width: 500px; height: 300px;">
...
</div>
```
### And we can interact from the outside via scripts

1. (lively-import) images need and ID

```markdown
![](../../src/parts/ConnectorExample.html){#ConnectorExampleImport}
```

2. so we can find them again in the script

```javascript
var importHTML = lively.query(this, "#ConnectorExampleImport")
```
3. the content is loaded asynchronous, so we wait for a loaded event

```javascript
var i=1;
importHTML.addEventListener("content-loaded", () => {
  for(let ea of importHTML.shadowRoot.querySelectorAll("div")) {
  ea.appendChild(<span>{"DIV " + i++}</span>)
  }
})
```

<script>
var importHTML = lively.query(this, "#ConnectorExampleImport")
var i=1;
importHTML.addEventListener("content-loaded", () => {
  for(let ea of importHTML.shadowRoot.querySelectorAll("div")) {
  ea.appendChild(<span>{"DIV " + i++}</span>)
  }
})
</script>

## And import the same again...

![](../../src/parts/ConnectorExample.html)
