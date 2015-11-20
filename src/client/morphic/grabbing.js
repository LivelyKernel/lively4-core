import * as positioning from './positioning.js';

var grabTarget;
var grabStartPosition;
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
  grabStartPosition = positioning.globalMousePosition(e);
  e.preventDefault();
}

function move(e) {
  var eventPosition = positioning.globalMousePosition(e);
  if (grabTarget && !isGrabbing && positioning.exceedsOffset(grabStartPosition, eventPosition)) {
    positioning.setMode(grabTarget, 'relative');
    isGrabbing = true;
  }
  if (isGrabbing) {
    var elementsUnterCursor = positioning.elementsUnderMouseEvent(e);
    var droptarget = elementsUnterCursor[0] == grabTarget ?
        elementsUnterCursor[1] :
        elementsUnterCursor[0] ;
    var pos = {
      x: e.pageX,
      y: e.pageY
    }
    moveNodeToTargetAtPosition(grabTarget, droptarget, pos);
    e.preventDefault();
  }
}

function stop(e) {
  if (isGrabbing) {
    e.preventDefault();
    isGrabbing = false;
  }
  grabTarget = null;
  grabStartPosition = null;
}

function moveNodeToTargetAtPosition(node, targetNode, pos) {
  var children = targetNode.childNodes;
  var nextChild = Array.from(children).find(child => {
    return child.nodeType === 1 && nodeComesBehind(child, pos);
  });
  targetNode.insertBefore(node, nextChild);
}

function nodeComesBehind(node, pos) {
  var childTop = $(node).offset().top;
  var childLeft = $(node).offset().left;
  var childBottom = childTop + $(node).height();
  var childRight = childLeft + $(node).width();
  var toTheRight = childTop <= pos.y <= childBottom
      && childLeft > pos.x;
  var below = childTop > pos.y;
  return toTheRight || below;
}
