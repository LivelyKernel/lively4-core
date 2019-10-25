## 2019-10-25


## RegEx pre-markdown parsing...

The old "lively-script" support in lively-markdown was somewhat shaky...

```javascript
    htmlSource = htmlSource
      .replace(/<script(.*)>/g,"<lively-script$1><script>")
      .replace(/<\/script>/g,"</script></lively-script>")
```

e.g. in our [graphviz demo](browse:doc/graphviz/index.md), the script would be transformed into a lively-script. But this should not happen here. 

```markdown
  
<graphviz-dot>
<script type="graphiviz">
digraph H {  
  node [fontname="Arial"];
  a -> b;
  a [shape="box" fontcolor=blue fontsize=31 color=gray style="filled" label="hello" height="1" width="3"];  
  b [shape="box"  label="w" height="2" color=red width="1"];
}
</script>
</graphviz-dot>

```

So, we had to rework the #RegExp magic:

### (A) Should *not* be transformed:

```javascript

`
foo

<script type="graphiviz">
xxx
yyy
</script>

bar
`.replace(/<script(.*)>((:?\n|.)*)<\/script>/gm, (original, args, content) =>          
          args.match(`type=`) ? original : `<lively-script${args}><script>${content}</script></lively-script>`)

```


### (B) Should be transformed

```javascript
`
foo

<script id="bla">
xxx
yyy
</script>

bar
`.replace(/<script(.*)>((:?\n|.)*)<\/script>/gm, (original, args, content) =>          
          args.match(`type=`) ? original : `<lively-script${args}><script>${content}</script></lively-script>`)
```