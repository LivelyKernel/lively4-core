import Morph from 'src/components/widgets/lively-morph.js';
import { uuid, getTempKeyFor, fileName, hintForLabel, asDragImageFor } from 'utils';
import d3 from 'src/external/d3.v3.js';
import './d3-box.js';

/*MD # D3 Boxplot 

![](d3-boxplot.png){height=300px}

MD*/

export default class D3Boxplot extends Morph {
  get svgParent() { return this.get("#charts"); }
  
  async initialize() {
    this.windowTitle = "D3 Boxplot";
  }
  display(data, config = {}) {
    this.data = data;
    this.config = config;

    let boxPlot = (data, {
      title = 'title',
      xAxisLabel = 'xAxisLabel',
      labelAccessor = 'label',
      dataPointsAccessor = 'dataPoints',
      min= data.reduce((acc, dat) => Math.min(acc, dat[dataPointsAccessor].reduce((acc, num) => Math.min(acc, num), Infinity
      )), Infinity),
      max = data.reduce((acc, dat) => Math.max(acc, dat[dataPointsAccessor].reduce((acc, num) => Math.max(acc, num), -Infinity
      )), -Infinity),
      margin = {top: 30, right: 10, bottom: 110, left: 60},
      width = 800 - margin.left - margin.right,
      height = 450 - margin.top - margin.bottom,
      yAxisText = "Execution Time in ms",
      numberOfElementsPerChunk = 0,
      yTickCount = 4,
      xAxisLabelOffset = 50,
      showLabels = true
    }) => {
      let chart = d3.box()
        .whiskers(iqr(1.5))
        .height(height)
        .domain([min, max])
        .showLabels(showLabels)
        .dataPointsAccessor(dataPointsAccessor);

      let svg = d3.select(this.svgParent).append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .attr("class", "box")
        .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

      // the x-axis
      let x = d3.scale.ordinal()
        .domain(data.map((d, i) => i))
        .rangeRoundBands([0, width], 0.7, 0.3);
      let xAxisLabels = x.copy()
        .range(data.map(d => d[labelAccessor]));
      let xAxisLabelScale = x.copy()
        .rangeRoundBands([0, width], 0.1, 0.05);

      let xAxis = d3.svg.axis()
        .scale(x)
        .orient("bottom")
        .tickFormat(d => xAxisLabels(d));

      // the y-axis
      let y = d3.scale.linear()
        .domain([min, max])
        .range([height + margin.top, 0 + margin.top]);

      let yAxis = d3.svg.axis()
        .scale(y)
        .orient("left");

      let xAxisOffset = 10;
      let xAxisPosition = height + margin.top + xAxisOffset;

      // separator
      if(numberOfElementsPerChunk > 0) {
        let make_x_axis = () => d3.svg.axis()
          .scale(x)
          .orient("bottom");

        svg.append("g")
          .attr("class", "separator")
          .attr("transform", `translate(${(x.range()[1] - x.range()[0]) * numberOfElementsPerChunk / 2}, ${xAxisPosition}), scale(${numberOfElementsPerChunk},1)`)
          .call(make_x_axis()
            .tickSize(-(height + xAxisOffset), 0, 0)
            .tickFormat("")
          );
      }

      // horizontal lines
      let make_y_axis = () => d3.svg.axis()
        .scale(y)
        .orient("left")
        .ticks(yTickCount);

      svg.append("g")
        .attr("class", "tickLines")
        .call(make_y_axis()
          .tickSize(-width, 0, 0)
          .tickFormat("")
        );

      // draw the boxplots
      svg.selectAll(".box")
        .data(data)
        .enter().append("g")
        .attr('class', 'selectable-group')
        // .style("width", "100px")
        // .style("height", "100px")
        // .style("background-color", "blue")
        .attr("transform", (d, i) => `translate(${x(i)},${margin.top})`)
        .each(function(d) {
          this.__vivideObjectAccessor__ = d.__vivideObjectAccessor__;
        })
        .call(chart.width(x.rangeBand()));

      // add a title
      svg.append("text")
        .attr("x", (width / 2))
        .attr("y", 0 + (margin.top / 2))
        .attr("text-anchor", "middle")
        .style("font-size", "18px")
        //.style("text-decoration", "underline")
        .text(title);

      // draw y axis
      svg.append("g")
        .attr("class", "y axis")
        .call(yAxis)
        .append("text") // and text1
        .attr("transform", "rotate(-90)")
        .attr("x", -height / 2 - margin.bottom / 2)
        .attr("y", -55)
        .attr("dy", ".71em")
        .style("text-anchor", "middle")
        .style("font-size", "18px")
        .text(yAxisText);

      // wrapping long labels: https://bl.ocks.org/mbostock/7555321
      let wrap = (text, width) => {
        text.each(function() {
          let text = d3.select(this);
          let words = text.text().split(/\s+/).reverse();
          let word;
          let line = [];
          let lineNumber = 0;
          let lineHeight = 1.1; // ems
          let y = text.attr("y");
          let dy = parseFloat(text.attr("dy"));
          let tspan = text.text(null).append("tspan").attr("x", 0).attr("y", y).attr("dy", dy + "em");
          while (word = words.pop()) {
            line.push(word);
            tspan.text(line.join(" "));
            if (tspan.node().getComputedTextLength() > width) {
              line.pop();
              tspan.text(line.join(" "));
              line = [word];
              tspan = text.append("tspan")
                .attr("x", 0)
                .attr("y", y)
                .attr("dy", ++lineNumber * lineHeight + dy + "em")
                .text(word);
            }
          }
        });
      }

      svg.append("g")
        .attr("class", "x axis")
        .attr("transform", `translate(0,${xAxisPosition})`)
        .call(xAxis)
        .selectAll("text")
        .call(wrap, xAxisLabelScale.rangeBand());

      /*
      // draw x axis
      var xxxAxis = svg.append("g")
        .attr("class", "x axis")
        .call(xAxis);
      //xxxAxis.selectAll("text")
      //  .attr("y", 0)
      //  .attr("x", -7)
      //  .attr("dy", ".35em")
      //  .attr("transform", "rotate(-90)")
      //  .style("text-anchor", "end");
      */
      svg.append("g").append("text")             // text label for the x axis
        .attr("transform", "translate(0," + xAxisPosition + ")")
        .attr("x", (width / 2))
        .attr("y", xAxisLabelOffset)
        .attr("dy", ".71em")
        .style("text-anchor", "middle")
        .style("font-size", "18px")
        .text(xAxisLabel);
    }

    // Returns a function to compute the interquartile range.
    function iqr(k) {
      return (d, i) => {
        var q1 = d.quartiles[0],
            q3 = d.quartiles[2],
            iqr = (q3 - q1) * k,
            i = -1,
            j = d.length;
        while (d[++i] < q1 - iqr);
        while (d[--j] > q3 + iqr);
        return [i, j];
      };
    }

    boxPlot(data, config);
  }
  
