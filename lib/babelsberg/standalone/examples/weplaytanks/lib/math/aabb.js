var Invalid = true;
var Valid = false;

var AABB = function(minPt, maxPt) {
	this.Min = minPt || Vector2.Zero.copy();
	this.Max = maxPt || Vector2.Zero.copy();
	this.Validity = typeof minPt === "undefined" ? Invalid : Valid;
};	

AABB.prototype.clear = function() {
	this.Min.set(Vector2.Zero);
	this.Max.set(Vector2.Zero);
	this.Validity = Invalid;
};	

AABB.prototype.expandToInclude = function(pt) {
	if (this.Validity == Valid) {
		if (pt.x < this.Min.x) {
			this.Min.x = pt.x;
		} else if (pt.x > this.Max.x) {
			this.Max.x = pt.x;
		}
		
		if (pt.y < this.Min.y) {
			this.Min.y = pt.y;
		} else if (pt.y > this.Max.y) {
			this.Max.y = pt.y;
		}
	} else {
		this.Min.set(pt);
		this.Max.set(pt);
		this.Validity = Valid;
	};
};	

AABB.prototype.contains = function(pt) {
	if (this.Validity == Invalid) { return false; };

	return ((pt.x >= this.Min.x) && (pt.x <= this.Max.x) && (pt.y >= this.Min.y) && (pt.y <= this.Max.y));
};

AABB.prototype.containsAABB = function(other) {
	if (this.Validity == Invalid) { return false; };
	if (other.Validity == Invalid) { return false; };
	
	return (other.Min.x >= this.Min.x) &&
		(other.Max.x <= this.Max.x) &&
		(other.Min.y >= this.Min.y) &&
		(other.Max.y <= this.Max.y);
};

AABB.prototype.intersects = function(box) {
		var overlapX = ((this.Min.x <= box.Max.x) && (this.Max.x >= box.Min.x));
		var overlapY = ((this.Min.y <= box.Max.y) && (this.Max.y >= box.Min.y));
		
		return (overlapX && overlapY);
};	

AABB.prototype.getSize = function() { return this.Max.sub(this.Min); };

AABB.prototype.getMiddle = function() {
	return this.Min.add(this.Max.sub(this.Min).mulFloat(0.5));
};
AABB.prototype.getTopLeft = function() {
	return this.Min;
};
AABB.prototype.getTopRight = function() {
	return new Vector2(this.Max.x, this.Min.y);
};
AABB.prototype.getBottomLeft = function() {
	return new Vector2(this.Min.x, this.Max.y);
};
AABB.prototype.getBottomRight = function() {
	return this.Max;
};
AABB.prototype.subdivide = function() {
	var min = this.Min,
		middle = this.getMiddle(),
		max = this.Max;
	
	var i = new AABB(min, middle);
	return [
		new AABB(min, middle),
		new AABB(new Vector2(middle.x, min.y), new Vector2(max.x, middle.y)),
		new AABB(new Vector2(min.x, middle.y), new Vector2(middle.x, max.y)),
		new AABB(middle, max)
	];
};

AABB.prototype.debugDraw = function(debugDraw) {
	debugDraw.drawPolyline([
			this.Min,
			new Vector2(this.Min.x, this.Max.y),
			this.Max,
			new Vector2(this.Max.x, this.Min.y),
			this.Min
		],
		"red",
		1.0,
		1
	);
};
