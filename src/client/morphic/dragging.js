import * as nodes from './node-helpers.js';
import * as events from './event-helpers.js';

var dragTarget;
var dragStartEventPosition;
var dragStartNodePosition;
export var isDragging = false;

export function start(e) {
  dragTarget = window.that;
  if (dragTarget) {
    initDraggingAtEvent(e);
  }
}

export function move(e) {
  if (dragTarget) {
    startOffsetDragging(e);
  }
  if (isDragging) {
    dragTo(e);
  }
}

export function stop(e) {
  if (isDragging) {
    stopDraggingAtEvent(e);
  }
  tearDownDragging();
}

function tearDownDragging() {
  dragTarget = null;
  dragStartEventPosition = null;
  dragStartNodePosition = null;
}

function initDraggingAtEvent(anEvent) {
  dragStartNodePosition = nodes.getPosition(dragTarget);
  dragStartEventPosition = events.globalPosition(anEvent);
  anEvent.preventDefault();
}

function startOffsetDragging(anEvent) {
  if (!isDragging && events.noticableDistanceTo(anEvent, dragStartEventPosition)) {
    dragTarget.style.position = 'absolute';
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
  anEvent.preventDefault();
}
