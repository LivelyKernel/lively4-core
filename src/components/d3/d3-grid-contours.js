import Morph from "src/components/widgets/lively-morph.js"
import D3Component from "./d3-component.js"
// import d3 from "src/external/d3.v5.js"
import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm";
import {tricontour} from "https://cdn.skypack.dev/d3-tricontour@1";
import { debounce } from "utils";
import "src/external/d3-selection-multi.v1.js"
// import { uuid } from 'utils'

/*MD ## links
- [https://stackoverflow.com/questions/44662862/d3-contour-or-surface-plot-from-irregular-scattered-data]()
- [https://github.com/d3/d3-contour]()
- [https://github.com/Fil/d3-tricontour]()
- [https://observablehq.com/@fil/tricontour-labels?collection=@fil/tricontours]()
- [https://gist.github.com/supereggbert/aff58196188816576af0]()
MD*/
var count = 0;

function uid(name) {
  return new Id("O-" + (name == null ? "" : name + "-") + ++count);
}

function Id(id) {
  this.id = id;
  this.href = new URL(`#${id}`, location) + "";
}

Id.prototype.toString = function() {
  return "url(" + this.href + ")";
};

const degrees = 180 / Math.PI;

const Tooltip = {
  show(event,d) {
    const [x, y, value] = d;
    this.removeTip()
    this.tip = <div style={`
position: absolute;
text-align: center;
padding: 2px;
font: 12px sans-serif;
background: lightsteelblue;
border: solid darkgray 1px;
z-index: 100000;
border-radius: 2px;
pointer-events: none;
opacity: .9;
`}>{x}, {y} -> <b>{(value * 100).round() / 100}</b></div>;
    
    this.tip.style.left = event.pageX + "px"
    this.tip.style.top = event.pageY - 30 + "px"
    this.remover = this.remover || ::this.hide.debounce(5000);
    this.remover(d)
    
    document.body.append(this.tip)
  },
  
  hide(d) {
    lively.notify('hide')
    this.remover = undefined
    this.removeTip()
  },
  
  removeTip() {
    if (this.tip) {
      this.tip.remove()
      this.tip = undefined
    }
  }
}

class Noise {
  static lerp(t, a, b) {
    return a + t * (b - a);
  }
  static grad2d(i, x, y) {
    const v = (i & 1) === 0 ? x : y;
    return (i & 2) === 0 ? -v : v;
  }
  constructor(octaves = 1) {
    this.p = new Uint8Array(512);
    this.octaves = octaves;
    this.init();
  }
  init() {
    for (let i = 0; i < 512; ++i) {
      this.p[i] = Math.random() * 256;
    }
  }
  noise2d(x2d, y2d) {
    const X = Math.floor(x2d) & 255;
    const Y = Math.floor(y2d) & 255;
    const x = x2d - Math.floor(x2d);
    const y = y2d - Math.floor(y2d);
    const fx = (3 - 2 * x) * x * x;
    const fy = (3 - 2 * y) * y * y;
    const p0 = this.p[X] + Y;
    const p1 = this.p[X + 1] + Y;
    return Noise.lerp(
      fy,
      Noise.lerp(
        fx,
        Noise.grad2d(this.p[p0], x, y),
        Noise.grad2d(this.p[p1], x - 1, y)
      ),
      Noise.lerp(
        fx,
        Noise.grad2d(this.p[p0 + 1], x, y - 1),
        Noise.grad2d(this.p[p1 + 1], x - 1, y - 1)
      )
    );
  }
  noise(x, y) {
    let e = 1,
        k = 1,
        s = 0;
    for (let i = 0; i < this.octaves; ++i) {
      e *= 0.5;
      s += e * (1 + this.noise2d(k * x, k * y)) / 2;
      k *= 2;
    }
    return s;
  }
}

const steps = ([1, 15], 15)
const ticks = ([10, 20, 40], 20)
function addlabel(svg, text, xy, angle) {
  angle += Math.cos(angle) < 0 ? Math.PI : 0;

  svg
    .append("text")
    .attr("fill", "#fff")
    .attr("stroke", "none")
    .attr("text-anchor", "middle")
    .attr("dy", "0.3em")
    .attr("transform", `translate(${xy})rotate(${angle * degrees})`)
    .text(text)
    .style("font-size", "12px");
}

export default class D3GridContoursChart extends D3Component {

  generateNoiseData(maxX = 500, maxY = 500) {
    const noise = new Noise(2);
    const p = 0.003; // freq
    return Array.from({ length: 3000 }, () => {
      const x = Math.random() * maxX,
            y = Math.random() * maxY,
            z = 40 + 220 * noise.noise(p * x, p * y);
      return [x, y, z];
    });
  }
  
