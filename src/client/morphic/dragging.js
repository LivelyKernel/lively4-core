import * as nodes from './node-helpers.js';
import * as events from './event-helpers.js';
import * as config from './config.js';

var dragOffset = config.DRAG_OFFSET || 0;

var dragTarget;
var dragStartOffset;
var isDragging = false;
var dragStartPosition;

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
  }
  dragStartPosition = events.globalPosition(e);
  e.preventDefault();
}

function move(e) {
  var eventPosition = events.globalPosition(e);
  if (dragTarget && !isDragging && events.distanceTo(e, dragStartPosition) > dragOffset) {
    nodes.setPositionMode(dragTarget, 'absolute');
    isDragging = true;
  }

  if (isDragging) {
    var newPosition = {
      x: events.globalPosition(e).x - nodes.globalPosition(dragTarget.offsetParent).x - dragStartOffset.x,
      y: events.globalPosition(e).y - nodes.globalPosition(dragTarget.offsetParent).y - dragStartOffset.y
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
  dragStartPosition = null;
}
