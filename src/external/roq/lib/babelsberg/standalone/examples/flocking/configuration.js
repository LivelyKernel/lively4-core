Object.subclass("Configuration", {
	initialize: function(renderer) {
		this.renderer = renderer;
	},
	
	/*
	 * Configure Drawing
	 */
	setFillStyle: function(color) {
		this.color = color || "white";
		this.renderer.context.fillStyle = this.color;
	},
	
	setStrokeStyle: function(color) {
		this.color = color || "white";
		this.renderer.context.strokeStyle = this.color;
	},
	
	setGlobalAlpha: function(opacity) {
		this.opacity = opacity || 1.0;
		this.renderer.context.globalAlpha = this.opacity;
	},
	
	setLineWidth: function(lineWidth) {
		this.lineWidth = this.renderer.singlePixelExtent.x * (lineWidth || 1.0);
		this.renderer.context.lineWidth = this.lineWidth;
	},
	
	setTextBaseline: function(baseline) {
		this.baseline = baseline || "bottom";
		this.renderer.context.textBaseline = this.baseline;
	}
});