  async updateViz() {
    const margin = {
      left: 100,
      right: 20,
      top: 20,
      bottom: 60,
    }
    
    var { x: ownWidth, y: ownHeight } = lively.getExtent(this)
    var width = ownWidth - margin.left - margin.right;
    var height = ownHeight - margin.top - margin.bottom;

    const data = this.data || this.generateNoiseData(100, 100)

    const colorForDots = d3
      .scaleSequential((t) => d3.interpolateSpectral(1 - t))
      .domain(d3.extent(data, (d) => d[2]))
    const color = colorForDots.copy().nice()

    const thresholds = color.ticks(ticks)


    const path = d3.geoPath();
    const contours = tricontour();

    this.get("svg").innerHTML = ""
    const svg = d3
      .select(this.get("svg"))
      .style("display", "block")
      .style("margin", "0 -14px")
      .style("width", width + margin.left + margin.right)
      .style("height", height + margin.top + margin.bottom)
    .append("g")
      .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    // set the ranges
    var x = d3.scaleLinear().range([0, width]);
    var y = d3.scaleLinear().range([height, 0]);
    // Scale the range of the data
    x.domain(d3.extent(data, d => d[0]));
    y.domain([0, d3.max(data, d => d[1])]);

    // Add the x Axis
    svg.append("g")
        .attr("transform", "translate(0," + height + ")")
        .call(d3.axisBottom(x));

    const labelX = this.options.labelX;
    if (labelX) {
     // text label for the x axis
    svg.append("text")             
        .attr("transform",
              "translate(" + (width/2) + " ," + 
                             (height + margin.top + 20) + ")")
        .style("text-anchor", "middle")
        .text(labelX);
    }

    // Add the y Axis
    svg.append("g")
        .call(d3.axisLeft(y));

    const labelY = this.options.labelY;
    if (labelY) {
      // text label for the y axis
      svg.append("text")
        .attr("transform", "rotate(-90)")
        .attr("y", 0 -  margin.left / 2)
        .attr("x", 0 - height / 2)
        .attr("dy", "1em")
        .style("text-anchor", "middle")
        .text(labelY);
    }
    
    const defs = svg.append("defs"),
      wrap = svg.append("g"),
      g = wrap.append("g"),
      labels_g = wrap.append("g");

    for (const threshold of thresholds) {
      let mask_id = uid(),
        mask = defs.append("mask").attr("id", mask_id.id);
      mask
        .append("rect")
        .attr("width", width)
        .attr("height", height)
        .attr("fill", "white");

      // scale domain for contours as well
      const cont = contours.contour(data.map(([_x, _y, v]) => [x(_x), y(_y), v]), threshold);

      g.append("path")
        .attr("id", `fill-${threshold}`)
        .attr("d", path(cont))
        .attr("fill", color(threshold));
      g.append("path")
        .attr("id", `stroke-${threshold}`)
        .attr("d", path(cont))
        .attr("stroke", "white")
        .attr("fill", "none")
        .attr("stroke-width", 1.5)
        .attr("stroke-opacity", threshold % 5 === 0 ? 1 : 0.3)
        .attr("mask", mask_id);
      if (threshold % 10 === 0) {
        for (const polygon of cont.coordinates) {
          for (const [j, ring] of polygon.entries()) {
            const p = ring.slice(1, Infinity),
              // best number of steps to divide ring.length
              possibilities = d3.range(steps, steps * 1.4),
              scores = possibilities.map((d) => -((p.length - 1) % d)),
              n = possibilities[d3.scan(scores)],
              // best starting point: bottom for first rings, top for holes
              start =
                1 + (d3.scan(p.map((xy) => (j === 0 ? -1 : 1) * xy[1])) % n),
              margin = 2;

            for (const [i, xy] of p.entries()) {
              if (
                i % n === start &&
                xy[0] > margin &&
                xy[0] < width - margin &&
                xy[1] > margin &&
                xy[1] < height - margin
              ) {
                const a = (i - 2 + p.length) % p.length,
                  b = (i + 2) % p.length,
                  dx = p[b][0] - p[a][0],
                  dy = p[b][1] - p[a][1];
                if (dx === 0 && dy === 0) return;

                // add the label's contour to the path stroke clip
                mask
                  .append("circle")
                  .attr("r", 13)
                  .attr("fill", "black")
                  .attr("transform", `translate(${xy})`);

                addlabel(labels_g, `${threshold}`, xy, Math.atan2(dy, dx));
              }
            }
          }
        }
      }
    }
    // return;
    // Add the scatterplot
    svg.selectAll("dot")
      .data(data)
    .enter().append("circle")
      .attr("r", 5)
      .attr("cx", d => x(d[0]))
      .attr("cy", d => y(d[1]))
      .attr("fill", d => colorForDots(d[2]))
      .attr("opacity", 1)
      .attr('stroke-width', .1)
      .attr('stroke', 'black')
    .on("mouseover", function(event,d) {
      Tooltip.show(event, d)
    })
    .on("mouseout", function(d) {
      // Tooltip.hide(d)
    });
    
  }
  
  async initialize() {
    this.options = this.options || {}
    this.loaded = new Promise(async (resolve) => {
      this.updateViz()
      this.addEventListener('extent-changed', ((evt) => {
        this.onExtentChanged(evt);
      })::debounce(500));

      resolve()
    })
    
    this.zoom = false
  }
  
  onExtentChanged() {
    this.updateViz()
  }

  async livelyExample() {
    await this.loaded
    this.config({
      labelX: 'labelX',
      labelY: 'labelY',
    });
    this.setData(this.generateNoiseData())
    this.updateViz() 
  }
  
  livelyMigrate(other) {
    this.options = other.options
    this.setData(other.getData())
  }

}
