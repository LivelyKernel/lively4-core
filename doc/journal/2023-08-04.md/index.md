## 2023-08-04 D3 Contour Plots!
*Author: @onsetsu*

<script>
  // additions per version
  
  let chart = await lively.create("d3-grid-contours")
  chart.style.width = "600px"
  chart.style.height = "500px"
  await chart.loaded
  

  
  chart.config({
    labelX: 'x',
    labelY: 'y',
  })
  debugger
  let data = chart.generateNoiseData(300, 300)
  chart.setData(data);

  // chart.style.height = chart.get("svg").getBBox().height + "px";
  

  (<div style='border: 1px solid red;'>{chart}</div>);
</script>

