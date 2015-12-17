import * as nodes from './node-helpers.js';
import * as events from './event-helpers.js';
import * as config from './config.js';

var dragOffset = config.DRAG_OFFSET || 0;

var dragTarget;
var dragStartOffset;
var dragStartEventPosition;
var dragStartNodePosition;
var isDragging = false;

export function activate() {
  console.log("using Dragging");
  $("body").on("mousedown", start);
  $("body").on("mousemove", move);
  $("body").on("mouseup", stop);
}

export function deactivate() {
  console.log("deactivate Dragging");
  $("body").off("mousedown", start);
  $("body").off("mousemove", move);
  $("body").off("mouseup", stop);
}

function start(e) {
  dragTarget = events.elementsUnder(e)[0];
  dragTarget = document.body === dragTarget ? null : dragTarget;
  if (dragTarget) {
    dragStartOffset = {
      x: e.offsetX,
      y: e.offsetY
    }
    dragStartNodePosition = {
      x: parseInt(dragTarget.style.left) || 0,
      y: parseInt(dragTarget.style.top) || 0
    }
  }
  dragStartEventPosition = events.globalPosition(e);
  e.preventDefault();
}

function move(e) {
  var eventPosition = events.globalPosition(e);
  if (dragTarget && !isDragging && events.distanceTo(e, dragStartEventPosition) > dragOffset) {
    dragTarget.style.position = 'relative';
    isDragging = true;
  }

  if (isDragging) {
    var newPosition = {
      x: events.globalPosition(e).x - dragStartEventPosition.x + dragStartNodePosition.x,
      y: events.globalPosition(e).y - dragStartEventPosition.y + dragStartNodePosition.y
    }
    nodes.setPosition(dragTarget, newPosition);
    e.preventDefault();
  }
}

function stop(e) {
  if (isDragging) {
    e.preventDefault();
    isDragging = false;
  }
  dragTarget = null;
  dragStartEventPosition = null;
  dragStartNodePosition = null;
}
