/**
For now a copy of the d3 labeler from https://github.com/tinker10/D3-Labeler, to be adjusted with our own functions
*/
import d3 from "src/external/d3.v5.js"

(function() {

d3.graphAnneal = function() {
  var nodes = [],
      links = [],
      w = 1, // box width
      h = 1, // box width
      graphAnneal = {};

  var max_move = 5.0;

  // booleans for user defined functions
  var user_energy = false,
      user_defined_energy,
      user_schedule = false,
      user_defined_schedule;

  var energy = function(index) {
  // energy function, to be tailored for node placement

      var v = nodes.length,
          e = links.length,
          ener = 0;
    
      for (var i = 0; i < e; i++) {
        // Penalty for edge intersection
      }

      for (i = 0; i < v; i++) {
        if (i != index) {
          // Penalty for node intersection
        }

      }
      return ener;
  };

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
  // Not sure if we need this still, but ill keep it for now
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

  var cooling_schedule = function(currT, initialT, nsweeps) {
  // linear cooling
    return (currT - (initialT / nsweeps));
  }

  graphAnneal.start = function(nsweeps) {
  // main simulated annealing function
      var m = nodes.length,
          currT = 1.0,
          initialT = 1.0;

      for (var i = 0; i < nsweeps; i++) {
        for (var j = 0; j < m; j++) { 
          mcmove(currT);
        }
        currT = cooling_schedule(currT, initialT, nsweeps);
      }
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

  return graphAnneal;
};

})();
