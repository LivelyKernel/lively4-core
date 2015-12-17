import * as events from './event-helpers.js';
import * as nodes from './node-helpers.js';
import * as config from './config.js';

var grabOffset = config.GRAB_OFFSET || 0;

var grabTarget;
var grabStartEventPosition;
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
  grabTarget = events.getTargetNode(e);
  if (grabTarget) {
    initGrabbingAtEvent(e);
  }
}

function move(e) {
  if (grabTarget) {
    startOffsetGrabbing(e);
  }
  if (isGrabbing) {
    moveGrabbedNodeToEvent(e);
  }
}

function stop(e) {
  if (isGrabbing) {
    stopGrabbingAtEvent(e);
  }
}

function initGrabbingAtEvent(anEvent) {
  grabStartEventPosition = events.globalPosition(anEvent);
  anEvent.preventDefault();
}

function startOffsetGrabbing(anEvent) {
  if (!isGrabbing && events.noticableDistanceTo(anEvent, grabStartEventPosition)) {
    grabTarget.style.position = 'relative';
    grabTarget.style.removeProperty('top');
    grabTarget.style.removeProperty('left');
    isGrabbing = true;
  }
}

function moveGrabbedNodeToEvent(anEvent) {
  dropAtEvent(grabTarget, anEvent);
  anEvent.preventDefault();
}

function stopGrabbingAtEvent(anEvent) {
  anEvent.preventDefault();
  isGrabbing = false;
  grabTarget = null;
  grabStartEventPosition = null;
}

function dropAtEvent(node, e) {
  var droptarget = droptargetAtEvent(node, e);
  if (droptarget) {
    var pos = {
      x: e.pageX,
      y: e.pageY
    }
    moveNodeToTargetAtPosition(node, droptarget, pos);
  }
}

function droptargetAtEvent(node, e) {
  var elementsUnderCursor = events.elementsUnder(e);
  for (var i = 0; i < elementsUnderCursor.length; i++) {
    var targetNode = elementsUnderCursor[i];
    if (canDropInto(node, targetNode)) {
      return targetNode;
    }
  }
}

function moveNodeToTargetAtPosition(node, targetNode, pos) {
  var children = targetNode.childNodes;
  var nextChild = Array.from(children).find(child => {
    return child.nodeType === 1 && nodeComesBehind(child, pos);
  });
  targetNode.insertBefore(node, nextChild);
}

function canDropInto(node, targetNode) {
  return node !== targetNode &&
    $.inArray(targetNode.tagName.toLowerCase(), config.droppingBlacklist[node.tagName.toLowerCase()] || []) < 0 &&
    $.inArray(targetNode.tagName.toLowerCase(), config.droppingBlacklist['*'] || []) < 0
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
