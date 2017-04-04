var Intersection = {
	intersectLineLine: function(a1, a2, b1, b2) {
	    var ua_t = (b2[0] - b1[0]) * (a1[1] - b1[1]) - (b2[1] - b1[1]) * (a1[0] - b1[0]);
	    var ub_t = (a2[0] - a1[0]) * (a1[1] - b1[1]) - (a2[1] - a1[1]) * (a1[0] - b1[0]);
	    var u_b  = (b2[1] - b1[1]) * (a2[0] - a1[0]) - (b2[0] - b1[0]) * (a2[1] - a1[1]);
	
	    if ( u_b != 0 ) {
	        var ua = ua_t / u_b;
	        var ub = ub_t / u_b;
	
	        if ( 0 <= ua && ua <= 1 && 0 <= ub && ub <= 1 ) {
	            return true;
	        }
	    }
	    return false;
	},
	
	intersectLinePolygon: function(a1, a2, points) {
	    var length = points.length;
	
	    for ( var i = 0; i < length; i++ ) {
	        var b1 = points[i];
	        var b2 = points[(i+1) % length];
	        if(Intersection.intersectLineLine(a1, a2, b1, b2)) return true;
	    }
	
	    return false;
	},
	
	intersectPolygonPolygon: function(points1, points2) {
	    var length = points1.length;
	
	    for ( var i = 0; i < length; i++ ) {
	        var a1 = points1[i];
	        var a2 = points1[(i+1) % length];
	        if(Intersection.intersectLinePolygon(a1, a2, points2)) return true;
	    }
	
	    return false;
	},
	
	intersectAABB: function(aabb1, aabb2) {
		return !(
			aabb1.min[0] > aabb2.max[0] ||
			aabb1.min[1] > aabb2.max[1] ||
			aabb1.max[0] < aabb2.min[0] ||
			aabb1.max[1] < aabb2.min[1]);
	},
	
	intersectGeometry: function(geometry1, geometry2) {
		var intersects = _.some(geometry1.coordinates, function(coords1, index1) {
			return _.some(geometry2.coordinates, function(coords2, index2) {
				return Intersection.intersectAABB(geometry1.aabbs[index1], geometry2.aabbs[index2]) &&
					Intersection.intersectPolygonPolygon(coords1, coords2);
			}, this);
		}, this);
		
		return intersects;
	},
	
	intersectStates: function(state1, state2) {
		return Intersection.intersectGeometry(state1.geometry, state2.geometry);
	}
};

//bounding boxes
var AABB = function(min, max) {
	this.min = min;
	this.max = max;
};

AABB.fromPath = function(path) {
	var min = [10000, 10000],
		max = [-10000, -10000];
	
	_.each(path, function(point) {
		if(min[0] > point[0]) min[0] = point[0];
		if(min[1] > point[1]) min[1] = point[1];
		if(max[0] < point[0]) max[0] = point[0];
		if(max[1] < point[1]) max[1] = point[1];
	});
	
	return new AABB(min, max);
};

AABB.prototype.combine = function(aabb2) {
	return new AABB([
	    this.min[0] < aabb2.min[0] ? this.min[0] : aabb2.min[0],
	    this.min[1] < aabb2.min[1] ? this.min[1] : aabb2.min[1]
	    ],
	    [
	    this.max[0] > aabb2.max[0] ? this.max[0] : aabb2.max[0],
	    this.max[1] > aabb2.max[1] ? this.max[1] : aabb2.max[1]
	    ]);
};