  livelyExample() {
    lively.success('run example')
    this.display([{
      label: "Interpretation",
      dataPoints: [549.2750000000015,535.8549999999959,583.5299999999988,526.7900000000009,624.2300000000032,524.114999999998,616.3950000000041,527.7749999999942,627.2099999999991,517.3099999999977,553.1100000000006,635.875,540.3399999999965,549.739999999998,653.7700000000041,544.1849999999977,536.4950000000026,531.5250000000015,615.314999999995,537.4100000000035,521.9099999999962,672.3250000000044,518.135000000002,525.5250000000087,541.1100000000006,671.1800000000003,549.2299999999959,543.1599999999962,545.625,688.8899999999994,539.0799999999945,528.8949999999968,531.8249999999971,537.6949999999997,682.2249999999913,533.5699999999997,533.2750000000015,533.6299999999974,561.75,671.9000000000015,533.5800000000017,545.070000000007,551.4800000000032,603.4249999999884,675.489999999998,564.1049999999959,548.044999999991,549.7800000000061,560.8700000000026,649.3899999999994,645.2250000000058,553.4800000000032,537.9849999999933,571.2050000000017,556.4650000000038,629.8549999999959,639.8099999999977,547.0850000000064,553.8600000000006,538.1350000000093,545.6350000000093,651.0200000000041,674.7199999999866,556.5800000000017,569.9049999999988,569.1999999999971,540.3450000000012,656.3249999999971,690.9150000000081,541.1700000000128,539.0899999999965,574.1599999999889,558.7099999999919,643.9600000000064,707.4349999999977,548.1150000000052,554.4000000000087,547.7200000000012,559.5250000000087,691.4749999999913,683.9900000000052,529.4250000000029,569.6000000000058,549.6300000000047,545.3999999999942,671.9049999999988,704.3800000000047,564.0500000000029,563.7550000000047,565.1949999999924,582.1349999999948,750.3700000000099,650.9150000000227,568.3800000000047,556.5050000000047,551.3149999999878,552.5149999999994,816.7999999999884,585.5600000000122,593.1699999999983]
      },
      {
        label: "Rewriting",
        dataPoints: [5.000000000014552,22.50999999999476,6.8549999999959255,13.329999999987194,5.839999999981956,6.704999999987194,5.960000000006403,24.330000000001746,5.210000000006403,4.585000000006403,3.6200000000098953,17.039999999993597,3.6150000000052387,3.654999999998836,3.625,3.6900000000023283,15.71500000001106,3.599999999991269,3.6199999999953434,3.6450000000186265,3.60999999998603,15.930000000022119,3.665000000008149,3.5749999999970896,3.5500000000029104,3.710000000006403,15.845000000001164,3.6049999999959255,3.5749999999970896,3.5449999999982538,3.7250000000058208,16.054999999993015,3.6599999999889405,3.625,3.6150000000052387,3.610000000000582,3.6900000000023283,3.625,3.6450000000040745,3.64000000001397,16.245000000009895,3.6499999999796273,3.650000000008731,3.639999999999418,3.6699999999982538,16.285000000003492,3.64000000001397,3.554999999993015,3.60999999998603,3.6300000000046566,16.470000000001164,3.6900000000023283,3.639999999999418,3.554999999993015,3.6200000000098953,16.360000000000582,3.695000000006985,3.650000000008731,3.5899999999965075,3.664999999993597,16.54999999998836,3.6600000000034925,3.610000000000582,3.6349999999947613,3.584999999991851,3.6450000000186265,3.6499999999941792,3.6449999999895226,3.650000000008731,16.745000000009895,3.6050000000104774,3.6900000000023283,3.625,3.654999999998836,16.745000000009895,3.7449999999953434,3.570000000021537,3.6149999999906868,3.664999999993597,16.830000000016298,3.7299999999813735,3.5649999999877764,3.540000000008149,3.650000000008731,17.00999999999476,3.695000000006985,3.664999999993597,3.6200000000098953,3.6449999999895226,16.970000000001164,3.654999999998836,3.639999999999418,3.679999999993015,3.6600000000034925,3.665000000008149,3.6550000000133878,3.6349999999947613,3.6199999999953434,17.260000000009313,3.6350000000093132]
      },
      {
        label: "Tiny Values but a very long label. Hm, so long that it needs to be trimmed!",
        dataPoints: [1.3550000000104774,0.5350000000034925,0.4900000000052387,1.3650000000052387,0.5350000000034925,0.6349999999947613,0.4950000000098953,0.4949999999953434,0.6449999999895226,0.8250000000116415,1.054999999993015,0.9450000000069849,0.9099999999889405,0.9199999999982538,0.7700000000040745,0.9450000000069849,0.9950000000098953,46.2949999999837,0.5850000000064028,0.5200000000186265,0.5150000000139698,0.5549999999930151,0.5700000000069849,0.6199999999953434,0.5749999999970896,0.5599999999976717,0.6599999999889405,0.6750000000029104,0.6799999999930151,0.5050000000046566,0.5350000000034925,0.5399999999935972,0.46500000001105946,0.5200000000040745,0.5499999999883585,0.7850000000180444,0.47499999999126885,0.4850000000005821,0.46499999999650754,0.4899999999906868,0.4299999999930151,0.4299999999930151,0.46500000001105946,0.5099999999947613,0.6600000000034925,0.4999999999854481,0.430000000007567,0.41999999999825377,0.5549999999784632,0.4450000000069849,0.45500000000174623,0.4400000000023283,0.45500000000174623,0.46499999999650754,0.5650000000168802,0.5400000000081491,0.4450000000069849,0.3700000000098953,0.3600000000005821,0.4250000000029104,0.3650000000052387,0.3600000000005821,0.3799999999901047,0.3600000000005821,0.3800000000046566,0.3600000000005821,0.3600000000005821,0.3600000000005821,0.3649999999906868,0.3600000000005821,0.3650000000052387,0.3649999999906868,0.3600000000005821,0.3649999999906868,0.3600000000005821,0.3650000000052387,0.3600000000005821,0.39500000000407454,0.3600000000005821,0.3600000000005821,0.3600000000005821,0.3650000000052387,0.3649999999906868,0.3600000000005821,18.30999999999767,0.34999999999126885,0.3399999999819556,0.33999999999650754,0.34000000001105946,0.33999999999650754,0.33500000000640284,0.33999999999650754,0.3349999999918509,0.34000000001105946,0.3349999999918509,0.39500000000407454,0.3349999999918509,0.33999999999650754,0.34499999998661224,0.33999999999650754]
    }], {
      title: 'Example Boxplot',
      xAxisLabel: 'testing names',
      labelAccessor: 'label',
      dataPointsAccessor: 'dataPoints'
    });
  }
  
  livelyMigrate(other) {
    lively.success('migrate boxplot');
    this.display(other.data, other.config);
  }
}
