import Vector2 from "./../external/vector2.js";

	var Node = function() {
	    this.mass = 0;
	    this.d = 0;
	    this.gx = 0;
	    this.gy = 0;
		// TODO: this currently limits the number of different materials that are available
	    this.cgx = [0, 0, 0, 0, 0, 0];
	    this.cgy = [0, 0, 0, 0, 0, 0];
	    this.velocity = Vector2.Zero.copy();
	    this.velocity2 = Vector2.Zero.copy();
	    this.acceleration = Vector2.Zero.copy();
	    
	    this.particleDensity = 0;
	};
	
	export default Node;
