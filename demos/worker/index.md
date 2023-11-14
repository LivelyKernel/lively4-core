# Web Worker in Lively4

Worker, worker, worker... and which one is the real worker?

Problem: There are too many modules in  Lively4 that have "worker" in the name, can we change this? Are they all needed? How do they work together?

<script>
  // setup
  async function fileEditor(fileName) {
    let editor = await (<lively-editor></lively-editor>)
    editor.setURL(lively4url + fileName)
    editor.loadFile()
    return editor
  }
  ""
</script>

## Classic Webworker


### Client Code


<script>fileEditor("/demos/worker/sum-client.js")</script>

### Worker

<script>fileEditor("/demos/worker/sum-worker.js")</script>

## SystemJS Worker

Since we are not in Kansas any more... we have no lively or systemjs on the worker side (yet). 

### Client code


<script>fileEditor("/demos/worker/sum-systemjs-client.js")</script>

### Worker

<script>fileEditor("/demos/worker/sum-systemjs-worker.js")</script>


## Hide onmessage and postMessage 

In <edit://src/babylonian-programming-editor/worker/babylonian-manager.js> and it's worker <edit://src/babylonian-programming-editor/worker/babylonian-worker.js>, the actual webworker is hidden with a promised method call...

