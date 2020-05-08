import Node from "./node.js";
import Vector2 from "./../external/vector2.js";
import AABB from "./../external/aabb.js";

	var Grid = function(){
		this.arr = [];
		this.activeCount = 0;
		this.gsizeY = 0;
		this.boundaries = new AABB();
		this.cellSize = Vector2.One.copy();
	};

	Grid.prototype.update = function(system) {
	    this.recalculateBoundaries(system);
		this.clear();
		this.recalculateSizeY();
	};

	// TODO: reuse old grid
	Grid.prototype.clear = function() {
		this.arr.length = 0;
		this.activeCount = 0;
	};

	Grid.prototype.iterate = function(fn, context) {
		var numberOfNodes = this.arr.length;
		for(var nIndex = 0; nIndex < numberOfNodes; nIndex++) {
			var n = this.arr[nIndex];
			if (n) { fn.call(context, n); }
		}
	};

	Grid.prototype.getAt = function(cellX, cellY) {
		return this.arr[cellX * this.gsizeY + cellY];
	};
	
	Grid.prototype.getOrCreateAt = function(cellX, cellY) {
		var cell = cellX * this.gsizeY + cellY;
		var node = this.arr[cell];
		
		if(node === undefined) {
			this.arr[cell] = node = new Node();
			this.activeCount++;
		}
		
		return node;
	};
	
	Grid.prototype.recalculateBoundaries = function(system) {
	    // expand boundaries to include all particles
	    this.boundaries.clear();
	    _.each(system.particles, function(p) {
	    	this.boundaries.expandToInclude(p.position);
	    }, this);

		// expand boundaries a bit further
		this.boundaries.Min.x = Math.floor(this.boundaries.Min.x-1);
		this.boundaries.Min.y = Math.floor(this.boundaries.Min.y-1);
		this.boundaries.Max.x = Math.floor(this.boundaries.Max.x+3);
		this.boundaries.Max.y = Math.floor(this.boundaries.Max.y+3);
	};
	
	Grid.prototype.recalculateSizeY = function() {
		this.gsizeY = Math.floor(this.boundaries.Max.y-this.boundaries.Min.y);
	};
	
	export default Grid;
