# Zhang Shasha Tree Edit Distance 


<script>

import {distance, mapping} from "src/external/tree-edit-distance/zhang-shasha.js"


var a = {
  label: 'a',
  children: [
    {label: 'b', children: []},
    {label: 'c', children: []}
  ]
}

var b = {
  label: 'a',
  children: [
    {label: 'b', children: []}
  ]
}
try {
var result = <div>
  <h3>A</h3>
  <div style="white-space: pre"> {JSON.stringify(a)}</div>
  <h3>B</h3>
  <div style="white-space: pre">{JSON.stringify(b)}</div>
 
  <div><h3>distance:</h3> {distance(a, b)}</div>
  <h3>mapping:</h3>
  <div style="white-space: pre"> {mapping(a, b).map(ea => ea.type + " " 
    + ea.t1.label + " "+  (ea.t2 ? ea.t2.label : ""))}</div>
</div>
} catch(e) {
  debugger
  throw e
}

result
</script>