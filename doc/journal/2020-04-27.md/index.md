## 2020-04-27
*Author: @JensLincke*

## GraphViz Dot Minimal non UI example


```
// https://github.com/mdaines/viz.js/wiki/API#render-options
async function graphviz(source) {
    if (!window.Viz) {
        await lively.loadJavaScriptThroughDOM("GraphViz", lively4url + "/src/external/viz.js", true)
      }
  
  let options = {
    engine: "neato",
    format: "dot",
    totalMemory: 32 * 1024 * 1024 
  }
  return window.Viz(source, options)
}

graphviz(`digraph {
      a -> b
      b -> c
      c -> a}`)
```