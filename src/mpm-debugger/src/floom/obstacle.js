import Vector2 from "./../external/vector2.js";

	var Obstacle = function(x, y, radius) {
		this.position = new Vector2(x, y);
		this.radius = radius;
	};
	
	export default Obstacle;
