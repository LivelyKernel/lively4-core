/**
Provides functionality for layouting a graph using simulated annealing, inspired by https://github.com/tinker10/D3-Labeler
*/

export default function() {
  var nodes = [],
      links = [],
      w = 900, // box width
      h = 500, // box width
      updateFunction = function() {},
      sweepsPerStep = 1000, 
      graphAnneal = {};
  
   // weights
  var w_node_overlap = 30.0, // Node-overlap 
      w_edge_overlap = 30.0, // Edge-overlap
      w_edge_node_overlap = 30.0, // Edge-Node-overlap
      w_edge_length = 0.1,
      node_overlap = true,
      edge_overlap = true,
      edge_node_overlap = true,
      edge_length = true,
      tolerate_line = 20;
  
  var energy = function() {
  // energy function to evaluate fitness of graph state

    let v = nodes.length,
        e = links.length,
        ener = 0;
    
    if (edge_overlap) {
    // Penalty for edge intersection
      for (let i = 0; i < e; i++) {
        let changedEdge = links[i];        
        for (let j = 0; j < e; j++) {
          if (j !== i && changedEdge.source.id !== links[j].source.id
             && changedEdge.source.id !== links[j].target.id
             && changedEdge.target.id !== links[j].source.id
             && changedEdge.target.id !== links[j].target.id) {
            let x1 = changedEdge.source.x,
                x2 = changedEdge.target.x,
                y1 = changedEdge.source.y,
                y2 = changedEdge.target.y,
                x3 = links[j].source.x,
                x4 = links[j].target.x,
                y3 = links[j].source.y,
                y4 = links[j].target.y;

            if (intersect(x1, x2, x3, x4, y1, y2, y3, y4)) {
              ener += w_edge_overlap;
            } 
          }
        }
        if (edge_length) {
        // Penalty for long edges
          ener += Math.max(0,
            (lineLength(changedEdge.source,
                        changedEdge.target) - tolerate_line) * w_edge_length);
        }
      }
    }
    
    if (edge_node_overlap) {
    // Penalty for edge-node intersection
      for (let i = 0; i < e; i++) {
        for (let n = 0; n < v; n++) {
          if (nodes[n] !== links[i].source && nodes[n] !== links[i].target) {
            let x1 = links[i].source.x,
                x2 = links[i].target.x,
                y1 = links[i].source.y,
                y2 = links[i].target.y,
                cx = nodes[n].x,
                cy = nodes[n].y,
                r = nodes[n].r;

            if (lineCircleIntersect(x1, x2, y1, y2, cx, cy, r)) {
              ener += w_edge_node_overlap;
            } 
          }
        }
      }
    }

    if (node_overlap) {
    // Penalty for node intersection
      for (let i = 0; i < v; i++) {
        for (let j = i+1; j < v; j++) {
          let nx1 = nodes[j].x,
              ny1 = nodes[j].y,
              r1 = nodes[j].r,
              nx2 = nodes[i].x,
              ny2 = nodes[i].y,
              r2 = nodes[i].r;

          if (collision(nx1, ny1, r1, nx2, ny2, r2)) {
            ener += w_node_overlap;
          }
        }

      }
    }
    return ener;
  };
  
  var collision = function(p1x, p1y, r1, p2x, p2y, r2) {
    // Tests collision of two circles
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

  var mcmove = function(currT, old_energy) {
  // Monte Carlo translation move

    if (old_energy < 0) {
      for (let n of nodes) {
        // If this is the first call, randomly move all nodes
        n.x += Math.random() * w;
        n.y += Math.random() * h;
      }
      old_energy = energy();
    }

    // select a random node
    var i = Math.floor(Math.random() * nodes.length);

    // save old coordinates
    var x_old = nodes[i].x;
    var y_old = nodes[i].y;

    // random translation
    nodes[i].x = Math.random() * w;
    nodes[i].y = Math.random() * h;

    var new_energy = energy(i);
    var delta_energy = new_energy - old_energy;

    if (Math.random() >= Math.exp(-delta_energy / currT)) {
      // randomly (considering temperature) decide whether to keep new status
      nodes[i].x = x_old;
      nodes[i].y = y_old;
      return old_energy;
    }
    return new_energy;

  };

  var intersect = function(x1, x2, x3, x4, y1, y2, y3, y4) {
    // Calculates intersection between two lines
    var det, gamma, lambda;
    det = (x2 - x1) * (y4 - y3) - (x4 - x3) * (y2 - y1);
    if (det === 0) {
      return false;
    } else {
      lambda = ((y4 - y3) * (x4 - x1) + (x3 - x4) * (y4 - y1)) / det;
      gamma = ((y1 - y2) * (x4 - x1) + (x2 - x1) * (y4 - y1)) / det;
      return (0 < lambda && lambda < 1) && (0 < gamma && gamma < 1);
    }
  }
  
  var lineCircleIntersect = function(x1, x2, y1, y2, cx, cy, r) {
    // Calculates intersection between a line and a circle
    var b, c, d, u1, u2, v1, v2;
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
    if(isNaN(d)){
        return false;
    }
    u1 = (b - d) / c;
    u2 = (b + d) / c;    
    if(u1 <= 1 && u1 >= 0 || u2 <= 1 && u2 >= 0)
      return true;
    return false;
  }
  
  var lineLength = function( point1, point2 ){
    // Returns the length of a line
    var xs = 0;
    var ys = 0;

    xs = Math.abs(point2.x - point1.x);
    xs = xs * xs;

    ys = Math.abs(point2.y - point1.y);
    ys = ys * ys;

    return Math.sqrt( xs + ys );
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
    var currentEnergy = -1;
    function annealForSweeps(totalSweepsLeft) {
      // Anneal for sweepsPerStep, then update visuals
      let sweepsLeft = Math.min(sweepsPerStep, totalSweepsLeft);
       do {
        currentEnergy = mcmove(currT, currentEnergy);
        currT = cooling_schedule(currT, initialT, nsweeps);
        sweepsLeft -= 1;
      } while (sweepsLeft > 0 && currentEnergy > 0);
      updateFunction(Math.round(currentEnergy));
      totalSweepsLeft -= sweepsPerStep;
      if (totalSweepsLeft > 0 && currentEnergy > 0) {
        setTimeout(() => annealForSweeps(totalSweepsLeft), 0);
      }
    }
    annealForSweeps(nsweeps);
  };

  graphAnneal.width = function(x) {
  // user defined graph width
    if (!arguments.length) return w;
    w = x;
    return graphAnneal;
  };

  graphAnneal.height = function(x) {
  // user defined graph height
    if (!arguments.length) return h;
    h = x;    
    return graphAnneal;
  };

  graphAnneal.nodes = function(x) {
  // user defined label positions
    if (!arguments.length) return nodes;
    nodes = x;
    return graphAnneal;
  };

  graphAnneal.links = function(x) {
  // user defined anchor positions
    if (!arguments.length) return links;
    links = x;
    return graphAnneal;
  };
  
  graphAnneal.updateFunction = function(x) {
  // user defined callback for node updates
    if (!arguments.length) return  updateFunction;
    updateFunction = x;
    return graphAnneal;
  };
  
  graphAnneal.sweepsPerStep = function(x) {
  // user defined amount of iterations between visual updates
    if (!arguments.length) return  sweepsPerStep;
    sweepsPerStep = x;
    return graphAnneal;
  };
  
  graphAnneal.weights = function(x) {
  // user defined weights
    node_overlap = x.nodeIntersection.enabled; // Node-overlap 
    edge_overlap = x.edgeIntersection.enabled; // Edge-overlap
    edge_node_overlap = x.edgeNodeIntersection.enabled; // Edge-Node-overlap
    w_node_overlap = x.nodeIntersection.weight;
    w_edge_overlap = x.edgeIntersection.weight;
    w_edge_node_overlap = x.edgeNodeIntersection.weight;
    w_edge_length = x.edgeLength.weight;
    edge_length = x.edgeLength.enabled;
    tolerate_line = x.edgeLength.tolerated;
    return graphAnneal;
  };

  return graphAnneal;
}
