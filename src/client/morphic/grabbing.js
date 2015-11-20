import * as positioning from './positioning.js';

var grabTarget;
var isGrabbing = false;

export function activate() {
	console.log("using Grabbing");
	$("body").on("mousedown", start);
	$("body").on("mousemove", move);
	$("body").on("mouseup", stop);
}

export function deactivate() {
	console.log("deactivate Grabbing");
	$("body").off("mousedown", start);
	$("body").off("mousemove", move);
	$("body").off("mouseup", stop);
}

function start(e) {
	grabTarget = positioning.elementsUnderMouseEvent(e)[0];
	grabTarget = document.body === grabTarget ? null : grabTarget;
	e.preventDefault();
}

function move(e) {
	if (grabTarget) {
		grabTarget.style.removeProperty('position');
		grabTarget.style.removeProperty('top');
		grabTarget.style.removeProperty('left');
		isGrabbing = true;
	}
	if (isGrabbing) {
		var elementsUnterCursor = positioning.elementsUnderMouseEvent(e);
		var droptarget = elementsUnterCursor[0] == grabTarget ?
				elementsUnterCursor[1] :
				elementsUnterCursor[0] ;
		var children = droptarget.childNodes;
		var nextChildren = []; 
		$(children).each(function (idx, child) {
			if (child.nodeType === 1) {
				var childTop = $(child).offset().top;
				var childLeft = $(child).offset().left;
				var childBottom = childTop + $(child).height();
				var childRight = childLeft + $(child).width();
				var toTheRight = childTop <= e.pageY <= childBottom
						&& childLeft > e.pageX;
				var below = childTop > e.pageY
				if (toTheRight || below) {
					nextChildren.push(child);
				}					
			}
		})
		droptarget.insertBefore(grabTarget, nextChildren[0]);
		e.preventDefault();
	}
}

function stop(e) {
	if (isGrabbing) {
		e.preventDefault();
		isGrabbing = false;
		grabTarget = null;
	}
}