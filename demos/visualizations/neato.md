# GraphViz Neato


<script>
  var source = `digraph D {
  A[label="A"]
  B[label="B"]
  C[label="C"]
  
  A -> C;
  B -> C;
}
`;

(async () => {
  var graphviz =  await (<graphviz-dot> engine="neato"</graphviz-dot>)
  graphviz.setDotData(source)
  
  var style = document.createElement("style")
  style.textContent = `
    #source, #transformed {
      white-space: pre;
    }
  `
  
  var transformed =  Viz(source, {
    engine: "neato",
    format: "dot",
    totalMemory: 32 * 1024 * 1024 
  })
  
  return <div>
      {style}
      <div id="source">{source}</div>
      <div id="transformed">{transformed}</div>
      {graphviz}
    </div>
})()
</script>

## And now feed it back

And it works... we can replace the positions of A and B. And it will be rendered differently.

<script>
  var source = `digraph D {
	graph [bb="0,0,196.73,48.615"];
	node [label="\N"];
	A	 [height=0.5,
		label=A,
		pos="169.73,30.615",
		width=0.75];
	C	 [height=0.5,
		label=C,
		pos="98.597,18",
		width=0.75];
	A -> C	 [];
	B	 [height=0.5,
		label=B,
		pos="27,27.713",
		width=0.75];
	B -> C	 [];
}`;

(async () => {
  var graphviz =  await (<graphviz-dot engine="neato"></graphviz-dot>)
  graphviz.setDotData(source)
  
  var style = document.createElement("style")
  style.textContent = `
    #source, #transformed {
      white-space: pre;
    }
  `

  return <div>
      {style}
      <div id="source">{source}</div>
      {graphviz}
    </div>
})()
</script>


