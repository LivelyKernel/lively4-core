import * as positioning from './positioning.js';

var dragTarget;
var dragOffset;
var isDragging = false;

export function start(e) {
	dragTarget = positioning.elementsUnderMouseEvent(e)[0];
	dragTarget = document.body === dragTarget ? null : dragTarget;
	if (dragTarget) {
		dragOffset = {
			x: e.offsetX,
			y: e.offsetY
		}		
	}
	e.preventDefault();
}

export function move(e) {
	if (dragTarget) {
		dragTarget.style.position = 'absolute';
		isDragging = true;
	}

	if (isDragging) {
		var newPosition = {
			x: positioning.globalMousePosition(e).x - positioning.globalPositionOfNode(dragTarget.offsetParent).x - dragOffset.x,
			y: positioning.globalMousePosition(e).y - positioning.globalPositionOfNode(dragTarget.offsetParent).y - dragOffset.y
		}
		positioning.setNodePosition(dragTarget, newPosition);
		e.preventDefault();
	}
}

export function stop(e) {
	dragTarget = null;
	isDragging = false;
	e.preventDefault();
}