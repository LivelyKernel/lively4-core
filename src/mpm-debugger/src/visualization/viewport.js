import Vector2 from "./../external/vector2.js";

	var Viewport = mini.Class.subclass({
		initialize: function(canvas, middlePoint, extent) {
			this.canvas = canvas;
			this.point = middlePoint;
			this.extent = extent;

			// scaling
			this.scaleX = d3.scale.linear();
			this.scaleY = d3.scale.linear();

			this.resetScaleRange();
			this.updateScales();
		},
	
		screenToWorldCoordinates: function(vector) {
			return new Vector2(
				this.scaleX.invert(vector.x),
				this.scaleY.invert(vector.y)
			);
		},
	
		worldToScreenCoordinates: function(vector) {
			return new Vector2(
				this.scaleX(vector.x),
				this.scaleY(vector.y)
			);
		},
	
		jumpToPoint: function(vector) {
			this.point.set(vector);
			this.updateScales();
		},
	
		translateBy: function(vector) {
			this.point.addSelf(this.extent.divVector(
				new Vector2(this.canvas.width, -this.canvas.height)
			).mulVector(vector));
			this.updateScales();
		},
		
		zoomIn: function() {
			this.extent.mulFloatSelf(1.1);
			this.updateScales();
		},

		zoomOut: function() {
			this.extent.mulFloatSelf(0.9);
			this.updateScales();
		},
		
		updateScales: function() {
			var middlePoint = this.point;
			var extend = this.extent;
			
			this.scaleX.domain([
				middlePoint.x - extend.x / 2,
				middlePoint.x + extend.x / 2
			]);
			this.scaleY.domain([
				middlePoint.y - extend.y / 2,
				middlePoint.y + extend.y / 2
			]);
		},
		
		// Ranges are given in screen coordinates.
		resetScaleRange: function() {
			this.scaleX.range([0, this.canvas.width]);
			this.scaleY.range([this.canvas.height, 0]);
		}
	});
	
	export default Viewport;
