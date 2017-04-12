contentLoaded(window, function() {
	var colors = ["red", "green", "blue", "yellow"],
		stateNames = ["AUT", "BEL", "CZE", "FRA", "DEU", "LUX", "NLD", "POL", "CHE"];
	
	// drawing
	var applyPathToContext = function(path, ctx) {
		var last = _.last(path);
		ctx.moveTo(last[0], last[1]);
		_.each(path, function(point) {
			ctx.lineTo(point[0], point[1]);
		});
	};
	
	var drawMultipolygon = function(polygon, ctx) {
		ctx.beginPath();
		_.each(polygon.coordinates, function(coords) {
			applyPathToContext(coords, ctx);
		});
		ctx.closePath();
		ctx.fill();
		ctx.stroke();
	};
	
	var loaded = function(error /*, states ... */) {
	    var solver = bbb.defaultSolver = new csp.Solver();
	    
	    // prepare data
		var states = _.chain(arguments)
			.filter(function(state, index) {
				return index !== 0;
			})
			.pluck("features")
			.pluck(0)
			.map(function(state) {
				var geometry = state.geometry;
				if(geometry.type === "Polygon")
					geometry.coordinates = [geometry.coordinates];
				geometry.coordinates = _.pluck(geometry.coordinates, 0);
				return {
					geometry: geometry,
					name: state.properties.name,
					color: colors[0]
				};
			})
			.map(function(state) {
				state.geometry.aabbs = _.map(state.geometry.coordinates, AABB.fromPath);
				return state;
			})
			.value();

		// define domains for colors
		_.each(states, function(state, index) {
			always: { state.color.is in colors }
		});

		// ... and constrain neighbored countries
		_.each(states, function(state1, index1) {
			_.each(states, function(state2, index2) {
				if(index1 < index2 && Intersection.intersectStates(state1, state2)) {
					console.log(state1.name + " - " + state2.name);
					always: { state1.color != state2.color }
				}
			}, this);
		}, this);

		var worldAABB = _.reduce(states, function(mem, state) {
			var stateAABB = _.reduce(state.geometry.aabbs, function(mem, aabb) {
				return mem.combine(aabb);
			});
			return mem.combine(stateAABB);
		}, new AABB([], []));
		
		// prepare canvas
		var worldWidth = worldAABB.max[0] - worldAABB.min[0],
			worldHeight = worldAABB.max[1] - worldAABB.min[1],
			canvasWidth = 800,
			canvasHeight = worldHeight / worldWidth * canvasWidth,
			c = document.getElementById("canvas"),
			ctx = c.getContext("2d");
		
		c.width = canvasWidth;
		c.height = canvasHeight;
		
		ctx.strokeStyle = "black";
		ctx.lineWidth = 1/8;
		
		ctx.save();
		
		ctx.translate(canvasWidth / 2, canvasHeight / 2);
		ctx.scale(canvasWidth, canvasHeight);
		ctx.scale(1, -1);
		ctx.scale(1 / worldWidth, 1 / worldHeight);
		ctx.translate(
			-(worldAABB.max[0] + worldAABB.min[0])/2,
			-(worldAABB.max[1] + worldAABB.min[1])/2
		);
		
		// draw polygons
		_.each(states, function(state) {
			ctx.fillStyle = state.color;
			drawMultipolygon(state.geometry, ctx);
		});
		
		ctx.restore();
	};

	var q = queue();
	_.each(stateNames, function(state) {
		q.defer(d3.json, "countries/" + state + ".geo.json");
	});
	q.await(loaded);
});
