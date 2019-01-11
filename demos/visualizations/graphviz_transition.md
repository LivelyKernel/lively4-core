# GraphViz Transition



<script>
  (async () => {
    var vis = await (<d3-graphviz style="width:1200px, height: 800px"></d3-graphviz>)
    await vis.loaded 
   

var dots = [
    [
        'digraph  {',
        '    node [style="filled"]',
        '    a [fillcolor="#d62728"]',
        '    b [fillcolor="#1f77b4"]',
        '    a -> b',
        '}'
    ],
    [
        'digraph  {',
        '    node [style="filled"]',
        '    a [fillcolor="#d62728"]',
        '    c [fillcolor="#2ca02c"]',
        '    b [fillcolor="#1f77b4"]',
        '    a -> b',
        '    a -> c',
        '}'
    ],
    [
        'digraph  {',
        '    node [style="filled"]',
        '    a [fillcolor="#d62728"]',
        '    b [fillcolor="#1f77b4"]',
        '    c [fillcolor="#2ca02c"]',
        '    a -> b',
        '    a -> c',
        '}'
    ],
    [
        'digraph  {',
        '    node [style="filled"]',
        '    a [fillcolor="#d62728", shape="box"]',
        '    b [fillcolor="#1f77b4", shape="parallelogram"]',
        '    c [fillcolor="#2ca02c", shape="pentagon"]',
        '    a -> b',
        '    a -> c',
        '    b -> c',
        '}'
    ],
    [
        'digraph  {',
        '    node [style="filled"]',
        '    a [fillcolor="yellow", shape="star"]',
        '    b [fillcolor="yellow", shape="star"]',
        '    c [fillcolor="yellow", shape="star"]',
        '    a -> b',
        '    a -> c',
        '    b -> c',
        '}'
    ],
    [
        'digraph  {',
        '    node [style="filled"]',
        '    a [fillcolor="#d62728", shape="triangle"]',
        '    b [fillcolor="#1f77b4", shape="diamond"]',
        '    c [fillcolor="#2ca02c", shape="trapezium"]',
        '    a -> b',
        '    a -> c',
        '    b -> c',
        '}'
    ],
    [
        'digraph  {',
        '    node [style="filled"]',
        '    a [fillcolor="#d62728", shape="box"]',
        '    b [fillcolor="#1f77b4", shape="parallelogram"]',
        '    c [fillcolor="#2ca02c", shape="pentagon"]',
        '    a -> b',
        '    a -> c',
        '    b -> c',
        '}'
    ],
    [
        'digraph  {',
        '    node [style="filled"]',
        '    a [fillcolor="#d62728"]',
        '    b [fillcolor="#1f77b4"]',
        '    c [fillcolor="#2ca02c"]',
        '    a -> b',
        '    a -> c',
        '    c -> b',
        '}'
    ],
    [
        'digraph  {',
        '    node [style="filled"]',
        '    b [fillcolor="#1f77b4"]',
        '    c [fillcolor="#2ca02c"]',
        '    c -> b',
        '}'
    ],
    [
        'digraph  {',
        '    node [style="filled"]',
        '    b [fillcolor="#1f77b4"]',
        '}'
    ],
];

  
  await vis.setDotData("digraph {}")  // #TODO ensure graphviz

function render() {
    var dotLines = dots[dotIndex];
    var dot = dotLines.join('');
    graphviz
        .renderDot(dot)
        .on("end", function () {
            dotIndex = (dotIndex + 1) % dots.length;            
            render();
        });
}
     
var dotIndex = 0;
var graphviz = vis.graphviz
    .transition(() => {
        return vis.d3.select(vis.get("#graph")).transition("main") // #Important, the transition must select the root in the shadow...
            .ease(vis.d3.easeLinear)
            .delay(500)
            .duration(3500);
})
    // .logEvents(true)
    .on("initEnd", render);

render()    
    return vis
  })()
</script>