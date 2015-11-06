export function initMorphicTools() {
	initGrabBehaviour();
}

function initGrabBehaviour() {
	var target;
	var isGrabbing = false;
	$("body").on("mousedown", function(evt) {
		var elementsUnterCursor = document.elementsFromPoint(evt.pageX, evt.pageY);
		target = elementsUnterCursor[0];
		evt.preventDefault();
	});
	$("body").on("mousemove", function(evt) {
		if (target) {
			isGrabbing = true;
		}
		if (isGrabbing) {
			var elementsUnterCursor = document.elementsFromPoint(evt.pageX, evt.pageY);
			var droptarget = elementsUnterCursor[0] == target ?
					elementsUnterCursor[1] :
					elementsUnterCursor[0] ;
			droptarget.insertBefore(target, nextSiblingForPosition({
				x: evt.pageX,
				y: evt.pageY
			}, droptarget));
			evt.preventDefault();
		}
	});
	$("body").on("mouseup", function(evt) {
		if (isGrabbing) {
			evt.preventDefault();
			isGrabbing = false;
			target = null;			
		}
	});

	function nextSiblingForPosition(pos, parent) {
		var children = parent.childNodes;
		var nextChildren = []; 
		$(children).each(function (idx, child) {
			if (child.nodeType === 1) {
				var childTop = $(child).offset().top;
				var childLeft = $(child).offset().left;
				var childBottom = childTop + $(child).height();
				var childRight = childLeft + $(child).width();
				var toTheRight = childTop <= pos.y <= childBottom
						&& childLeft > pos.x;
				var below = childTop > pos.y
				if (toTheRight || below) {
					nextChildren.push(child);
				}					
			}
		})
		return nextChildren[0];
	}
}