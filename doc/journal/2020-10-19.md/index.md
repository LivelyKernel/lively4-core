## 2020-10-19  Our Papers per Year  #MicrosoftAcademic
*Author: @JensLincke*


<script>
import Chart from 'src/external/chart.js';
var canvas = <canvas></canvas>
var ctx = canvas.getContext('2d');
(async () => {
  var json  = await lively.files.loadJSON("academic://hist:Composite(AA.AuId=2154319088)?count=100&attr=Y")

  var hist = json.histograms[0].histogram
  hist = hist.sortBy(ea => ea.value)


  var myChart = new Chart(ctx, {
    type: 'bar',
    data: {
        labels: hist.map(ea => ea.value),
        datasets: [{
            label: 'Papers per Year',
            data: hist.map(ea => ea.count),
            borderWidth: 1
        }]
    },
    options: {
        scales: {
            yAxes: [{
                ticks: {
                    beginAtZero: true
                }
            }]
        }
    }
});
}).defer(100)
canvas
</script>

## And we made a button for it!

<academic://expr:Composite(AA.AuId=2055148755)?count=1000>

![](academic_histogram.png)