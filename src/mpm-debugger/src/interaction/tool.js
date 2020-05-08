import Input from "./input.js";
import Vector2 from "./../external/vector2.js";

	var ToolEvent = mini.Class.subclass({
		initialize: function ToolEvent(tool) {
			this.tool = tool;
		},

		setScreenPosition: function(pos) { this._position = pos; },
		setLastScreenPosition: function(pos) { this._lastPosition = pos; },
		setDownScreenPosition: function(pos) { this._downPosition = pos; },

		getScreenPosition: function() { return this._position; },
		getLastScreenPosition: function() { return this._lastPosition; },
		getDownScreenPosition: function() { return this._downPosition; },

		getLastScreenMiddlePoint: function() {
			var position = this.getScreenPosition();
			var lastPosition = this.getLastScreenPosition();
			return position.add(lastPosition).mulFloat(0.5);
		},
		getDownScreenMiddlePoint: function() {
			var position = this.getScreenPosition();
			var downPosition = this.getDownScreenPosition();
			return position.add(downPosition).mulFloat(0.5);
		},

		_transformToViewport: function(vector, viewport) {
			var worldPos = viewport.screenToWorldCoordinates(vector);
			return worldPos;
		},
		
		getPositionInWorld: function(viewport) {
			return this._transformToViewport(this._position, viewport);
		},
		getLastPositionInWorld: function(viewport) {
			return this._transformToViewport(this._lastPosition, viewport);
		},
		getDownPositionInWorld: function(viewport) {
			return this._transformToViewport(this._downPosition, viewport);
		},
		
		getLastMiddlePointInWorld: function(viewport) {
			var positionInWorld = this.getPositionInWorld(viewport);
			var lastPositionInWorld = this.getLastPositionInWorld(viewport);
			return positionInWorld.add(lastPositionInWorld).mulFloat(0.5);
		},
		getDownMiddlePointInWorld: function(viewport) {
			var positionInWorld = this.getPositionInWorld(viewport);
			var downPositionInWorld = this.getDownPositionInWorld(viewport);
			return positionInWorld.add(downPositionInWorld).mulFloat(0.5);
		},
		
		getLastDelta: function() { return this._position.sub(this._lastPosition); },
		getDownDelta: function() { return this._position.sub(this._downPosition); },
		getLastDeltaInWorld: function(viewport) {
			var positionInWorld = this.getPositionInWorld(viewport);
			var lastPositionInWorld = this.getLastPositionInWorld(viewport);
			return positionInWorld.sub(lastPositionInWorld);
		},
		getDownDeltaInWorld: function(viewport) {
			var positionInWorld = this.getPositionInWorld(viewport);
			var downPositionInWorld = this.getDownPositionInWorld(viewport);
			return positionInWorld.sub(downPositionInWorld);
		},

		getLastDistance: function() { return this._position.distance(this._lastPosition); },
		getDownDistance: function() { return this._position.distance(this._downPosition); },
		getLastDistanceInWorld: function(viewport) {
			var positionInWorld = this.getPositionInWorld(viewport);
			var lastPositionInWorld = this.getLastPositionInWorld(viewport);
			return positionInWorld.distance(lastPositionInWorld);
		},
		getDownDistanceInWorld: function(viewport) {
			var positionInWorld = this.getPositionInWorld(viewport);
			var downPositionInWorld = this.getDownPositionInWorld(viewport);
			return positionInWorld.distance(downPositionInWorld);
		},

		getDistanceToPoint: function(point) { return this._position.distance(point); },
		getDistanceToPointInWorld: function(point, viewport) {
			var toolPositionInWorld = this.getPositionInWorld(viewport);
			return toolPositionInWorld.distance(point);
		},
		// TODO: implement more convenient methods
		getDownCount: function() {},
		getDownTime: function() {},
		hitTest: function(viewport) {},
		nearest: function(viewport) {},
		getDownPath: function() {},
		getDownPathInWorld: function(viewport) {}
	});
	
	var Tool = mini.Class.subclass({
		initialize: function Tool(input) {
			this.input = input;
			this.input.initMouse();
			
			this._downCount = 0;
			
			this._lastPosition = new Vector2(this.input.mouse.x, this.input.mouse.y);
			
			this._activateCallback = function() {};
			this._deactivateCallback = function() {};
			this._mouseDownCallback = function() {};
			this._mouseDragCallback = function() {};
			this._mouseMoveCallback = function() {};
			this._mouseUpCallback = function() {};
			this._keyDownCallbacks = {};
			this._keyUpCallbacks = {};
		},
		
		onActivate: function(callback) { this._activateCallback = callback; },
		onDeactivate: function(callback) { this._deactivateCallback = callback; },
		onMouseDown: function(callback) { this._mouseDownCallback = callback; },
		onMouseDrag: function(callback) { this._mouseDragCallback = callback; },
		onMouseMove: function(callback) { this._mouseMoveCallback = callback; },
		onMouseUp: function(callback) { this._mouseUpCallback = callback; },
		onKeyDown: function(key, callback) { this._keyDownCallbacks[key] = callback; },
		onKeyUp: function(key, callback) { this._keyUpCallbacks[key] = callback; },
		
		activate: function() {
			//this.input.tool.deactivate();
			this.input.tool = this;
			this._activateCallback.call(this);
		},

		deactivate: function() {
			this._deactivateCallback.call(this);
		},

		update: function() {
			var mouseButton = "leftclick";
			var position = new Vector2(this.input.mouse.x, this.input.mouse.y);
			if(this.input.pressed(mouseButton))
				this._downPosition = position.copy();

			var event = new ToolEvent(this);
			event.setScreenPosition(position);
			event.setLastScreenPosition(this._lastPosition || position);
			event.setDownScreenPosition(this._downPosition);
			
			// down
			if(this.input.pressed(mouseButton))
				this._mouseDownCallback.call(this, event);

			// drag
			if(this.input.state(mouseButton))
				this._mouseDragCallback.call(this, event);

			// move
			if(!this.input.state(mouseButton))
				this._mouseMoveCallback.call(this, event);
			
			// up
			if(this.input.released(mouseButton))
				this._mouseUpCallback.call(this, event);
			
			// key down
			var downKeys = Object.keys(this._keyDownCallbacks);
			for(var i = 0; i < downKeys.length; i++) {
				var key = downKeys[i];
				if(this.input.pressed(key))
					this._keyDownCallbacks[key].call(this, event);
			}
			
			// key up
			var upKeys = Object.keys(this._keyUpCallbacks);
			for(var i = 0; i < upKeys.length; i++) {
				var key = upKeys[i];
				if(this.input.released(key))
					this._keyUpCallbacks[key].call(this, event);
			}
			
			this._lastPosition = position.copy();
		}
	});
	
	export default Tool;
