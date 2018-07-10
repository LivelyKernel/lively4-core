/**
For now a copy of the d3 labeler from https://github.com/tinker10/D3-Labeler, to be adjusted with our own functions
*/
import d3 from "src/external/d3.v5.js"

export default function() {
  var nodes = [],
      links = [],
      w = 900, // box width
      h = 500, // box width
      updateFunction = function() {},
      timeout = 0, // timeout between move operations
      graphAnneal = {};

  var max_move = 500.0;
  
   // weights
  var w_node_overlap = 30.0, // Node-overlap 
      w_edge_overlap = 30.0, // Edge-overlap
      w_edge_node_overlap = 10.0; // Edge-Node-overlap
  
  // booleans for user defined functions
  var user_energy = false,
      user_defined_energy,
      user_schedule = false,
      user_defined_schedule;

  var energy = function(index) {
  // energy function, to be tailored for node placement

    let v = nodes.length,
        e = links.length,
        ener = 0;
    
    for (let i = 0; i < e; i++) {
      for (let j = i + 1; j < e; j++) {
        // Penalty for edge intersection
        let x1 = links[i].source.x,
            x2 = links[i].target.x,
            y1 = links[i].source.y,
            y2 = links[i].target.y,
            x3 = links[j].source.x,
            x4 = links[j].target.x,
            y3 = links[j].source.y,
            y4 = links[j].target.y;
        
        if (intersect(x1, x2, x3, x4, y1, y2, y3, y4)) {
          ener += w_edge_overlap;
        } 
      }
    }
    
    for (let i = 0; i < e; i++) {
      for (let n = 0; n < v; n++) {
        // Penalty for edge-node intersection
        if (nodes[n] !== links[i].source && nodes[n] !== links[i].target) {
          let x1 = links[i].source.x,
              x2 = links[i].target.x,
              y1 = links[i].source.y,
              y2 = links[i].target.y,
              cx = nodes[n].x,
              cy = nodes[n].y,
              r = nodes[n].r;

          if (lineCircleIntersect(x1, x2, y1, y2, cx, cy, r)) {
            //ener += w_edge_node_overlap;
          } 
        }
      }
    }

    for (let i = 0; i < v; i++) {
      if (i != index) {
        // Penalty for node intersection
        var nx1 = nodes[index].x,
            ny1 = nodes[index].y,
            r1 = nodes[index].r,
            nx2 = nodes[i].x,
            ny2 = nodes[i].y,
            r2 = nodes[i].r;

        if (collision(nx1, ny1, r1, nx2, ny2, r2)) {
          ener += w_node_overlap; 
        }
      }

    }
    return ener;
  };
  
  var collision = function(p1x, p1y, r1, p2x, p2y, r2) {
    var a;
    var x;
    var y;

    a = r1 + r2;
    x = p1x - p2x;
    y = p1y - p2y;

    if ( a > Math.sqrt( (x*x) + (y*y) ) ) {
        return true;
    } else {
        return false;
    }   
  }

  var mcmove = function(currT) {
  // Monte Carlo translation move

      // select a random node
      var i = Math.floor(Math.random() * nodes.length); 

      // save old coordinates
      var x_old = nodes[i].x;
      var y_old = nodes[i].y;

      // old energy
      var old_energy;
      if (user_energy) {old_energy = user_defined_energy(i, nodes, links)}
      else {old_energy = energy(i)}

      // random translation
      nodes[i].x += (Math.random() - 0.5) * max_move;
      nodes[i].y += (Math.random() - 0.5) * max_move;

      // hard wall boundaries
      if (nodes[i].x > w) nodes[i].x = x_old;
      if (nodes[i].x < 0) nodes[i].x = x_old;
      if (nodes[i].y > h) nodes[i].y = y_old;
      if (nodes[i].y < 0) nodes[i].y = y_old;

      // new energy
      var new_energy;
      if (user_energy) {new_energy = user_defined_energy(i, nodes, links)}
      else {new_energy = energy(i)}

      // delta E
      var delta_energy = new_energy - old_energy;

      if (Math.random() >= Math.exp(-delta_energy / currT)) {
        // move back to old coordinates, else accept
        nodes[i].x = x_old;
        nodes[i].y = y_old;
      }

  };

  var intersect = function(x1, x2, x3, x4, y1, y2, y3, y4) {
  // returns true if two lines intersect, else false
  // from http://paulbourke.net/geometry/lineline2d/

    var mua, mub;
    var denom, numera, numerb;

    denom = (y4 - y3) * (x2 - x1) - (x4 - x3) * (y2 - y1);
    numera = (x4 - x3) * (y1 - y3) - (y4 - y3) * (x1 - x3);
    numerb = (x2 - x1) * (y1 - y3) - (y2 - y1) * (x1 - x3);

    /* Is the intersection along the the segments */
    mua = numera / denom;
    mub = numerb / denom;
    if (!(mua < 0 || mua > 1 || mub < 0 || mub > 1)) {
        return true;
    }
    return false;
  }
  
  var lineCircleIntersect = function(x1, x2, y1, y2, cx, cy, r) {
    var b, c, d, u1, u2, ret, retP1, retP2, v1, v2;
    v1 = {};
    v2 = {};
    v1.x = x2 - x1;
    v1.y = y2 - y1;
    v2.x = x1 - cx;
    v2.y = y1 - cy;
    b = (v1.x * v2.x + v1.y * v2.y);
    c = 2 * (v1.x * v1.x + v1.y * v1.y);
    b *= -2;
    d = Math.sqrt(b * b - 2 * c * (v2.x * v2.x + v2.y * v2.y - r * r));
    if(isNaN(d)){ // no intercept
        return [];
    }
    u1 = (b - d) / c;  // these represent the unit distance of point one and two on the line
    u2 = (b + d) / c;    
    if(u1 <= 1 && u1 >= 0 || u2 <= 1 && u2 >= 0)
      return true;
    return false;
  }

  var cooling_schedule = function(currT, initialT, nsweeps) {
  // linear cooling
    return (currT - (initialT / nsweeps));
  }

  graphAnneal.start = function(nsweeps) {
  // main simulated annealing function
    var m = nodes.length,
        currT = 1.0,
        initialT = 1.0;
    for (var i = 0; i < m; i++) {
      nodes[i].x = 0;
      nodes[i].y = 0;
    }
    
    function anneal(sweepsDone) {
      for (var i = 0; i < m; i++) { 
        mcmove(currT);
      }
      currT = cooling_schedule(currT, initialT, nsweeps);
      updateFunction();
      if (sweepsDone > 0) {
        setTimeout(() => anneal(sweepsDone - 1), 0);
      }
    }
    anneal(nsweeps);
    console.log(nodes, links)
  };

  graphAnneal.width = function(x) {
  // users insert graph width
    if (!arguments.length) return w;
    w = x;
    return graphAnneal;
  };

  graphAnneal.height = function(x) {
  // users insert graph height
    if (!arguments.length) return h;
    h = x;    
    return graphAnneal;
  };

  graphAnneal.nodes = function(x) {
  // users insert label positions
    if (!arguments.length) return nodes;
    nodes = x;
    return graphAnneal;
  };

  graphAnneal.links = function(x) {
  // users insert anchor positions
    if (!arguments.length) return links;
    links = x;
    return graphAnneal;
  };

  graphAnneal.alt_energy = function(x) {
  // user defined energy
    if (!arguments.length) return energy;
    user_defined_energy = x;
    user_energy = true;
    return graphAnneal;
  };

  graphAnneal.alt_schedule = function(x) {
  // user defined cooling_schedule
    if (!arguments.length) return  cooling_schedule;
    user_defined_schedule = x;
    user_schedule = true;
    return graphAnneal;
  };
  
  graphAnneal.updateFunction = function(x) {
  // user defined callback for node updates
    if (!arguments.length) return  updateFunction;
    updateFunction = x;
    return graphAnneal;
  };
  
  graphAnneal.timeout = function(x) {
  // user defined timeout between annealing
    if (!arguments.length) return  timeout;
    timeout = x;
    return graphAnneal;
  };

  return graphAnneal;
}
