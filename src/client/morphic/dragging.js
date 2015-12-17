import * as nodes from './node-helpers.js';
import * as events from './event-helpers.js';
import * as config from './config.js';

var dragOffset = config.DRAG_OFFSET || 0;

var dragTarget;
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
  dragTarget = events.getTargetNode(e);
  if (dragTarget) {
    initGrabbingAtEvent(e);
  }
}

function move(e) {
  if (dragTarget) {
    startOffsetDragging(e);
  }
  if (isDragging) {
    dragTo(e);
  }
}

function stop(e) {
  if (isDragging) {
    stopDraggingAtEvent(e);
  }
}

function initGrabbingAtEvent(anEvent) {
  dragStartNodePosition = nodes.getPosition(dragTarget);
  dragStartEventPosition = events.globalPosition(anEvent);
  anEvent.preventDefault();
}

function startOffsetDragging(anEvent) {
  if (!isDragging && events.noticableDistanceTo(anEvent, dragStartEventPosition)) {
    dragTarget.style.position = 'relative';
    isDragging = true;
  }
}

function dragTo(anEvent) {
  var eventPosition = events.globalPosition(anEvent);
  var newPosition = {
    x: eventPosition.x - dragStartEventPosition.x + dragStartNodePosition.x,
    y: eventPosition.y - dragStartEventPosition.y + dragStartNodePosition.y
  }
  nodes.setPosition(dragTarget, newPosition);
  anEvent.preventDefault();
}

function stopDraggingAtEvent(anEvent) {
  isDragging = false;
  dragTarget = null;
  dragStartEventPosition = null;
  dragStartNodePosition = null;
  anEvent.preventDefault();
}
