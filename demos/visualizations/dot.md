# GraphViz Dot



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
  var graphviz =  await (<graphviz-dot></graphviz-dot>)
  graphviz.setDotData(source)
  
  var style = document.createElement("style")
  style.textContent = `
    #source, #transformed {
      white-space: pre;
    }
  `
  
  var transformed =  Viz(source, {
    engine: "dot",
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


<script>
  var source = `digraph D {
	graph [bb="0,0,126,108"];
	node [label="\N"];
	A	 [height=0.5,
		label=A,
		pos="27,90",
		width=0.75];
	C	 [height=0.5,
		label=C,
		pos="63,18",
		width=0.75];
	A -> C	 [pos="e,54.366,35.269 35.715,72.571 39.96,64.081 45.154,53.693 49.866,44.267"];
	B	 [height=0.5,
		label=B,
		pos="99,90",
		width=0.75];
	B -> C	 [pos="e,71.634,35.269 90.285,72.571 86.04,64.081 80.846,53.693 76.134,44.267"];
}`;

(async () => {
  var graphviz =  await (<graphviz-dot></graphviz-dot>)
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


## Can we flip A and B?


<script>
  var source = `digraph D {
	graph [bb="0,0,126,108"];
	node [label="\N"];
	A	 [height=0.5,
		label=Ax,
		pos="99,90",
		width=0.75];
	C	 [height=0.5,
		label=C,
		pos="63,18",
		width=0.75];
	A -> C	 [];
	B	 [height=0.5,
		label=Bx,
		pos="27,90",
		width=0.75];
	B -> C	 [];
}`;

(async () => {
  var graphviz =  await (<graphviz-dot></graphviz-dot>)
  graphviz.setDotData(source)
  
  var style = document.createElement("style")
  style.textContent = `
    #source {
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




