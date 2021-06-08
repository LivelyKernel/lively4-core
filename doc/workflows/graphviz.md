# GraphViz


## GraphViz Documentation

- [Shapes](http://www.graphviz.org/doc/info/shapes.html)
- [Attributes](http://www.graphviz.org/doc/info/attrs.html)


"The geometry and style of all node shapes are affected by the node attributes fixedsize, fontname, fontsize, height, label, style and width."
  - "**height** Height of node, in inches. This is taken as the initial, minimum height of the node. If fixedsize is true, this will be the final height of the node. Otherwise, if the node label requires more height to fit, the node's height will be increased to contain the label. Note also that, if the output format is dot, the value given to height will be the final value.<br>
If the node shape is regular, the width and height are made identical. In this case, if either the width or the height is set explicitly, that value is used. In this case, if both the width or the height are set explicitly, the maximum of the two values is used. If neither is set explicitly, the minimum of the two default values is used."
  - 1 inch == 72pt 
  - 0.75pt == 1px ??
  
<graphviz-dot>
<script type="graphviz">
digraph H {  
  node [fontname="Arial"];
  a -> b;
  a [shape="box" fontcolor=blue fontsize=31 color=gray style="filled" label="hello" height="1" width="3"];  
  b [shape="box"  label="w" height="2" color=red width="1"];
}
</script>
</graphviz-dot>

