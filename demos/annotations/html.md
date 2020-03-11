# HTML Annotations


<div id="root" style="background-color: lightgray"><h2>Hello <i>World</i></h2>
<ul><li>foo</li><li>bar</li></ul>
</div>

<script>
import {AnnotatedText, Annotation, default as AnnotationSet} from "src/client/annotations.js"
var root = lively.query(this, "#root")


function annotateInDOM(node, annotation, pos=0, parent) {
  if (node instanceof Text) {
    var from = pos
    var to = from + node.length
    var intersection = annotation.intersectRegion({from, to})
    if (intersection && parent) {
      // lively.notify("replace from " + intersection.from  + " to " + intersection.to)
      var s = node.textContent
      var a  = intersection.from - pos
      var b  = intersection.to - pos
      parent.insertBefore(new Text(s.slice(0, a )), node)
      var style = `text-decoration-color: ${annotation.color};`
      var replacement = <u style={style}>{s.slice(a, b)}</u>
      parent.insertBefore(replacement, node)
      var rest = new Text(s.slice(b, s.length))
      parent.insertBefore(rest, node)
      node.remove()
    }
    pos = to
  } else {
    for(var ea of Array.from(node.childNodes)) {
      pos = annotateInDOM(ea, annotation, pos,  node)
    }
  }
  return pos
}

annotateInDOM(root, new Annotation({from: 0, to: 8, color: "red"}))
annotateInDOM(root, new Annotation({from: 8, to: 20, color: "green"}))

undefined
</script>


Based on some replace regular expressions code our Markdown module, we can do the following:


```javascript

function annotateInDOM(node, annotation, pos=0, parent) {
  if (node instanceof Text) {
    var from = pos
    var to = from + node.length
    var intersection = annotation.intersectRegion({from, to})
    if (intersection && parent) {
      // lively.notify("replace from " + intersection.from  + " to " + intersection.to)
      var s = node.textContent
      var a  = intersection.from - pos
      var b  = intersection.to - pos
      parent.insertBefore(new Text(s.slice(0, a )), node)
      var style = `text-decoration-color: ${annotation.color};`
      var replacement = <u style={style}>{s.slice(a, b)}</u>
      parent.insertBefore(replacement, node)
      var rest = new Text(s.slice(b, s.length))
      parent.insertBefore(rest, node)
      node.remove()
    }
    pos = to
  } else {
    for(var ea of Array.from(node.childNodes)) {
      pos = annotateInDOM(ea, annotation, pos,  node)
    }
  }
  return pos
}
```

## And now with Annotation API


# HTML Annotations

<div id="root2" style="background-color: lightgray"><h2>Hello <i>World</i></h2>
<ul><li>foo</li><li>bar</li></ul>
</div>

<script>
import {AnnotatedText, Annotation, default as AnnotationSet} from "src/client/annotations.js"
var root2 = lively.query(this, "#root2")


new Annotation({from: 0, to: 8, color: "blue"}).annotateInDOM(root2)
new Annotation({from: 8, to: 20, color: "yellow"}).annotateInDOM(root2)

undefined
</script>


And we can add this to our Annotations API:

```javascript

new Annotation({from: 0, to: 8, color: "blue"}).annotateInDOM(root2)

```

